import { NextResponse } from "next/server";

import { buildCalendarFeedIcs } from "@/lib/events/calendar";
import { listCalendarEvents } from "@/lib/events/server";

export async function GET() {
  const from = new Date();
  const to = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const occurrences = await listCalendarEvents({
    includeDraft: false,
    includePrivate: false,
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
  });

  const publicOccurrences = occurrences.filter((entry) => entry.event.visibility === "public");
  const ics = buildCalendarFeedIcs(publicOccurrences);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"durga-bari-events.ics\"",
      "Cache-Control": "public, max-age=300",
    },
  });
}
