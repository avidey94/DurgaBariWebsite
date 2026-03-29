import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

interface CreateSlotBody {
  title?: string;
  description?: string | null;
  startTime?: string;
  endTime?: string | null;
  capacity?: number;
  notes?: string | null;
  sortOrder?: number;
  slotState?: "open" | "closed";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await getAdminAccessContext();
  if (!access) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPortalPermission(access.roles, "events.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });

  const [slotsResult, signupsResult] = await Promise.all([
    supabase
      .from("event_volunteer_slots")
      .select("id, event_id, title, description, start_time, end_time, capacity, notes, sort_order, slot_state, created_at, updated_at")
      .eq("event_id", id)
      .order("sort_order", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("event_volunteer_signups")
      .select("id, slot_id, email, family_id, participant_name, participant_type, signup_status, signed_up_at")
      .eq("event_id", id)
      .order("signed_up_at", { ascending: true }),
  ]);

  if (slotsResult.error) return NextResponse.json({ message: slotsResult.error.message }, { status: 500 });
  if (signupsResult.error) return NextResponse.json({ message: signupsResult.error.message }, { status: 500 });

  return NextResponse.json({ slots: slotsResult.data ?? [], signups: signupsResult.data ?? [] }, { status: 200 });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await getAdminAccessContext();
  if (!access) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPortalPermission(access.roles, "events.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as CreateSlotBody;
  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ message: "title is required." }, { status: 400 });
  const start = new Date(body.startTime ?? "");
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ message: "startTime must be valid ISO datetime." }, { status: 400 });
  }
  const end = body.endTime ? new Date(body.endTime) : null;
  if (end && Number.isNaN(end.getTime())) {
    return NextResponse.json({ message: "endTime must be valid ISO datetime." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });

  const { data, error } = await supabase
    .from("event_volunteer_slots")
    .insert({
      event_id: id,
      title,
      description: body.description?.trim() || null,
      start_time: start.toISOString(),
      end_time: end?.toISOString() ?? null,
      capacity: Math.max(1, Math.floor(Number(body.capacity ?? 1))),
      notes: body.notes?.trim() || null,
      sort_order: Math.floor(Number(body.sortOrder ?? 0)),
      slot_state: body.slotState ?? "open",
      updated_at: new Date().toISOString(),
    })
    .select("id, event_id, title, description, start_time, end_time, capacity, notes, sort_order, slot_state, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ slot: data }, { status: 201 });
}
