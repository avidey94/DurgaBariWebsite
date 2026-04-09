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

export default async function PortalFoundingFamilyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const context = await getCurrentFamilyPortalContext();

  if (!context || !context.family.profileCompleted) {
    redirect("/portal");
  }

  if (context.family.foundingFamilyStatus === "not_founding") {
    redirect("/portal");
  }

  const [progress, donations] = await Promise.all([
    getFamilyFoundingPledgeProgress(context.family.id),
    listFamilyDonations(context.family.id, 5000),
  ]);

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

  return (
    <section className="db-shell max-w-6xl space-y-6">
      <header className="db-panel p-6 md:p-8">
        <p className="db-kicker">Founding Family</p>
        <h1 className="db-title mt-3">Founding Family Tracker</h1>
        <p className="mt-3 text-sm text-[var(--db-text-soft)]">
          Monthly tracker for Jan 2026 to Dec 2028 based on recorded founding-family donations.
        </p>
      </header>

      <article className="db-card p-6">
        {progress ? (
          <div className="mb-5 grid gap-4 md:grid-cols-4">
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
        ) : null}

        <h2 className="text-lg font-semibold text-slate-900">Monthly Payment Tracker (Jan 2026 - Dec 2028)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Each month reflects payments entered by treasurer in the donation ledger.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {foundingMonths.map((monthKey) => {
            const monthTotal = amountByFoundingMonth.get(monthKey) ?? 0;
            const paid = monthTotal > 0;
            const onTarget = monthTotal >= FOUNDING_MONTHLY_TARGET_CENTS;

            return (
              <article
                key={monthKey}
                className={`rounded-[var(--db-radius-sm)] border p-3 ${
                  paid ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-slate-600">{formatMonthLabel(monthKey)}</p>
                <p className={`mt-2 text-sm font-semibold ${paid ? "text-emerald-800" : "text-slate-700"}`}>
                  {paid ? "Paid" : "Not paid"}
                </p>
                <p className="mt-1 text-sm text-slate-700">{formatCurrency(monthTotal)}</p>
                <p className="mt-1 text-xs text-slate-600">{paid ? (onTarget ? "On target" : "Partial") : "Target: $100"}</p>
              </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}
