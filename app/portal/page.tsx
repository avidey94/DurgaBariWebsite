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
  if (role === "site_content_manager") return "Site Content Manager";
  if (role === "membership_manager") return "Membership Manager";
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
    <section className="db-card space-y-4 p-6">
      <header>
        <h2 className="text-2xl font-semibold text-[var(--db-text)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--db-text-soft)]">{subtitle}</p>
      </header>
      <div className="db-table">
        <table className="min-w-full text-sm">
          <thead className="text-left">
            <tr>
              <th className="px-3 py-2 font-semibold">Month</th>
              {showExpected ? <th className="px-3 py-2 font-semibold">Expected</th> : null}
              <th className="px-3 py-2 font-semibold">Paid</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.monthKey}>
                <td className="text-[var(--db-text)]">{row.monthLabel}</td>
                {showExpected ? (
                  <td className="text-[var(--db-text-soft)]">{formatCurrency(row.expectedCents ?? 0)}</td>
                ) : null}
                <td className="font-semibold text-[var(--db-text)]">{formatCurrency(row.paidCents)}</td>
                <td className="text-[var(--db-text-soft)]">{contributionStatus(row)}</td>
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
      <section className="db-shell max-w-6xl">
        <PortalOnboardingForm email={user.email} />
      </section>
    );
  }

  if (!context.family.profileCompleted) {
      return (
      <section className="db-shell max-w-6xl">
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

  if (context.family.activeDonorStatus !== "none") {
    const tierLabel =
      context.family.activeDonorStatus[0].toUpperCase() + context.family.activeDonorStatus.slice(1);
    activeRoleLabels.push(`Active ${tierLabel} Donor`);
  }

  if (donorTier) {
    activeRoleLabels.push(`${donorTier[0].toUpperCase()}${donorTier.slice(1)} Donor`);
  }

  const nowMonth = normalizeToUtcMonth(new Date());
  const activeDonorMonths = buildMonthRange(normalizeToUtcMonth(context.family.createdAt), nowMonth);
  const activeDonorRows = buildMonthlyRows(activeDonorMonths, allDonations);

  return (
    <section className="db-shell max-w-6xl space-y-6">
      <header className="db-panel p-6 md:p-8">
        <p className="db-kicker">Member Dashboard</p>
        <h1 className="db-title mt-3">Your Portal</h1>
        <p className="mt-3 text-sm text-[var(--db-text-soft)]">
          Signed in as: <strong>{user.email}</strong>
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="db-kicker text-[0.68rem]">Family Name</p>
            <p className="text-lg font-semibold text-[var(--db-text)]">{context.family.familyDisplayName}</p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Email</p>
            <p className="text-sm font-semibold text-[var(--db-text)]">{context.family.primaryEmail}</p>
            <p className="mt-1 text-xs text-[var(--db-text-soft)]">
              Phone: {context.family.phoneNumber?.trim() ? context.family.phoneNumber : "Not provided"}
            </p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Adults</p>
            <p className="text-lg font-semibold text-[var(--db-text)]">{context.family.adultsCount}</p>
            <p className="mt-1 text-xs text-[var(--db-text-soft)]">
              {context.family.adultNames.length > 0 ? context.family.adultNames.join(", ") : "No adult names listed"}
            </p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Children</p>
            <p className="text-lg font-semibold text-[var(--db-text)]">{context.family.childrenCount}</p>
            <p className="mt-1 text-xs text-[var(--db-text-soft)]">
              {context.family.childNames.length > 0 ? context.family.childNames.join(", ") : "No child names listed"}
            </p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Roles</p>
            <p className="text-sm font-semibold text-[var(--db-text)]">{activeRoleLabels.join(", ")}</p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Total Donations Made</p>
            <p className="text-lg font-semibold text-[var(--db-text)]">{formatCurrency(totalDonationsCents)}</p>
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
        {context.family.foundingFamilyStatus !== "not_founding" ? (
          <Link
            href="/portal/foundingfamily"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Founding family donation tracker
          </Link>
        ) : null}
        <Link
          href="/portal/pledge"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          {context.family.activeDonorStatus !== "none" ? "View Active Donor Portal" : "Become an active donor"}
        </Link>
        <Link
          href="/portal/volunteer"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          Volunteer
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
