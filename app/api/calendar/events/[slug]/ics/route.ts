import { NextResponse } from "next/server";
import { buildEventIcs, expandOccurrences } from "@/lib/events/calendar";
import { computeVisibilityForUser, getEventBySlug } from "@/lib/events/server";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const occurrenceStart = new URL(request.url).searchParams.get("occurrenceStart");
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  if (occurrenceStart && Number.isNaN(Date.parse(occurrenceStart))) {
    return NextResponse.json({ message: "Choose a valid occurrence." }, { status: 400, headers });
  }
  const visibility = await computeVisibilityForUser();
  const event = await getEventBySlug(slug, visibility);
  if (!event || event.publish_status !== "published") {
    return NextResponse.json({ message: "Event not found." }, { status: 404, headers });
  }
  const occurrence = occurrenceStart
    ? expandOccurrences(
        event,
        new Date(Date.parse(occurrenceStart) - 2 * 86400000).toISOString(),
        new Date(Date.parse(occurrenceStart) + 2 * 86400000).toISOString(),
        20,
      ).find((entry) => entry.occurrenceStart === new Date(occurrenceStart).toISOString())
    : {
        event,
        occurrenceStart: event.start_time,
        occurrenceEnd: event.end_time,
        occurrenceKey: `${event.id}:${event.start_time}`,
      };
  if (!occurrence)
    return NextResponse.json({ message: "Occurrence not found." }, { status: 404, headers });
  return new NextResponse(buildEventIcs(occurrence), {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${(event.slug || event.id).replace(/[^a-zA-Z0-9-]/g, "")}.ics"`,
    },
  });
}
