import { redirect } from "next/navigation";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

import { AdminRolesManager } from "@/components/admin-roles-manager";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const metadata = { title: "Members & access" };

export default async function AdminRolesPage() {
  const access = await getAdminAccessContext();

  if (!access) {
    redirect("/login");
  }

  if (!hasPortalPermission(access.roles, "roles.read_all")) {
    redirect("/admin");
  }

  return (
    <section className="workspace-domain-page db-shell space-y-6">
      <WorkspacePageHeader
        eyebrow="Community"
        title="Members & access"
        description="Care for family profiles, review membership, and give trusted team members the right responsibilities."
      />
      <AdminRolesManager
        canManageRoles={hasPortalPermission(access.roles, "roles.manage")}
        canUsePreview={access.roles.includes("super_admin")}
      />
    </section>
  );
}
