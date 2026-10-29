import { redirect } from "next/navigation";

import { PortalExpenseSubmission } from "@/components/portal-expense-submission";
import { PortalMemberPage } from "@/components/portal-member-page";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentFamilyPortalContext } from "@/lib/portal/server";
import { isNewSitePortal } from "@/lib/portal/is-new-site";

export default async function PortalExpensePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const context = await getCurrentFamilyPortalContext();

  if (!context || !context.family.profileCompleted) {
    redirect("/portal");
  }

  if (await isNewSitePortal()) {
    return (
      <PortalMemberPage title="Expenses" eyebrow="Member finance" description="Submit and track project expenses.">
        <PortalExpenseSubmission elevated />
      </PortalMemberPage>
    );
  }

  return (
    <section className="db-shell max-w-6xl space-y-6">
      <header className="db-panel p-6 md:p-8">
        <p className="db-kicker">Member Finance</p>
        <h1 className="db-title mt-3">Expenses</h1>
        <p className="mt-3 text-sm text-[var(--db-text-soft)]">
          Submit and track project-related expense requests.
        </p>
      </header>
      <PortalExpenseSubmission />
    </section>
  );
}
