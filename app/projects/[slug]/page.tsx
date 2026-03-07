import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { getProjectDetailsBySlug } from "@/lib/portal/server";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const details = await getProjectDetailsBySlug(slug, Boolean(user));

  if (!details) {
    notFound();
  }

  const fundedAmount = details.funding?.fundedAmountCents ?? 0;
  const percent = Math.max(0, Math.min(100, details.funding?.percentFunded ?? 0));

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{details.project.title}</h1>
          <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs uppercase text-slate-600">
            {details.project.status}
          </span>
        </div>
        {details.project.coverImageUrl ? (
          <div className="mt-4 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            <img
              src={details.project.coverImageUrl}
              alt={details.project.title}
              className="h-64 w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
        <p className="mt-2 text-sm text-slate-700">{details.project.shortDescription}</p>
      </header>

      <article className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Raised</p>
            <p className="text-xl font-semibold text-slate-900">{formatCurrency(fundedAmount)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Goal</p>
            <p className="text-xl font-semibold text-slate-900">{formatCurrency(details.project.fundingGoalCents)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Funded</p>
            <p className="text-xl font-semibold text-slate-900">{percent.toFixed(1)}%</p>
          </div>
        </div>

        <div className="mt-4 h-3 w-full rounded-full bg-slate-200">
          <div className="h-3 rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
        </div>

        <p className="mt-5 whitespace-pre-line text-sm text-slate-700">{details.project.fullDescription}</p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Donate to project (placeholder)
          </button>
          <Link
            href="/projects"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Back to projects
          </Link>
        </div>
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Project Updates</h2>
        {details.updates.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No updates have been published yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {details.updates.map((update) => (
              <li key={update.id} className="rounded-md border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{update.title}</p>
                <p className="mt-1 text-xs text-slate-500">{update.publishedAt ? formatDate(update.publishedAt) : "Draft"}</p>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{update.body}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Supporters</h2>
        {details.supporters.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No public supporters yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {details.supporters.map((supporter) => (
              <li key={supporter.donationId} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                <span className="text-sm text-slate-800">{supporter.familyName}</span>
                <span className="text-sm font-semibold text-slate-900">{formatCurrency(supporter.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
