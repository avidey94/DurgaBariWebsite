import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { expandOccurrences, type CalendarEvent } from "@/lib/events/calendar";
import { toPacificLocal } from "@/lib/events/timezone";

export interface SpaceCalendarEntry {
  id: string;
  source: "event" | "reservation";
  title: string;
  start: string;
  end: string;
  blocksSpace: boolean;
  visibility: "public" | "members" | "private";
  href: string | null;
}

const padDate = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

export const overlaps = (startA: string, endA: string, startB: string, endB: string) =>
  startA < endB && endA > startB;

export async function listSpaceCalendarEntries(fromDate: string, toDate: string): Promise<SpaceCalendarEntry[]> {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) throw new Error("Calendar data is unavailable.");

  // Include occurrences that start before the visible range and continue into it.
  const expansionStart = `${padDate(fromDate, -31)}T00:00:00Z`;
  const expansionEnd = `${padDate(toDate, 2)}T23:59:59Z`;
  const [eventsResult, reservationsResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, slug, title, short_summary, full_description, event_type, category, start_time, end_time, all_day, recurrence, recurrence_until, location, cover_image_url, publish_status, visibility, blocks_reservations, cta_text, volunteer_notes, max_volunteer_count, timezone, created_at, updated_at")
      .eq("publish_status", "published")
      .lte("start_time", expansionEnd)
      .limit(1000),
    supabase
      .from("event_reservations")
      .select("id, booking_reference, event_title, event_date, start_time, end_time")
      .eq("status", "approved")
      .gte("event_date", padDate(fromDate, -1))
      .lte("event_date", toDate)
      .limit(1000),
  ]);

  if (eventsResult.error || reservationsResult.error) {
    throw new Error("Could not load the Durga Bari calendar.");
  }

  const rangeStart = `${fromDate}T00:00`;
  const rangeEnd = `${padDate(toDate, 1)}T00:00`;
  const eventEntries = (eventsResult.data ?? []).flatMap((record) => {
    const event = record as CalendarEvent & { blocks_reservations: boolean };
    return expandOccurrences(event, expansionStart, expansionEnd, 1000).flatMap((occurrence) => {
      const start = toPacificLocal(occurrence.occurrenceStart);
      const end = occurrence.occurrenceEnd
        ? toPacificLocal(occurrence.occurrenceEnd)
        : event.all_day
          ? `${padDate(start.slice(0, 10), 1)}T00:00`
          : start;
      if (!overlaps(start, end, rangeStart, rangeEnd) && !(start >= rangeStart && start < rangeEnd)) return [];
      return [{
        id: occurrence.occurrenceKey,
        source: "event" as const,
        title: event.title,
        start,
        end,
        blocksSpace: event.blocks_reservations,
        visibility: event.visibility,
        href: `/events-festivals/${event.slug ?? event.id}?occurrenceStart=${encodeURIComponent(occurrence.occurrenceStart)}`,
      }];
    });
  });

  const reservationEntries = (reservationsResult.data ?? []).map((reservation) => ({
    id: reservation.id as string,
    source: "reservation" as const,
    title: `${reservation.event_title} · ${reservation.booking_reference}`,
    start: `${reservation.event_date}T${String(reservation.start_time).slice(0, 5)}`,
    end: `${reservation.event_date}T${String(reservation.end_time).slice(0, 5)}`,
    blocksSpace: true,
    visibility: "private" as const,
    href: "/admin/reservations",
  }));

  return [...eventEntries, ...reservationEntries]
    .filter((entry) => overlaps(entry.start, entry.end, rangeStart, rangeEnd) || (entry.start >= rangeStart && entry.start < rangeEnd))
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function visibleSpaceCalendarEntries(
  entries: SpaceCalendarEntry[],
  access: { admin: boolean; member: boolean },
): SpaceCalendarEntry[] {
  return entries.flatMap((entry) => {
    if (access.admin || entry.visibility === "public" || (access.member && entry.visibility === "members")) {
      return [entry];
    }
    return entry.blocksSpace ? [{ ...entry, title: "Reserved", href: null }] : [];
  });
}

export async function findSpaceConflict(
  date: string,
  startTime: string,
  endTime: string,
  exclude?: { source: "event" | "reservation"; id: string },
) {
  const entries = await listSpaceCalendarEntries(date, date);
  const start = `${date}T${startTime}`;
  const end = `${date}T${endTime}`;
  return entries.find((entry) => {
    if (!entry.blocksSpace || !overlaps(entry.start, entry.end, start, end)) return false;
    if (!exclude) return true;
    if (exclude.source === "reservation") return entry.source !== "reservation" || entry.id !== exclude.id;
    return entry.source !== "event" || !entry.id.startsWith(`${exclude.id}:`);
  }) ?? null;
}

export async function findEventSpaceConflict(candidate: Pick<CalendarEvent,
  "id" | "start_time" | "end_time" | "recurrence" | "recurrence_until" | "publish_status" | "blocks_reservations"
>): Promise<SpaceCalendarEntry | null> {
  if (candidate.publish_status !== "published" || !candidate.blocks_reservations) return null;
  if (!candidate.end_time || new Date(candidate.end_time) <= new Date(candidate.start_time)) {
    throw new Error("A space-blocking event needs an end time after its start.");
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) throw new Error("Calendar data is unavailable.");
  const { data: latestBooking, error } = await supabase
    .from("event_reservations")
    .select("event_date")
    .eq("status", "approved")
    .order("event_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Could not check approved bookings.");

  const start = new Date(candidate.start_time);
  const fromDate = toPacificLocal(candidate.start_time).slice(0, 10);
  const oneYearOut = new Date(Math.max(start.getTime(), Date.now()) + 366 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);
  const toDate = [oneYearOut, latestBooking?.event_date ?? ""]
    .filter(Boolean)
    .sort()
    .at(-1) ?? oneYearOut;
  const candidateOccurrences = expandOccurrences(
    candidate as CalendarEvent,
    `${padDate(fromDate, -1)}T00:00:00Z`,
    `${padDate(toDate, 2)}T23:59:59Z`,
    4000,
  );
  const entries = await listSpaceCalendarEntries(fromDate, toDate);
  for (const occurrence of candidateOccurrences) {
    const occurrenceStart = toPacificLocal(occurrence.occurrenceStart);
    const occurrenceEnd = toPacificLocal(occurrence.occurrenceEnd ?? occurrence.occurrenceStart);
    const conflict = entries.find((entry) =>
      entry.blocksSpace &&
      !(entry.source === "event" && entry.id.startsWith(`${candidate.id}:`)) &&
      overlaps(occurrenceStart, occurrenceEnd, entry.start, entry.end),
    );
    if (conflict) return conflict;
  }
  return null;
}
