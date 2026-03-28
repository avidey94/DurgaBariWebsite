import Link from "next/link";
import { redirect } from "next/navigation";

import { PortalEventsPanel } from "@/components/portal-events-panel";
import { PortalOnboardingForm } from "@/components/portal-onboarding-form";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getCurrentFamilyPortalContext,
  listFamilyDonations,
} from "@/lib/portal/server";
import type { DonationLedgerEntry, FamilyRole } from "@/lib/portal/types";

interface MonthlyContributionRow {
  monthLabel: string;
  monthKey: string;
  paidCents: number;
  expectedCents: number | null;
}

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);

const monthKeyForDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const startOfUtcMonth = (year: number, monthIndex: number) => new Date(Date.UTC(year, monthIndex, 1));

const normalizeToUtcMonth = (dateInput: string | Date) => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return startOfUtcMonth(date.getUTCFullYear(), date.getUTCMonth());
};

const buildMonthRange = (startMonth: Date, endMonth: Date): Date[] => {
  const cursor = startOfUtcMonth(startMonth.getUTCFullYear(), startMonth.getUTCMonth());
  const end = startOfUtcMonth(endMonth.getUTCFullYear(), endMonth.getUTCMonth());
  const months: Date[] = [];

  while (cursor.getTime() <= end.getTime()) {
    months.push(new Date(cursor.getTime()));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months;
};

const buildMonthlyRows = (
  months: Date[],
  donations: DonationLedgerEntry[],
  options?: { expectedCentsPerMonth?: number; donationType?: DonationLedgerEntry["donationType"] },
): MonthlyContributionRow[] => {
  const totalsByMonth = new Map<string, number>();
  const donationType = options?.donationType;

  donations.forEach((donation) => {
    if (donationType && donation.donationType !== donationType) {
      return;
    }

    const monthKey = monthKeyForDate(new Date(donation.occurredAt));
    totalsByMonth.set(monthKey, (totalsByMonth.get(monthKey) ?? 0) + donation.amountCents);
  });

  return months.map((monthDate) => {
    const monthKey = monthKeyForDate(monthDate);
    return {
      monthLabel: formatMonthLabel(monthDate),
      monthKey,
      paidCents: totalsByMonth.get(monthKey) ?? 0,
      expectedCents: options?.expectedCentsPerMonth ?? null,
    };
  });
};

const roleLabel = (role: FamilyRole) => {
  if (role === "super_admin") return "Active Super Admin";
  if (role === "treasurer") return "Treasurer";
  if (role === "event_manager") return "Event Manager";
  return "Member";
};

type DonorTier = "gold" | "silver" | "bronze" | null;

const getDonorTier = (totalCents: number): DonorTier => {
  // Initial thresholds for portal display; can be replaced with admin-managed tiers later.
  if (totalCents >= 300000) return "gold";
  if (totalCents >= 150000) return "silver";
  if (totalCents >= 50000) return "bronze";
  return null;
};

const contributionStatus = (row: MonthlyContributionRow) => {
  if (row.expectedCents === null) {
    return row.paidCents > 0 ? "Contributed" : "No payment";
  }

  if (row.paidCents >= row.expectedCents) {
    return "On track";
  }

  if (row.paidCents > 0) {
    return "Partial";
  }

  return "Due";
};

interface MonthlyContributionTableProps {
  title: string;
  subtitle: string;
  rows: MonthlyContributionRow[];
  showExpected: boolean;
}

function MonthlyContributionTable({ title, subtitle, rows, showExpected }: MonthlyContributionTableProps) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </header>
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-3 py-2 font-semibold">Month</th>
              {showExpected ? <th className="px-3 py-2 font-semibold">Expected</th> : null}
              <th className="px-3 py-2 font-semibold">Paid</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.monthKey} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-800">{row.monthLabel}</td>
                {showExpected ? (
                  <td className="px-3 py-2 text-slate-700">{formatCurrency(row.expectedCents ?? 0)}</td>
                ) : null}
                <td className="px-3 py-2 font-semibold text-slate-900">{formatCurrency(row.paidCents)}</td>
                <td className="px-3 py-2 text-slate-700">{contributionStatus(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function PortalPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const context = await getCurrentFamilyPortalContext();

  if (!context) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-8">
        <PortalOnboardingForm email={user.email} />
      </section>
    );
  }

  if (!context.family.profileCompleted) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-8">
        <PortalOnboardingForm
          email={user.email}
          initialName={context.family.familyDisplayName}
          initialAdultsCount={context.family.adultsCount}
          initialChildrenCount={context.family.childrenCount}
        />
      </section>
    );
  }

  const allDonations = await listFamilyDonations(context.family.id, 5000);

  const totalDonationsCents = allDonations.reduce((sum, donation) => sum + donation.amountCents, 0);
  const donorTier = getDonorTier(totalDonationsCents);
  const activeRoleLabels: string[] = context.roles.map((role) => roleLabel(role));

  if (context.family.foundingFamilyStatus !== "not_founding") {
    activeRoleLabels.unshift("Founding Family");
  }

  if (donorTier) {
    activeRoleLabels.push(`${donorTier[0].toUpperCase()}${donorTier.slice(1)} Donor`);
  }

  const nowMonth = normalizeToUtcMonth(new Date());
  const activeDonorMonths = buildMonthRange(normalizeToUtcMonth(context.family.createdAt), nowMonth);
  const activeDonorRows = buildMonthlyRows(activeDonorMonths, allDonations);

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Your Portal</h1>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as: <strong>{user.email}</strong>
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Family Name</p>
            <p className="text-lg font-semibold text-slate-900">{context.family.familyDisplayName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
            <p className="text-sm font-semibold text-slate-900">{context.family.primaryEmail}</p>
            <p className="mt-1 text-xs text-slate-600">
              Phone: {context.family.phoneNumber?.trim() ? context.family.phoneNumber : "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Adults</p>
            <p className="text-lg font-semibold text-slate-900">{context.family.adultsCount}</p>
            <p className="mt-1 text-xs text-slate-600">
              {context.family.adultNames.length > 0 ? context.family.adultNames.join(", ") : "No adult names listed"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Children</p>
            <p className="text-lg font-semibold text-slate-900">{context.family.childrenCount}</p>
            <p className="mt-1 text-xs text-slate-600">
              {context.family.childNames.length > 0 ? context.family.childNames.join(", ") : "No child names listed"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Roles</p>
            <p className="text-sm font-semibold text-slate-900">{activeRoleLabels.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Donations Made</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalDonationsCents)}</p>
          </div>
        </div>
      </header>

      {donorTier ? (
        <MonthlyContributionTable
          title="Active Donor Monthly Contributions"
          subtitle={`Showing monthly donations from signup (${formatMonthLabel(normalizeToUtcMonth(context.family.createdAt))}) to present.`}
          rows={activeDonorRows}
          showExpected={false}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/portal/donations"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          View donation history
        </Link>
        <Link
          href="/portal/pledge"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          View pledge details
        </Link>
        <Link
          href="/portal/expense"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          Expenses
        </Link>
      </div>

      <PortalEventsPanel />
    </section>
  );
}
