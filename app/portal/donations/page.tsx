import Link from "next/link";
import { redirect } from "next/navigation";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";
import { MemberEmptyState, PortalArrow, PortalMemberPage } from "@/components/portal-member-page";
import { isNewSitePortal } from "@/lib/portal/is-new-site";
import {
  canAccessMemberContent,
  getCurrentFamilyPortalContext,
  listFamilyDonations,
} from "@/lib/portal/server";
import type { DonationLedgerEntry } from "@/lib/portal/types";

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatBucketLabel = (donationType: DonationLedgerEntry["donationType"]) => {
  if (donationType === "founding_pledge") return "Founding Family";
  if (donationType === "project") return "Project";
  return "Ad-hoc";
};

const formatGiftLabel = (donationType: DonationLedgerEntry["donationType"]) => {
  if (donationType === "founding_pledge") return "Founding family";
  if (donationType === "project") return "Project gift";
  if (donationType === "general") return "General gift";
  if (donationType === "active_donor_bronze") return "Bronze donor";
  if (donationType === "active_donor_silver") return "Silver donor";
  return "Gold donor";
};

const formatMonthSubtype = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));

const getFoundingSubtypeDate = (donation: DonationLedgerEntry) => {
  const metadataMonth = donation.metadata?.founding_month;
  if (typeof metadataMonth === "string" && /^\d{4}-\d{2}$/.test(metadataMonth)) {
    return `${metadataMonth}-01T00:00:00.000Z`;
  }

  return donation.occurredAt;
};

const getDonationSubtype = (
  donation: DonationLedgerEntry,
  projectTitleById: Map<string, string>,
) => {
  if (donation.donationType === "founding_pledge") {
    return `Month: ${formatMonthSubtype(getFoundingSubtypeDate(donation))}`;
  }

  if (donation.donationType === "project") {
    if (!donation.projectId) return "Project (unlinked)";
    return projectTitleById.get(donation.projectId) ?? "Project contribution";
  }

  return "Ad-hoc donation";
};

const getDonationPrivacy = (donation: DonationLedgerEntry) => {
  if (donation.donationType !== "project") {
    return "-";
  }

  return donation.isAnonymous ? "Anonymous to public" : "Named publicly";
};

export const metadata = { title: "Giving history" };

export default async function PortalDonationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const context = await getCurrentFamilyPortalContext();

  if (!context || !context.family.profileCompleted || !canAccessMemberContent(context)) {
    redirect("/portal");
  }

  const donations = await listFamilyDonations(context.family.id, 200);
  const projectIds = Array.from(
    new Set(
      donations
        .map((donation) => donation.projectId)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  let projectTitleById = new Map<string, string>();

  if (projectIds.length > 0) {
    const supabase = createServiceRoleSupabaseClient();

    if (supabase) {
      const { data } = await supabase.from("projects").select("id, title").in("id", projectIds);

      projectTitleById = new Map(
        (data ?? []).map((project) => [project.id as string, project.title as string]),
      );
    }
  }

  if (await isNewSitePortal()) {
    const totalCents = donations.reduce((sum, donation) => sum + donation.amountCents, 0);

    return (
      <PortalMemberPage
        title="Giving history"
        eyebrow="Your family’s impact"
        description="Every gift is part of a bigger story. Follow your family’s contributions to our temple, traditions, and community."
      >
        <dl className="member-metrics member-metrics-two">
          <div>
            <dt>Total recorded</dt>
            <dd>{formatCurrency(totalCents)}</dd>
            <small>
              From the latest{" "}
              {donations.length === 200 ? "200 recorded gifts" : "family giving records"}
            </small>
          </div>
          <div>
            <dt>Contributions</dt>
            <dd>{donations.length}</dd>
            <small>
              {donations.length
                ? "Thank you for being part of our story"
                : "Your giving journey starts whenever you’re ready"}
            </small>
          </div>
        </dl>

        <section className="member-section" aria-labelledby="giving-records-heading">
          <div className="member-section-heading">
            <h2 id="giving-records-heading">Contribution history</h2>
            <Link href="/donate" className="member-inline-link">
              Make a contribution <PortalArrow diagonal />
            </Link>
          </div>
          {donations.length === 0 ? (
            <MemberEmptyState
              icon="giving"
              title="Room for your first act of giving."
              description="Your recorded gifts will appear here in one place. Explore ways to support the work and traditions that matter to you."
            >
              <Link href="/donate" className="member-primary-action">
                Explore ways to give <PortalArrow />
              </Link>
              <Link href="/portal/pledge" className="member-inline-link">
                Learn about active giving
              </Link>
            </MemberEmptyState>
          ) : (
            <div className="member-ledger">
              {donations.map((donation) => {
                const privacy = getDonationPrivacy(donation);
                const detail =
                  donation.donationType === "project"
                    ? getDonationSubtype(donation, projectTitleById)
                    : donation.donationType === "founding_pledge"
                      ? formatMonthSubtype(getFoundingSubtypeDate(donation))
                      : null;
                return (
                  <article key={donation.id} className="member-ledger-row">
                    <div>
                      <strong>{formatGiftLabel(donation.donationType)}</strong>
                      <p>
                        {formatDate(donation.occurredAt)}
                        {detail ? ` · ${detail}` : ""}
                      </p>
                      {donation.notes || privacy !== "-" ? (
                        <small>
                          {[privacy !== "-" ? privacy : null, donation.notes]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                      ) : null}
                    </div>
                    <span>{formatCurrency(donation.amountCents)}</span>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <aside className="member-information-note">
          <strong>Looking for a recent contribution?</strong>
          <p>
            Gifts appear after they are recorded by our finance team. If a record needs attention,{" "}
            <Link href="/contact">contact Durga Bari</Link> with your payment date and amount.
          </p>
        </aside>
      </PortalMemberPage>
    );
  }

  return (
    <section className="db-shell max-w-6xl space-y-6">
      <header className="db-panel p-6 md:p-8">
        <p className="db-kicker">Member Ledger</p>
        <h1 className="db-title mt-3">Donation History</h1>
        <p className="mt-3 text-sm text-[var(--db-text-soft)]">
          All recorded payments for your family account.
        </p>
      </header>

      {donations.length === 0 ? (
        <article className="db-card p-6 text-sm text-[var(--db-text-soft)]">
          No donations are recorded yet.
        </article>
      ) : (
        <div className="db-table">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Bucket</th>
                <th className="px-4 py-3 font-semibold">Subtype</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Public Display</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-800">{formatDate(donation.occurredAt)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatBucketLabel(donation.donationType)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {getDonationSubtype(donation, projectTitleById)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatCurrency(donation.amountCents)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{getDonationPrivacy(donation)}</td>
                  <td className="px-4 py-3 text-slate-600">{donation.notes ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/portal/pledge" className="db-button-secondary text-sm no-underline">
          View pledge progress
        </Link>
        <button type="button" className="db-button-primary text-sm">
          Donate (placeholder)
        </button>
      </div>
    </section>
  );
}
