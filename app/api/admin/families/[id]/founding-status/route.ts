import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";
import type { FoundingFamilyStatus, PledgeStatus } from "@/lib/portal/types";

interface UpdateFoundingStatusBody {
  status?: FoundingFamilyStatus;
}

const ALLOWED_FOUNDING_STATUSES: FoundingFamilyStatus[] = [
  "not_founding",
  "founding_active",
  "founding_completed",
  "founding_paused",
];

const toPledgeStatus = (status: FoundingFamilyStatus): PledgeStatus => {
  if (status === "founding_active") {
    return "active";
  }

  if (status === "founding_completed") {
    return "completed";
  }

  if (status === "founding_paused") {
    return "paused";
  }

  return "none";
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "families.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as UpdateFoundingStatusBody;
  const status = body.status;

  if (!status || !ALLOWED_FOUNDING_STATUSES.includes(status)) {
    return NextResponse.json({ message: "A valid founding status is required." }, { status: 400 });
  }

  const pledgeStatus = toPledgeStatus(status);

  const { data, error } = await supabase
    .from("families")
    .update({
      founding_family_status: status,
      pledge_status: pledgeStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, founding_family_status, pledge_status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ message: "Family not found." }, { status: 404 });
  }

  return NextResponse.json({ family: data }, { status: 200 });
}
