import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";

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

  const includePrivate = url.searchParams.get("includePrivate") === "1";
  const user = includePrivate ? await getCurrentUser() : null;
  const canViewPrivate = Boolean(user && isAdmin(user));

  let query = supabase
    .from("events")
    .select(
      "id, title, description, location, start_time, end_time, is_public, is_rsvp_enabled, capacity, form_schema, created_at, created_by, updated_at",
    )
    .gte("start_time", from.toISOString())
    .lte("start_time", to.toISOString())
    .order("start_time", { ascending: true });

  if (!canViewPrivate) {
    query = query.eq("is_public", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const events = data ?? [];
  const eventIds = events.map((event) => event.id);

  if (eventIds.length === 0) {
    return NextResponse.json({ events: [] }, { status: 200 });
  }

  const { data: rsvpRows, error: rsvpError } = await supabase
    .from("event_rsvps")
    .select("event_id, status, headcount")
    .in("event_id", eventIds)
    .eq("status", "going");

  if (rsvpError) {
    return NextResponse.json({ message: rsvpError.message }, { status: 500 });
  }

  const goingCounts = new Map<string, { rsvpCountGoing: number; headcountGoing: number }>();

  (rsvpRows ?? []).forEach((row) => {
    const current = goingCounts.get(row.event_id) ?? { rsvpCountGoing: 0, headcountGoing: 0 };
    current.rsvpCountGoing += 1;
    current.headcountGoing += Math.max(0, row.headcount ?? 0);
    goingCounts.set(row.event_id, current);
  });

  const eventsWithCounts = events.map((event) => {
    const counts = goingCounts.get(event.id) ?? { rsvpCountGoing: 0, headcountGoing: 0 };
    return {
      ...event,
      rsvp_count_going: counts.rsvpCountGoing,
      rsvp_headcount_going: counts.headcountGoing,
    };
  });

  return NextResponse.json({ events: eventsWithCounts }, { status: 200 });
}

interface CreateEventBody {
  title?: string;
  description?: string | null;
  location?: string | null;
  startTime?: string;
  endTime?: string | null;
  isPublic?: boolean;
  isRsvpEnabled?: boolean;
  capacity?: number | null;
  formSchema?: unknown;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as CreateEventBody;
  const title = (body.title ?? "").trim();
  const startTime = body.startTime ?? "";

  if (!title || !startTime) {
    return NextResponse.json({ message: "title and startTime are required." }, { status: 400 });
  }

  const parsedStart = new Date(startTime);
  if (Number.isNaN(parsedStart.getTime())) {
    return NextResponse.json({ message: "startTime must be a valid ISO date/time." }, { status: 400 });
  }

  const parsedEnd = body.endTime ? new Date(body.endTime) : null;
  if (body.endTime && (!parsedEnd || Number.isNaN(parsedEnd.getTime()))) {
    return NextResponse.json({ message: "endTime must be a valid ISO date/time." }, { status: 400 });
  }

  if (parsedEnd && parsedEnd.getTime() < parsedStart.getTime()) {
    return NextResponse.json({ message: "endTime must be after startTime." }, { status: 400 });
  }

  const capacity =
    body.capacity === null || body.capacity === undefined || body.capacity === 0
      ? null
      : Math.floor(Number(body.capacity));

  if (capacity !== null && (!Number.isFinite(capacity) || capacity < 1)) {
    return NextResponse.json({ message: "capacity must be a positive integer." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      title,
      description: body.description?.trim() || null,
      location: body.location?.trim() || null,
      start_time: parsedStart.toISOString(),
      end_time: parsedEnd ? parsedEnd.toISOString() : null,
      is_public: body.isPublic ?? true,
      is_rsvp_enabled: body.isRsvpEnabled ?? true,
      capacity,
      form_schema: body.formSchema ?? null,
      created_by: user.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .select(
      "id, title, description, location, start_time, end_time, is_public, is_rsvp_enabled, capacity, form_schema, created_at, created_by, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data }, { status: 201 });
}
