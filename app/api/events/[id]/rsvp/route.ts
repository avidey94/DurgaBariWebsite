import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";

type RsvpStatus = "going" | "not_going" | "maybe";

interface RsvpBody {
  status?: RsvpStatus;
  headcount?: number;
  answers?: Record<string, unknown> | null;
}

const RSVP_STATUSES = new Set<RsvpStatus>(["going", "not_going", "maybe"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const { id: eventId } = await context.params;
  const body = (await request.json()) as RsvpBody;
  const status = body.status;

  if (!status || !RSVP_STATUSES.has(status)) {
    return NextResponse.json({ message: "status must be going, maybe, or not_going." }, { status: 400 });
  }

  const requestedHeadcount = Math.floor(Number(body.headcount ?? 1));
  const normalizedHeadcount = status === "going" ? requestedHeadcount : 0;

  if (status === "going" && (!Number.isFinite(normalizedHeadcount) || normalizedHeadcount < 1)) {
    return NextResponse.json({ message: "headcount must be at least 1 when status is going." }, { status: 400 });
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, is_public, is_rsvp_enabled, capacity")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ message: eventError.message }, { status: 500 });
  }

  if (!event || !event.is_public) {
    return NextResponse.json({ message: "Event not found." }, { status: 404 });
  }

  if (!event.is_rsvp_enabled) {
    return NextResponse.json({ message: "RSVP is not enabled for this event." }, { status: 400 });
  }

  const { data: existingRsvp, error: existingError } = await supabase
    .from("event_rsvps")
    .select("id, headcount")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ message: existingError.message }, { status: 500 });
  }

  if (event.capacity !== null && status === "going") {
    const { data: allGoingRows, error: allGoingError } = await supabase
      .from("event_rsvps")
      .select("user_id, headcount")
      .eq("event_id", eventId)
      .eq("status", "going");

    if (allGoingError) {
      return NextResponse.json({ message: allGoingError.message }, { status: 500 });
    }

    const currentTotal = (allGoingRows ?? []).reduce((sum, row) => sum + Math.max(0, row.headcount ?? 0), 0);
    const previousHeadcount = existingRsvp?.headcount ?? 0;
    const nextTotal = currentTotal - previousHeadcount + normalizedHeadcount;

    if (nextTotal > event.capacity) {
      return NextResponse.json(
        { message: `This RSVP exceeds capacity (${event.capacity}).` },
        { status: 409 },
      );
    }
  }

  const { data: saved, error: saveError } = await supabase
    .from("event_rsvps")
    .upsert(
      {
        event_id: eventId,
        user_id: user.id,
        email: user.email,
        status,
        headcount: normalizedHeadcount,
        answers: body.answers ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,user_id" },
    )
    .select("id, event_id, user_id, email, status, headcount, answers, created_at, updated_at")
    .single();

  if (saveError) {
    return NextResponse.json({ message: saveError.message }, { status: 500 });
  }

  return NextResponse.json({ rsvp: saved }, { status: 200 });
}
