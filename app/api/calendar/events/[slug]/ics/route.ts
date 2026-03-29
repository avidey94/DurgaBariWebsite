import { NextResponse } from "next/server";

import { buildEventIcs, expandOccurrences, type CalendarEvent } from "@/lib/events/calendar";
import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { computeVisibilityForUser } from "@/lib/events/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const occurrenceStart = new URL(request.url).searchParams.get("occurrenceStart");
  const visibility = await computeVisibilityForUser();

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const { data } = await supabase
    .from("events")
    .select(
      "id, slug, title, short_summary, full_description, event_type, category, start_time, end_time, all_day, recurrence, recurrence_until, location, cover_image_url, publish_status, visibility, cta_text, volunteer_notes, max_volunteer_count, timezone, created_at, updated_at",
    )
    .or(`id.eq.${slug},slug.eq.${slug}`)
    .eq("publish_status", "published")
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ message: "Event not found." }, { status: 404 });
  }

  if (data.visibility === "private" && !visibility.includePrivate) {
    return NextResponse.json({ message: "Event not found." }, { status: 404 });
  }

  if (data.visibility === "members" && !visibility.includeMembers) {
    return NextResponse.json({ message: "Members-only event." }, { status: 403 });
  }

  const event = data as CalendarEvent;
  const fallbackOccurrence = {
    event,
    occurrenceStart: event.start_time,
    occurrenceEnd: event.end_time,
    occurrenceKey: `${event.id}:${event.start_time}`,
  };

  const occurrence = occurrenceStart
    ? expandOccurrences(
        event,
        new Date(new Date(occurrenceStart).getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(new Date(occurrenceStart).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        20,
      ).find((entry) => entry.occurrenceStart === occurrenceStart) ?? fallbackOccurrence
    : fallbackOccurrence;

  const ics = buildEventIcs(occurrence);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${event.slug || event.id}.ics\"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
