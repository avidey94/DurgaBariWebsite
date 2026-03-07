import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";

const DEFAULT_RANGE_DAYS = 365;

const parseDateParam = (value: string | null, fallback: Date) => {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

export async function GET(request: Request) {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const now = new Date();
  const defaultTo = new Date(now.getTime() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);
  const from = parseDateParam(url.searchParams.get("from"), now);
  const to = parseDateParam(url.searchParams.get("to"), defaultTo);

  if (!from || !to) {
    return NextResponse.json(
      { message: "Invalid date range. Use ISO date/time for from and to." },
      { status: 400 },
    );
  }

  if (from.getTime() > to.getTime()) {
    return NextResponse.json({ message: "from must be earlier than to." }, { status: 400 });
  }

  const user = await getCurrentUser();

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(
      "id, title, description, location, start_time, end_time, is_public, is_rsvp_enabled, capacity, form_schema",
    )
    .eq("is_public", true)
    .gte("start_time", from.toISOString())
    .lte("start_time", to.toISOString())
    .order("start_time", { ascending: true });

  if (eventsError) {
    return NextResponse.json({ message: eventsError.message }, { status: 500 });
  }

  if (!user?.id || (events ?? []).length === 0) {
    return NextResponse.json({ events: events ?? [] }, { status: 200 });
  }

  const eventIds = (events ?? []).map((event) => event.id);
  const { data: myRsvps, error: rsvpError } = await supabase
    .from("event_rsvps")
    .select("event_id, status, headcount, answers, updated_at")
    .in("event_id", eventIds)
    .eq("user_id", user.id);

  if (rsvpError) {
    return NextResponse.json({ message: rsvpError.message }, { status: 500 });
  }

  const byEventId = new Map((myRsvps ?? []).map((row) => [row.event_id, row]));
  const eventsWithMyRsvp = (events ?? []).map((event) => ({
    ...event,
    myRsvp: byEventId.get(event.id) ?? null,
  }));

  return NextResponse.json({ events: eventsWithMyRsvp }, { status: 200 });
}
