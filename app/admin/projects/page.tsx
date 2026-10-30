import { redirect } from "next/navigation";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

import { AdminProjectsManager } from "@/components/admin-projects-manager";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const metadata = { title: "Funding projects" };

export default async function AdminProjectsPage() {
  const access = await getAdminAccessContext();

  if (!access) {
    redirect("/login");
  }

  if (!hasPortalPermission(access.roles, "projects.manage")) {
    redirect("/admin");
  }

  return (
    <section className="workspace-domain-page db-shell space-y-6">
      <WorkspacePageHeader
        eyebrow="Stewardship"
        title="Funding projects"
        description="Create funding projects, share their progress, and turn community support into a lasting place to belong."
      />
      <AdminProjectsManager />
    </section>
  );
}
