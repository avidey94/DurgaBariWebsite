import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PortalEventsPanel } from "@/components/portal-events-panel";
import { PortalMemberDashboard } from "@/components/portal-member-dashboard";
import { MemberIcon } from "@/components/portal-member-page";
import { PortalOnboardingForm } from "@/components/portal-onboarding-form";
import { getCurrentUser } from "@/lib/auth/session";
import {
  canAccessMemberContent,
  getCurrentFamilyPortalContext,
  listFamilyDonations,
} from "@/lib/portal/server";
import type { FamilyRole } from "@/lib/portal/types";
import { resolveSiteTheme, SITE_VIEW_COOKIE } from "@/lib/site-theme";

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
          initialAdultsCount={context.family.adultsCount}
          initialChildrenCount={context.family.childrenCount}
        />
      </section>
    );
  }

  if (!canAccessMemberContent(context)) {
    const isSuspended = context.family.portalAccessState === "suspended";
    return (
      <section className="member-access-page">
        <div className="member-access-art" aria-hidden="true">
          <MemberIcon name={isSuspended ? "people" : "home"} size={62} />
          <span />
          <span />
        </div>
        <p className="member-subpage-eyebrow">{isSuspended ? "Member access" : "One last step"}</p>
        <h1>
          {isSuspended
            ? "Let’s reconnect your account."
            : "Your place in the community is almost ready."}
        </h1>
        <p>
          {isSuspended
            ? "Member access for this family account is currently paused. Please contact the Durga Bari team to review your account and help you get connected again."
            : "Your family profile is complete. Our membership team will review it before opening your member space."}
        </p>
        <div className="member-access-account">
          <span className="member-badge">
            <span aria-hidden="true" />
            {isSuspended ? "Access paused" : "Awaiting review"}
          </span>
          <strong>{context.family.familyDisplayName}</strong>
          <small>{user.email}</small>
        </div>
        {!isSuspended ? (
          <ol className="member-access-steps">
            <li>
              <MemberIcon name="check" size={20} />
              <span>
                <strong>Account created</strong>Your sign-in is ready.
              </span>
            </li>
            <li>
              <MemberIcon name="check" size={20} />
              <span>
                <strong>Family profile complete</strong>We have your household details.
              </span>
            </li>
            <li className="is-current">
              <MemberIcon name="clock" size={20} />
              <span>
                <strong>Membership review</strong>Your member space opens after approval.
              </span>
            </li>
          </ol>
        ) : null}
        <div className="member-access-actions">
          {!isSuspended ? (
            <a href="/portal" className="member-primary-action">
              Check membership status
            </a>
          ) : null}
          <Link
            href="/contact"
            className={isSuspended ? "member-primary-action" : "member-secondary-action"}
          >
            Contact the team
          </Link>
          <Link href="/calendar" className="member-secondary-action">
            Explore public events
          </Link>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="member-text-action">
            Sign out of this account
          </button>
        </form>
      </section>
    );
  }

  const allDonations = await listFamilyDonations(context.family.id, 5000);

  const totalDonationsCents = allDonations.reduce((sum, donation) => sum + donation.amountCents, 0);
  const siteTheme = resolveSiteTheme((await cookies()).get(SITE_VIEW_COOKIE)?.value);

  if (siteTheme === "revamp") {
    return (
      <PortalMemberDashboard
        context={context}
        email={user.email}
        totalDonationsCents={totalDonationsCents}
      />
    );
  }

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
            <p className="text-lg font-semibold text-[var(--db-text)]">
              {context.family.familyDisplayName}
            </p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Email</p>
            <p className="text-sm font-semibold text-[var(--db-text)]">
              {context.family.primaryEmail}
            </p>
            <p className="mt-1 text-xs text-[var(--db-text-soft)]">
              Phone:{" "}
              {context.family.phoneNumber?.trim() ? context.family.phoneNumber : "Not provided"}
            </p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Adults</p>
            <p className="text-lg font-semibold text-[var(--db-text)]">
              {context.family.adultsCount}
            </p>
            <p className="mt-1 text-xs text-[var(--db-text-soft)]">
              {context.family.adultNames.length > 0
                ? context.family.adultNames.join(", ")
                : "No adult names listed"}
            </p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Children</p>
            <p className="text-lg font-semibold text-[var(--db-text)]">
              {context.family.childrenCount}
            </p>
            <p className="mt-1 text-xs text-[var(--db-text-soft)]">
              {context.family.childNames.length > 0
                ? context.family.childNames.join(", ")
                : "No child names listed"}
            </p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Roles</p>
            <p className="text-sm font-semibold text-[var(--db-text)]">
              {activeRoleLabels.join(", ")}
            </p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Total Donations Made</p>
            <p className="text-lg font-semibold text-[var(--db-text)]">
              {formatCurrency(totalDonationsCents)}
            </p>
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
          {context.family.activeDonorStatus !== "none"
            ? "View Active Donor Portal"
            : "Become an active donor"}
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
