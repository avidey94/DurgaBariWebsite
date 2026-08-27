import { jsonNoStore } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessMemberContent, getCurrentFamilyPortalContext, getFamilyDashboardSummary } from "@/lib/portal/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonNoStore({ message: "Unauthorized" }, { status: 401 });
  }

  const familyContext = await getCurrentFamilyPortalContext();
  if (!familyContext) {
    return jsonNoStore({ message: "Family profile not found." }, { status: 404 });
  }
  if (!canAccessMemberContent(familyContext)) {
    return jsonNoStore({ message: "Portal access is pending approval.", code: "portal_access_pending" }, { status: 403 });
  }

  const summary = await getFamilyDashboardSummary();

  if (!summary) {
    return jsonNoStore({ message: "Family profile not found." }, { status: 404 });
  }

  return jsonNoStore({ summary }, { status: 200 });
}
