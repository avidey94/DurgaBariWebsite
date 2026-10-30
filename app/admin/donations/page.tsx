import { redirect } from "next/navigation";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

import { AdminDonationsManager } from "@/components/admin-donations-manager";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const metadata = { title: "Donations" };

export default async function AdminDonationsPage() {
  const access = await getAdminAccessContext();

  if (!access) {
    redirect("/login");
  }

  if (!hasPortalPermission(access.roles, "donations.manage")) {
    redirect("/admin");
  }

  return (
    <section className="workspace-domain-page db-shell space-y-6">
      <WorkspacePageHeader
        eyebrow="Stewardship"
        title="Donations"
        description="Record donations, connect each gift to a family or project, and keep contribution records accurate."
      />
      <AdminDonationsManager />
    </section>
  );
}
