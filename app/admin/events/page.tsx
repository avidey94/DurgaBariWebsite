import { redirect } from "next/navigation";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

import { AdminEventsManager } from "@/components/admin-events-manager";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const metadata = { title: "Events & service" };

export default async function AdminEventsPage() {
  const access = await getAdminAccessContext();

  if (!access) {
    redirect("/login");
  }

  if (!hasPortalPermission(access.roles, "events.manage")) {
    redirect("/admin");
  }

  return (
    <section className="workspace-domain-page db-shell space-y-6">
      <WorkspacePageHeader
        eyebrow="Gatherings"
        title="Events & service"
        description="Plan gatherings, publish event details, organize volunteer roles, and keep track of who’s joining us."
      />
      <AdminEventsManager />
    </section>
  );
}
