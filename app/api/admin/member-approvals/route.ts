import { NextRequest, NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

const approvalResult = (request: NextRequest, review: "approved" | "stale" | "error") => {
  const url = new URL("/admin/notifications", request.url);
  url.searchParams.set("review", review);
  const response = NextResponse.redirect(url, { status: 303 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
};

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }

  const access = await getAdminAccessContext();
  if (!access || !hasPortalPermission(access.roles, "families.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const familyId = formData.get("familyId");
  if (typeof familyId !== "string" || !/^[0-9a-f-]{36}$/i.test(familyId)) {
    return approvalResult(request, "error");
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return approvalResult(request, "error");

  const { data, error } = await supabase
    .from("families")
    .update({ portal_access_state: "approved", updated_at: new Date().toISOString() })
    .eq("id", familyId)
    .eq("portal_access_state", "pending")
    .eq("profile_completed", true)
    .select("id")
    .maybeSingle();

  if (error) return approvalResult(request, "error");
  return approvalResult(request, data ? "approved" : "stale");
}
