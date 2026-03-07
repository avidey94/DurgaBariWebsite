import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentFamilyPortalContext, getFamilyFoundingPledgeProgress, listFamilyDonations } from "@/lib/portal/server";
import type { DonationLedgerEntry } from "@/lib/portal/types";

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

const FOUNDING_MONTHLY_TARGET_CENTS = 10000;

const monthKeyFromIsoDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const getFoundingMonthKey = (donation: DonationLedgerEntry) => {
  const metadataMonth = donation.metadata?.founding_month;
  if (typeof metadataMonth === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(metadataMonth)) {
    return metadataMonth;
  }

  return monthKeyFromIsoDate(donation.occurredAt);
};

const buildFoundingMonthRange = () => {
  const months: string[] = [];
  for (let year = 2026; year <= 2028; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      months.push(`${year}-${String(month).padStart(2, "0")}`);
    }
  }
  return months;
};

const formatMonthLabel = (monthKey: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${monthKey}-01T00:00:00.000Z`),
  );

export default async function PortalPledgePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const context = await getCurrentFamilyPortalContext();

  if (!context) {
    return (
      <section className="mx-auto max-w-6xl space-y-4 px-6 py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Founding Family Pledge</h1>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Family profile was not found for your account.
        </p>
      </section>
    );
  }

  const progress = await getFamilyFoundingPledgeProgress(context.family.id);
  const donations = await listFamilyDonations(context.family.id, 5000);
  const foundingDonations = donations.filter((donation) => donation.donationType === "founding_pledge");
  const amountByFoundingMonth = foundingDonations.reduce<Map<string, number>>((acc, donation) => {
    const monthKey = getFoundingMonthKey(donation);
    if (!monthKey) {
      return acc;
    }

    acc.set(monthKey, (acc.get(monthKey) ?? 0) + donation.amountCents);
    return acc;
  }, new Map());
  const foundingMonths = buildFoundingMonthRange();
  const progressPercent = progress ? Math.max(0, Math.min(100, progress.progressPercent)) : 0;

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Founding Family Pledge</h1>
        <p className="mt-2 text-sm text-slate-600">
          View your progress against the $3,600 Founding Family pledge goal (Jan 2026 to Dec 2028).
        </p>
      </header>

      {!progress ? (
        <article className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-700">
          No founding pledge record is active for your family.
        </article>
      ) : (
        <article className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Total donated</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(progress.totalDonatedCents)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Target by now</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(progress.targetDonatedByNowCents)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Remaining</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(progress.remainingBalanceCents)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className="text-xl font-semibold capitalize text-slate-900">{progress.progressStatus.replace("_", " ")}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
              <span>Progress</span>
              <span>{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200">
              <div
                className="h-3 rounded-full bg-emerald-600"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Link
              href="/portal/donations"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              View donation history
            </Link>
            <button
              type="button"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Make pledge payment (placeholder)
            </button>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <h2 className="text-lg font-semibold text-slate-900">Monthly Payment Tracker (Jan 2026 - Dec 2028)</h2>
            <p className="mt-1 text-sm text-slate-600">
              Months are marked as paid when at least one founding pledge donation is recorded for that month.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {foundingMonths.map((monthKey) => {
                const monthTotal = amountByFoundingMonth.get(monthKey) ?? 0;
                const paid = monthTotal > 0;
                const onTarget = monthTotal >= FOUNDING_MONTHLY_TARGET_CENTS;

                return (
                  <article
                    key={monthKey}
                    className={`rounded-md border p-3 ${
                      paid ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-600">{formatMonthLabel(monthKey)}</p>
                    <p className={`mt-2 text-sm font-semibold ${paid ? "text-emerald-800" : "text-slate-700"}`}>
                      {paid ? "Paid" : "Not paid"}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{formatCurrency(monthTotal)}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {paid ? (onTarget ? "On target" : "Partial") : "Target: $100"}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
