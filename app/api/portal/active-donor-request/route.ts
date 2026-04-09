import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";

interface ActiveDonorRequestBody {
  requestedStatus?: "bronze" | "silver" | "gold";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.id || !user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as ActiveDonorRequestBody;
  const requestedStatus = body.requestedStatus;

  if (!requestedStatus || !["bronze", "silver", "gold"].includes(requestedStatus)) {
    return NextResponse.json({ message: "requestedStatus must be bronze, silver, or gold." }, { status: 400 });
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("id, profile_completed, active_donor_status, requested_active_donor_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (familyError || !family) {
    return NextResponse.json({ message: familyError?.message ?? "Family profile not found." }, { status: 404 });
  }

  if (!family.profile_completed) {
    return NextResponse.json({ message: "Complete onboarding first before requesting active donor status." }, { status: 409 });
  }

  const currentStatus = (family.active_donor_status ?? "none") as "none" | "bronze" | "silver" | "gold";
  if (requestedStatus === currentStatus) {
    return NextResponse.json(
      { message: `You are already ${currentStatus}. Select a different tier to request a change.` },
      { status: 409 },
    );
  }

  if (family.requested_active_donor_status === requestedStatus) {
    return NextResponse.json(
      { message: `A ${requestedStatus} request is already pending review.` },
      { status: 409 },
    );
  }

  const { error: updateError } = await supabase
    .from("families")
    .update({
      requested_active_donor_status: requestedStatus,
      requested_active_donor_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", family.id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
