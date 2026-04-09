import Link from "next/link";
import { redirect } from "next/navigation";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentFamilyPortalContext, listFamilyDonations } from "@/lib/portal/server";
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

const getDonationSubtype = (donation: DonationLedgerEntry, projectTitleById: Map<string, string>) => {
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

export default async function PortalDonationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const context = await getCurrentFamilyPortalContext();

  if (!context) {
    return (
      <section className="db-shell max-w-6xl space-y-4">
        <h1 className="db-title">Donation History</h1>
        <p className="db-card-muted p-4 text-sm text-amber-900">
          Family profile was not found for your account.
        </p>
      </section>
    );
  }

  const donations = await listFamilyDonations(context.family.id, 200);
  const projectIds = Array.from(
    new Set(donations.map((donation) => donation.projectId).filter((value): value is string => Boolean(value))),
  );
  let projectTitleById = new Map<string, string>();

  if (projectIds.length > 0) {
    const supabase = createServiceRoleSupabaseClient();

    if (supabase) {
      const { data } = await supabase
        .from("projects")
        .select("id, title")
        .in("id", projectIds);

      projectTitleById = new Map((data ?? []).map((project) => [project.id as string, project.title as string]));
    }
  }

  return (
    <section className="db-shell max-w-6xl space-y-6">
      <header className="db-panel p-6 md:p-8">
        <p className="db-kicker">Member Ledger</p>
        <h1 className="db-title mt-3">Donation History</h1>
        <p className="mt-3 text-sm text-[var(--db-text-soft)]">All recorded payments for your family account.</p>
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
                  <td className="px-4 py-3 text-slate-700">{formatBucketLabel(donation.donationType)}</td>
                  <td className="px-4 py-3 text-slate-700">{getDonationSubtype(donation, projectTitleById)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(donation.amountCents)}</td>
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
        <button
          type="button"
          className="db-button-primary text-sm"
        >
          Donate (placeholder)
        </button>
      </div>
    </section>
  );
}
