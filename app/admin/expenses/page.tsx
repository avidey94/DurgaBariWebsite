import { redirect } from "next/navigation";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

import { AdminExpensesManager } from "@/components/admin-expenses-manager";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const metadata = { title: "Expenses & reimbursements" };

export default async function AdminExpensesPage() {
  const access = await getAdminAccessContext();

  if (!access) {
    redirect("/login");
  }

  if (!hasPortalPermission(access.roles, "expenses.manage")) {
    redirect("/admin");
  }

  return (
    <section className="workspace-domain-page db-shell space-y-6">
      <WorkspacePageHeader
        eyebrow="Stewardship"
        title="Expenses & reimbursements"
        description="Review reimbursement requests, record operating expenses, and follow each payment through reconciliation."
      />
      <AdminExpensesManager />
    </section>
  );
}
