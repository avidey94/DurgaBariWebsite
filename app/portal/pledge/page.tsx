import Image from "next/image";
import { redirect } from "next/navigation";

import { PortalActiveDonorRequest } from "@/components/portal-active-donor-request";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentFamilyPortalContext, listFamilyDonations } from "@/lib/portal/server";
import type { DonationLedgerEntry, RequestedActiveDonorStatus } from "@/lib/portal/types";

const tiers = [
  {
    id: "bronze",
    title: "Bronze Active Donor",
    contribution: "$100 / month",
    borderClass: "border-amber-400 bg-[linear-gradient(180deg,#fff9f3_0%,#fff4e5_100%)]",
    badgeClass: "bg-amber-100 text-amber-900 border border-amber-300",
    perks: [
      "Recognition in the active donor roster on the sponsors page",
      "Quarterly donor updates and community milestone briefings",
      "Priority volunteer signup windows for major events",
    ],
  },
  {
    id: "silver",
    title: "Silver Active Donor",
    contribution: "$300 / month",
    borderClass: "border-slate-400 bg-[linear-gradient(180deg,#fbfcfd_0%,#eef2f6_100%)]",
    badgeClass: "bg-slate-100 text-slate-900 border border-slate-300",
    perks: [
      "Everything in Bronze plus expanded recognition placement",
      "Invites to periodic donor appreciation sessions",
      "Early notice on major campaign and event initiatives",
    ],
  },
  {
    id: "gold",
    title: "Gold Active Donor",
    contribution: "$500 / month",
    borderClass: "border-yellow-400 bg-[linear-gradient(180deg,#fffdf2_0%,#fff7cf_100%)]",
    badgeClass: "bg-yellow-100 text-yellow-950 border border-yellow-300",
    perks: [
      "Everything in Silver plus top-tier active donor recognition",
      "Special acknowledgment for flagship community campaigns",
      "Priority outreach for temple-impact funding initiatives",
    ],
  },
] as const;

const ACTIVE_DONOR_TYPES = ["active_donor_bronze", "active_donor_silver", "active_donor_gold"] as const;
const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);

const toTierLabelFromDonationType = (donationType: DonationLedgerEntry["donationType"]) => {
  if (donationType === "active_donor_bronze") return "Bronze";
  if (donationType === "active_donor_silver") return "Silver";
  if (donationType === "active_donor_gold") return "Gold";
  return "N/A";
};

const isValidMonthKey = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

const getActiveDonorMonthKey = (donation: DonationLedgerEntry) => {
  const metadataMonth = donation.metadata?.active_donor_month;
  if (typeof metadataMonth === "string" && isValidMonthKey(metadataMonth)) {
    return metadataMonth;
  }

  const occurredAt = new Date(donation.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    return null;
  }

  return `${occurredAt.getUTCFullYear()}-${String(occurredAt.getUTCMonth() + 1).padStart(2, "0")}`;
};

const buildMonthRange = () => {
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
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Become an Active Donor</h1>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Family profile was not found for your account.
        </p>
      </section>
    );
  }

  const approvedTier = context.family.activeDonorStatus !== "none" ? context.family.activeDonorStatus : null;
  const allowedStatuses = (["bronze", "silver", "gold"] as const).filter(
    (status) => status !== context.family.activeDonorStatus,
  ) as RequestedActiveDonorStatus[];
  const donations = await listFamilyDonations(context.family.id, 5000);
  const activeDonorDonations = donations.filter((donation) =>
    ACTIVE_DONOR_TYPES.includes(donation.donationType as (typeof ACTIVE_DONOR_TYPES)[number]),
  );
  const activeDonorTotalCents = activeDonorDonations.reduce((sum, donation) => sum + donation.amountCents, 0);
  const monthTotals = activeDonorDonations.reduce<Map<string, number>>((map, donation) => {
    const monthKey = getActiveDonorMonthKey(donation);
    if (!monthKey || !isValidMonthKey(monthKey)) return map;
    map.set(monthKey, (map.get(monthKey) ?? 0) + donation.amountCents);
    return map;
  }, new Map());
  const monthRange = buildMonthRange();

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {approvedTier ? "Active Donor Portal" : "Become an Active Donor"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {approvedTier
            ? "You are an approved active donor. Review the monthly tiers below, see your current level highlighted, and request a different tier whenever your support level changes."
            : "Choose the monthly tier that matches your intended support, donate using QR, then submit your request for admin approval."}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <article
            key={tier.id}
            className={`rounded-lg border bg-white p-5 ${
              approvedTier === tier.id
                ? "border-2 border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.22)]"
                : tier.borderClass
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{tier.title}</h2>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{tier.contribution}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-600">Non-cumulative monthly tier</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${approvedTier === tier.id ? "bg-emerald-50 text-emerald-700" : tier.badgeClass}`}
              >
                {tier.id.charAt(0).toUpperCase() + tier.id.slice(1)}
              </span>
            </div>
            {approvedTier === tier.id ? (
              <p className="mt-3 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Your approved tier
              </p>
            ) : null}
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {tier.perks.map((perk) => (
                <li key={`${tier.id}-${perk}`} className="flex gap-2">
                  <span className="text-slate-500">•</span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Donate via QR code</h2>
        <p className="mt-2 text-sm text-slate-600">
          Scan this QR code to submit your monthly active donor contribution, then request the tier that matches your intended support below.
        </p>
        <div className="mt-4 inline-block rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Image
            src="https://thedurgacenter.org/wp-content/uploads/2026/02/QR-Code-768x755.jpg"
            alt="Durga Bari donation QR code"
            width={320}
            height={315}
            unoptimized
            className="h-auto w-full max-w-[320px]"
          />
        </div>
      </section>

      {approvedTier ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <header>
            <h2 className="text-xl font-semibold text-slate-900">Active donor payment history</h2>
            <p className="mt-1 text-sm text-slate-600">
              Track your active donor payments (Jan 2026 - Dec 2028). Total recorded:{" "}
              <strong>{formatCurrency(activeDonorTotalCents)}</strong>.
            </p>
          </header>

          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">Occurred</th>
                  <th className="px-3 py-2 font-semibold">Tier</th>
                  <th className="px-3 py-2 font-semibold">Subtype (Month)</th>
                  <th className="px-3 py-2 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {activeDonorDonations.length === 0 ? (
                  <tr className="border-t border-slate-100">
                    <td colSpan={4} className="px-3 py-3 text-slate-600">
                      No active donor payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  activeDonorDonations.slice(0, 12).map((donation) => (
                    <tr key={donation.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">
                        {new Date(donation.occurredAt).toLocaleString("en-US")}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{toTierLabelFromDonationType(donation.donationType)}</td>
                      <td className="px-3 py-2 text-slate-700">{getActiveDonorMonthKey(donation) ?? "N/A"}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900">{formatCurrency(donation.amountCents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {monthRange.map((monthKey) => {
              const total = monthTotals.get(monthKey) ?? 0;
              return (
                <article key={monthKey} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <p className="text-xs uppercase tracking-wide text-slate-600">{formatMonthLabel(monthKey)}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(total)}</p>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <PortalActiveDonorRequest
        currentStatus={context.family.activeDonorStatus}
        requestedStatus={context.family.requestedActiveDonorStatus}
        requestedAt={context.family.requestedActiveDonorAt}
        allowedStatuses={allowedStatuses}
      />
    </section>
  );
}
