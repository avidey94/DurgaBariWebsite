import { redirect } from "next/navigation";

import { DuesStatusTable } from "@/components/dues-status-table";
import { getCurrentUser } from "@/lib/auth/session";
import { dataProvider } from "@/lib/data";

export default async function PortalPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const family = await dataProvider.getFamilyByEmail(user.email);

  if (!family) {
    return (
      <section className="mx-auto max-w-6xl space-y-4 px-6 py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Your Portal</h1>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No family record found for <strong>{user.email}</strong> in the current data provider.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Your Portal</h1>
        <p className="mt-2 text-sm text-slate-600">Signed in as {user.email}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Family Name</p>
            <p className="text-lg font-semibold text-slate-900">{family.familyName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Founding Family</p>
            <p className="text-lg font-semibold text-slate-900">
              {family.foundingFamily ? "Yes" : "No"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Dues Paid</p>
            <p className="text-lg font-semibold text-slate-900">{family.totalDuesPaid || "-"}</p>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Monthly Dues Status</h2>
        <p className="text-sm text-slate-600">
          Each month marked <strong>Paid</strong> in the sheet means your dues for that month are
          already received.
        </p>
        <DuesStatusTable items={family.duesMonths ?? []} />
      </section>
    </section>
  );
}
