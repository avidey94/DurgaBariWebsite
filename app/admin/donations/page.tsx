import { redirect } from "next/navigation";

import { AdminDonationsManager } from "@/components/admin-donations-manager";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export default async function AdminDonationsPage() {
  const access = await getAdminAccessContext();

  if (!access) {
    redirect("/login");
  }

  if (!hasPortalPermission(access.roles, "donations.manage")) {
    redirect("/admin");
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Treasurer: Donations</h1>
        <p className="mt-2 text-sm text-slate-600">Record and reconcile family donations.</p>
      </header>
      <AdminDonationsManager />
    </section>
  );
}
