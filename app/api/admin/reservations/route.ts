import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { findSpaceConflict } from "@/lib/events/availability";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export async function GET() {
  const access = await getAdminAccessContext();
  if (!access || !hasPortalPermission(access.roles, "events.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Reservations are unavailable." }, { status: 503 });

  const { data, error } = await supabase
    .from("event_reservations")
    .select("*")
    .order("event_date", { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ message: "Could not load reservations." }, { status: 500 });
  return NextResponse.json({ reservations: data ?? [] });
}

export async function PATCH(request: Request) {
  const access = await getAdminAccessContext();
  if (!access || !hasPortalPermission(access.roles, "events.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const action = body.action;
  const paymentReference = typeof body.paymentReference === "string" ? body.paymentReference.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || (action !== "approve" && action !== "decline")) {
    return NextResponse.json({ message: "Invalid reservation action." }, { status: 400 });
  }
  if (action === "approve" && (!body.paymentChecked || paymentReference.length < 4 || paymentReference.length > 120)) {
    return NextResponse.json({ message: "Check the completed Zeffy order and enter its reference before approving." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Reservations are unavailable." }, { status: 503 });

  if (action === "approve") {
    const { data: reservation, error: lookupError } = await supabase
      .from("event_reservations")
      .select("id, event_date, start_time, end_time")
      .eq("id", id)
      .eq("status", "requested")
      .maybeSingle();
    if (lookupError) return NextResponse.json({ message: "Could not load this request." }, { status: 500 });
    if (!reservation) return NextResponse.json({ message: "This request was already reviewed." }, { status: 409 });
    try {
      const conflict = await findSpaceConflict(
        reservation.event_date,
        String(reservation.start_time).slice(0, 5),
        String(reservation.end_time).slice(0, 5),
        { source: "reservation", id },
      );
      if (conflict) {
        return NextResponse.json({ message: "This time is blocked on the Durga Bari calendar. Choose another time before approving." }, { status: 409 });
      }
    } catch {
      return NextResponse.json({ message: "Could not check the calendar." }, { status: 503 });
    }
  }

  const now = new Date().toISOString();
  const changes = action === "approve"
    ? { status: "approved", payment_reference: paymentReference, payment_verified_at: now, reviewed_by: access.userEmail, reviewed_at: now, updated_at: now }
    : { status: "declined", reviewed_by: access.userEmail, reviewed_at: now, updated_at: now };

  const { data, error } = await supabase
    .from("event_reservations")
    .update(changes)
    .eq("id", id)
    .eq("status", "requested")
    .select("id")
    .maybeSingle();

  if (error?.code === "23P01") {
    return NextResponse.json({ message: "Another approved reservation overlaps this time." }, { status: 409 });
  }
  if (error) return NextResponse.json({ message: "Could not update this reservation." }, { status: 500 });
  if (!data) return NextResponse.json({ message: "This request was already reviewed." }, { status: 409 });
  return NextResponse.json({ success: true });
}
