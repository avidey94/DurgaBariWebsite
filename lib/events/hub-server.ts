import "server-only";
import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";
import { computeVisibilityForUser } from "./server";
import { expandOccurrences, type CalendarEvent } from "./calendar";
import {
  monthDays,
  pacificDay,
  shiftDay,
  type CalendarMonthData,
  type HubEvent,
  type CalendarRsvp,
} from "./hub";
import { pacificLocalToIso, toPacificLocal } from "./timezone";

// This response is personalized. Never put it in a shared or offline cache.
export async function getCalendarMonth(month: string): Promise<CalendarMonthData> {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) throw new Error("Calendar unavailable");
  const days = monthDays(month);
  const from = pacificLocalToIso(`${shiftDay(days[0], -31)}T00:00`)!;
  const to = pacificLocalToIso(`${shiftDay(days[days.length - 1], 1)}T00:00`)!;
  const [access, user] = await Promise.all([computeVisibilityForUser(), getCurrentUser()]);
  const visibility = access.includePrivate
    ? ["public", "members", "private"]
    : access.includeMembers
      ? ["public", "members"]
      : ["public"];
  const [eventResult, reservationResult, hiddenBlocksResult] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, slug, title, short_summary, full_description, description, event_type, category, start_time, end_time, all_day, recurrence, recurrence_until, location, cover_image_url, publish_status, visibility, blocks_reservations, timezone, is_rsvp_enabled, capacity",
      )
      .eq("publish_status", "published")
      .in("visibility", visibility)
      .lte("start_time", to)
      .order("start_time", { ascending: true })
      .limit(1000),
    supabase
      .from("event_reservations")
      .select("id, event_date, start_time, end_time")
      .eq("status", "approved")
      .gte("event_date", days[0])
      .lte("event_date", days[days.length - 1])
      .limit(1000),
    // Read times only for gatherings this visitor cannot view. Never select their names.
    supabase
      .from("events")
      .select("id, start_time, end_time, all_day, recurrence, recurrence_until")
      .eq("publish_status", "published")
      .eq("blocks_reservations", true)
      .not("visibility", "in", `(${visibility.join(",")})`)
      .lte("start_time", to)
      .limit(1000),
  ]);
  if (eventResult.error) throw new Error("Calendar unavailable");
  const records = eventResult.data ?? [];
  const rsvps = new Map<string, CalendarRsvp>();
  let rsvpUnavailable = false;
  if (user?.id && records.length) {
    const result = await supabase
      .from("event_rsvps")
      .select("event_id, status, headcount")
      .eq("user_id", user.id)
      .in(
        "event_id",
        records.map((event) => event.id),
      );
    rsvpUnavailable = Boolean(result.error);
    for (const row of result.data ?? [])
      rsvps.set(row.event_id, { status: row.status, headcount: row.headcount });
  }
  const events: HubEvent[] = records
    .flatMap((record) => {
      const event = record as unknown as CalendarEvent;
      return expandOccurrences(event, from, to, 1000)
        .filter((entry) => {
          const start = pacificDay(entry.occurrenceStart);
          const end = pacificDay(entry.occurrenceEnd ?? entry.occurrenceStart);
          return start <= days[days.length - 1] && end >= days[0];
        })
        .map((entry) => ({
          key: entry.occurrenceKey,
          eventId: event.id,
          slug: event.slug ?? event.id,
          title: event.title,
          summary: event.short_summary,
          description: event.full_description ?? record.description,
          type: event.event_type,
          start: entry.occurrenceStart,
          end: entry.occurrenceEnd,
          allDay: event.all_day,
          visibility: event.visibility,
          location: event.location,
          image: event.cover_image_url,
          recurring: Boolean(event.recurrence),
          blocksSpace: Boolean(event.blocks_reservations),
          isRsvpEnabled: Boolean(record.is_rsvp_enabled) && event.visibility !== "private",
          capacity: record.capacity,
          rsvp: rsvps.get(event.id) ?? null,
        }));
    })
    .sort((a, b) => a.start.localeCompare(b.start));
  return {
    month,
    events,
    // Private reservation names, booking references, and IDs never leave the server.
    reservations: [
      ...(reservationResult.data ?? []).map((row, index) => ({
        key: `reserved-${index}`,
        start: `${row.event_date}T${String(row.start_time).slice(0, 5)}`,
        end: `${row.event_date}T${String(row.end_time).slice(0, 5)}`,
      })),
      ...(hiddenBlocksResult.data ?? []).flatMap((record, index) =>
        expandOccurrences(record as CalendarEvent, from, to, 1000).map(
          (entry, occurrenceIndex) => ({
            key: `unavailable-${index}-${occurrenceIndex}`,
            start: toPacificLocal(entry.occurrenceStart),
            end: entry.occurrenceEnd
              ? toPacificLocal(entry.occurrenceEnd)
              : `${shiftDay(pacificDay(entry.occurrenceStart), 1)}T00:00`,
          }),
        ),
      ),
    ],
    signedIn: Boolean(user),
    canRsvp: Boolean(user?.id),
    isMember: access.includeMembers,
    availabilityUnavailable: Boolean(reservationResult.error || hiddenBlocksResult.error),
    rsvpUnavailable,
  };
}
