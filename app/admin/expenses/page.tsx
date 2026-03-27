import { redirect } from "next/navigation";

import { AdminExpensesManager } from "@/components/admin-expenses-manager";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export default async function AdminExpensesPage() {
  const access = await getAdminAccessContext();

  if (!access) {
    redirect("/login");
  }

  if (!hasPortalPermission(access.roles, "expenses.manage")) {
    redirect("/admin");
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Treasurer: Expenses</h1>
        <p className="mt-2 text-sm text-slate-600">
          Capture and reconcile operating expenses with audit history and status tracking.
        </p>
      </header>
      <AdminExpensesManager />
    </section>
  );
}
