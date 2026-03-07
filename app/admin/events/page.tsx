import { redirect } from "next/navigation";

import { AdminEventsManager } from "@/components/admin-events-manager";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export default async function AdminEventsPage() {
  const access = await getAdminAccessContext();

  if (!access) {
    redirect("/login");
  }

  if (!hasPortalPermission(access.roles, "events.manage")) {
    redirect("/admin");
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Events Admin</h1>
        <p className="mt-2 text-sm text-slate-600">Manage events and RSVP attendance.</p>
      </header>
      <AdminEventsManager />
    </section>
  );
}
