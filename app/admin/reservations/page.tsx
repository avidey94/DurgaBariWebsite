import { redirect } from "next/navigation";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

import { AdminReservationsManager } from "@/components/admin-reservations-manager";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const metadata = { title: "Reservations" };

export default async function AdminReservationsPage() {
  const access = await getAdminAccessContext();
  if (!access) redirect("/login");
  if (!hasPortalPermission(access.roles, "events.manage")) redirect("/admin");

  return (
    <section className="workspace-domain-page db-shell space-y-6">
      <WorkspacePageHeader
        eyebrow="Gatherings"
        title="Reservations"
        description="Review private gatherings, verify payment details, and confirm the temple space with confidence."
      />
      <div className="workspace-workflow" aria-label="Reservation review steps">
        <div>
          <b>1</b> Review gathering & availability
        </div>
        <div>
          <b>2</b> Verify payment & reference
        </div>
        <div>
          <b>3</b> Approve to confirm the space
        </div>
      </div>
      <AdminReservationsManager />
    </section>
  );
}
