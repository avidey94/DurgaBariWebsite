import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppWorkspace } from "@/components/workspace/AppWorkspace";
import { getActivePreviewState, getCurrentUser } from "@/lib/auth/session";
import { canAccessAdminHome, getAdminAccessContext } from "@/lib/portal/admin-auth";
import { canAccessMemberContent, getCurrentFamilyPortalContext } from "@/lib/portal/server";
import { isNewSitePortal } from "@/lib/portal/is-new-site";

export const metadata: Metadata = {
  title: "Your member space",
  manifest: "/portal/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Durga Bari" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f2eb",
};

export default async function PortalLayout({ children }: { children: ReactNode }) {
  if (!(await isNewSitePortal())) return children;
  const [user, access, context, preview] = await Promise.all([
    getCurrentUser(),
    getAdminAccessContext(),
    getCurrentFamilyPortalContext(),
    getActivePreviewState(),
  ]);
  if (!user) redirect("/login");
  return (
    <AppWorkspace
      mode="member"
      email={user.email}
      roles={context?.roles ?? ["member"]}
      canAdmin={access ? canAccessAdminHome(access) : false}
      memberReady={!!context && context.family.profileCompleted && canAccessMemberContent(context)}
      foundingFamily={!!context && context.family.foundingFamilyStatus !== "not_founding"}
      previewLabel={
        preview?.active
          ? preview.mode === "logged_out"
            ? "visitor"
            : (preview.targetEmail ?? "member")
          : null
      }
    >
      {children}
    </AppWorkspace>
  );
}
