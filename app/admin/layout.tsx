import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppWorkspace } from "@/components/workspace/AppWorkspace";
import { canAccessAdminHome, getAdminAccessContext } from "@/lib/portal/admin-auth";
import { getAdminInboxCounts } from "@/lib/portal/admin-inbox";
import { isNewSitePortal } from "@/lib/portal/is-new-site";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await getAdminAccessContext();
  if (!access) redirect("/login");
  if (!canAccessAdminHome(access)) redirect("/portal");
  if (!(await isNewSitePortal())) return children;
  const inboxCount = await getAdminInboxCounts(access)
    .then((counts) => counts.total)
    .catch(() => null);
  return (
    <AppWorkspace
      mode="admin"
      email={access.userEmail}
      roles={access.roles}
      canAdmin
      inboxCount={inboxCount}
    >
      {children}
    </AppWorkspace>
  );
}
