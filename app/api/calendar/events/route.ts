import { NextResponse } from "next/server";

import { listCalendarEvents, computeVisibilityForUser } from "@/lib/events/server";

const DEFAULT_RANGE_DAYS = 180;

const parseDateParam = (value: string | null, fallback: Date) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const now = new Date();
  const defaultTo = new Date(now.getTime() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);
  const from = parseDateParam(url.searchParams.get("from"), now);
  const to = parseDateParam(url.searchParams.get("to"), defaultTo);
  const eventType = (url.searchParams.get("eventType") ?? "").trim().toLowerCase();

  if (!from || !to || from > to) {
    return NextResponse.json({ message: "Invalid from/to range." }, { status: 400 });
  }

  const visibility = await computeVisibilityForUser();
  const occurrences = await listCalendarEvents({
    includeDraft: false,
    includePrivate: visibility.includePrivate,
    includeMembers: visibility.includeMembers,
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
  });

  const filtered = occurrences.filter((entry) => {
    if (entry.event.visibility === "private" && !visibility.includePrivate) return false;
    if (entry.event.visibility === "members" && !visibility.includeMembers) return false;
    if (eventType && entry.event.event_type !== eventType) return false;
    return true;
  });

  return NextResponse.json({ occurrences: filtered }, { status: 200 });
}
