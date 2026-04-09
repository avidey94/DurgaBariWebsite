import Link from "next/link";
import { redirect } from "next/navigation";

import { PortalEventsPanel } from "@/components/portal-events-panel";
import { PortalOnboardingForm } from "@/components/portal-onboarding-form";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getCurrentFamilyPortalContext,
  listFamilyDonations,
} from "@/lib/portal/server";
import type { FamilyRole } from "@/lib/portal/types";

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

const roleLabel = (role: FamilyRole) => {
  if (role === "super_admin") return "Active Super Admin";
  if (role === "treasurer") return "Treasurer";
  if (role === "event_manager") return "Event Manager";
  if (role === "site_content_manager") return "Site Content Manager";
  if (role === "membership_manager") return "Membership Manager";
  return "Member";
};

type CumulativeRecognitionTier =
  | "grand_benefactor_member"
  | "benefactor_member"
  | "grand_patron_member"
  | null;

const getCumulativeRecognitionTier = (totalCents: number): CumulativeRecognitionTier => {
  if (totalCents >= 2500000) return "grand_benefactor_member";
  if (totalCents >= 1500000) return "benefactor_member";
  if (totalCents >= 1000000) return "grand_patron_member";
  return null;
};

const cumulativeRecognitionLabel = (tier: Exclude<CumulativeRecognitionTier, null>) => {
  if (tier === "grand_benefactor_member") return "Grand Benefactor Member";
  if (tier === "benefactor_member") return "Benefactor Member";
  return "Grand Patron Member";
};

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
  const cumulativeRecognitionTier = getCumulativeRecognitionTier(totalDonationsCents);
  const activeRoleLabels: string[] = context.roles.map((role) => roleLabel(role));

  if (context.family.foundingFamilyStatus !== "not_founding") {
    activeRoleLabels.unshift("Founding Family");
  }

  if (context.family.activeDonorStatus !== "none") {
    const tierLabel =
      context.family.activeDonorStatus[0].toUpperCase() + context.family.activeDonorStatus.slice(1);
    activeRoleLabels.push(`Active ${tierLabel} Donor`);
  }

  if (cumulativeRecognitionTier) {
    activeRoleLabels.push(cumulativeRecognitionLabel(cumulativeRecognitionTier));
  }

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
