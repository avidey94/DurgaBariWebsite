import { redirect } from "next/navigation";

import { PortalExpenseSubmission } from "@/components/portal-expense-submission";
import { PortalMemberPage } from "@/components/portal-member-page";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessMemberContent, getCurrentFamilyPortalContext } from "@/lib/portal/server";
import { isNewSitePortal } from "@/lib/portal/is-new-site";

export const metadata = { title: "Reimbursements" };

export default async function PortalExpensePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const context = await getCurrentFamilyPortalContext();

  if (!context || !context.family.profileCompleted || !canAccessMemberContent(context)) {
    redirect("/portal");
  }

  if (await isNewSitePortal()) {
    return (
      <PortalMemberPage
        title="Reimbursements"
        eyebrow="Support behind the scenes"
        description="Bought something for a temple project? Share the details and follow your request from review to payment."
      >
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
