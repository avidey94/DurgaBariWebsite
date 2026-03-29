import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

interface UpdateSlotBody {
  title?: string;
  description?: string | null;
  startTime?: string;
  endTime?: string | null;
  capacity?: number;
  notes?: string | null;
  sortOrder?: number;
  slotState?: "open" | "closed";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slotId: string }> },
) {
  const access = await getAdminAccessContext();
  if (!access) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPortalPermission(access.roles, "events.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { slotId } = await context.params;
  const body = (await request.json()) as UpdateSlotBody;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.startTime !== undefined) updates.start_time = new Date(body.startTime).toISOString();
  if (body.endTime !== undefined) updates.end_time = body.endTime ? new Date(body.endTime).toISOString() : null;
  if (body.capacity !== undefined) updates.capacity = Math.max(1, Math.floor(Number(body.capacity)));
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;
  if (body.sortOrder !== undefined) updates.sort_order = Math.floor(Number(body.sortOrder));
  if (body.slotState !== undefined) updates.slot_state = body.slotState;

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });

  const { data, error } = await supabase
    .from("event_volunteer_slots")
    .update(updates)
    .eq("id", slotId)
    .select("id, event_id, title, description, start_time, end_time, capacity, notes, sort_order, slot_state, created_at, updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ message: "Slot not found." }, { status: 404 });

  return NextResponse.json({ slot: data }, { status: 200 });
}
