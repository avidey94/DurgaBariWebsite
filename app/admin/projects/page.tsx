import { redirect } from "next/navigation";

import { AdminProjectsManager } from "@/components/admin-projects-manager";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export default async function AdminProjectsPage() {
  const access = await getAdminAccessContext();

  if (!access) {
    redirect("/login");
  }

  if (!hasPortalPermission(access.roles, "projects.manage")) {
    redirect("/admin");
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Projects Admin</h1>
        <p className="mt-2 text-sm text-slate-600">Create and manage community funding campaigns.</p>
      </header>
      <AdminProjectsManager />
    </section>
  );
}
