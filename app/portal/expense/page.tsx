import { redirect } from "next/navigation";

import { PortalExpenseSubmission } from "@/components/portal-expense-submission";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentFamilyPortalContext } from "@/lib/portal/server";

export default async function PortalExpensePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const context = await getCurrentFamilyPortalContext();

  if (!context || !context.family.profileCompleted) {
    redirect("/portal");
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Expenses</h1>
        <p className="mt-2 text-sm text-slate-600">
          Submit and track project-related expense requests.
        </p>
      </header>
      <PortalExpenseSubmission />
    </section>
  );
}
