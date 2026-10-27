import { redirect } from "next/navigation";

import { AdminReservationsManager } from "@/components/admin-reservations-manager";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export default async function AdminReservationsPage() {
  const access = await getAdminAccessContext();
  if (!access) redirect("/login");
  if (!hasPortalPermission(access.roles, "events.manage")) redirect("/admin");

  return (
    <section className="db-shell max-w-6xl space-y-6">
      <header className="db-panel p-6">
        <p className="db-kicker">Administration</p>
        <h1 className="db-title mt-2">Event Reservations</h1>
        <p className="mt-2 text-sm text-[var(--db-text-soft)]">Match each booking reference and package line item to a completed Zeffy order before approving. Discounts and Zeffy’s optional platform contribution may change the checkout total. Approval confirms the time slot.</p>
      </header>
      <AdminReservationsManager />
    </section>
  );
}
