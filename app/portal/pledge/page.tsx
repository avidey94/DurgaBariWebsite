import Image from "next/image";
import { redirect } from "next/navigation";

import { PortalActiveDonorRequest } from "@/components/portal-active-donor-request";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentFamilyPortalContext } from "@/lib/portal/server";

const tiers = [
  {
    id: "bronze",
    title: "Bronze Active Donor",
    contribution: "Suggested: $500+ cumulative",
    perks: [
      "Recognition in the active donor roster on the sponsors page",
      "Quarterly donor updates and community milestone briefings",
      "Priority volunteer signup windows for major events",
    ],
  },
  {
    id: "silver",
    title: "Silver Active Donor",
    contribution: "Suggested: $1,500+ cumulative",
    perks: [
      "Everything in Bronze plus expanded recognition placement",
      "Invites to periodic donor appreciation sessions",
      "Early notice on major campaign and event initiatives",
    ],
  },
  {
    id: "gold",
    title: "Gold Active Donor",
    contribution: "Suggested: $3,000+ cumulative",
    perks: [
      "Everything in Silver plus top-tier active donor recognition",
      "Special acknowledgment for flagship community campaigns",
      "Priority outreach for temple-impact funding initiatives",
    ],
  },
] as const;

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

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {approvedTier ? "Active Donor Portal" : "Become an Active Donor"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {approvedTier
            ? "You are an approved active donor. Review all tiers, your current level highlight, and continue supporting via QR."
            : "Learn about Bronze, Silver, and Gold active donor tiers. Choose your intended tier, donate using QR, then submit your request for admin approval."}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <article
            key={tier.id}
            className={`rounded-lg border bg-white p-5 ${
              approvedTier === tier.id
                ? "border-2 border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.22)]"
                : "border-slate-200"
            }`}
          >
            <h2 className="text-lg font-semibold text-slate-900">{tier.title}</h2>
            {approvedTier === tier.id ? (
              <p className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Your approved tier
              </p>
            ) : null}
            <p className="mt-1 text-sm text-slate-700">{tier.contribution}</p>
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
          Scan this QR code to submit your donation, then request your intended active donor tier below.
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

      <PortalActiveDonorRequest
        currentStatus={context.family.activeDonorStatus}
        requestedStatus={context.family.requestedActiveDonorStatus}
        requestedAt={context.family.requestedActiveDonorAt}
      />
    </section>
  );
}
