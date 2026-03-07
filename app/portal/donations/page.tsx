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
      <section className="mx-auto max-w-6xl space-y-4 px-6 py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Donation History</h1>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
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
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Donation History</h1>
        <p className="mt-2 text-sm text-slate-600">All recorded payments for your family account.</p>
      </header>

      {donations.length === 0 ? (
        <article className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-700">
          No donations are recorded yet.
        </article>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
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
        <Link
          href="/portal/pledge"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          View pledge progress
        </Link>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Donate (placeholder)
        </button>
      </div>
    </section>
  );
}
