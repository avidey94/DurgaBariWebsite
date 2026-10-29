import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { ArrowLeftIcon } from "@/components/elevated/Icons";
import { canCurrentUserManageCms } from "@/lib/cms/access";
import { getRevampFieldRenderer } from "@/lib/cms/revamp-fields";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectDetailsBySlug } from "@/lib/portal/server";
import { resolveSiteTheme, SITE_VIEW_COOKIE } from "@/lib/site-theme";

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
  const theme = resolveSiteTheme((await cookies()).get(SITE_VIEW_COOKIE)?.value);
  const { slug } = await params;
  const user = await getCurrentUser();
  const details = await getProjectDetailsBySlug(slug, Boolean(user));

  if (!details) {
    notFound();
  }

  const fundedAmount = details.funding?.fundedAmountCents ?? 0;
  const percent = Math.max(0, Math.min(100, details.funding?.percentFunded ?? 0));

  if (theme === "revamp") {
    const field = await getRevampFieldRenderer("project-detail", "en", await canCurrentUserManageCms());
    return <main className="editorial-page elevated-wrap elevated-project-detail">
      <Link className="elevated-text-link" href="/projects"><ArrowLeftIcon /> Back to projects</Link>
      <header className="editorial-hero"><div className="editorial-hero-copy"><p className="elevated-eyebrow">{details.project.status} project</p><h1>{details.project.title}</h1><p>{details.project.shortDescription}</p></div></header>
      {details.project.coverImageUrl && <div className="elevated-project-cover"><img src={details.project.coverImageUrl} alt="" loading="lazy" /></div>}
      <section className="elevated-project-detail-stats"><div><p className="elevated-eyebrow">Raised</p><strong>{formatCurrency(fundedAmount)}</strong></div><div><p className="elevated-eyebrow">Goal</p><strong>{formatCurrency(details.project.fundingGoalCents)}</strong></div><div><p className="elevated-eyebrow">Funded</p><strong>{percent.toFixed(1)}%</strong></div><div className="elevated-project-progress" role="progressbar" aria-label="Funding progress" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div></section>
      <div className="elevated-project-detail-body"><p>{details.project.fullDescription}</p></div>
      <section className="elevated-project-detail-list"><h2>Updates</h2>{details.updates.length === 0 ? <p>No updates have been published yet.</p> : <ul>{details.updates.map((update) => <li key={update.id}><time>{update.publishedAt ? formatDate(update.publishedAt) : "Draft"}</time><h3>{update.title}</h3><p>{update.body}</p></li>)}</ul>}</section>
      <section className="elevated-project-detail-list"><h2>Supporters</h2>{details.supporters.length === 0 ? <p>No public supporters yet.</p> : <ul>{details.supporters.map((supporter) => <li key={supporter.donationId} className="elevated-project-supporter"><span>{supporter.familyName}</span><strong>{formatCurrency(supporter.amountCents)}</strong></li>)}</ul>}</section>
      <div className="elevated-events-end">{field("end-body", "Support the wider Durga Bari mission.")}{field.link("give-link", "Ways to give", "/join-hands-to-build-durga-bari/", "elevated-text-link")}</div>
    </main>;
  }

  return (
    <section className="db-shell space-y-6">
      <header className="db-panel p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="db-title">{details.project.title}</h1>
          <span className="db-pill">
            {details.project.status}
          </span>
        </div>
        {details.project.coverImageUrl ? (
          <div className="mt-5 overflow-hidden rounded-[var(--db-radius-md)] border border-[var(--db-border-soft)] bg-[var(--db-surface-soft)]">
            <img
              src={details.project.coverImageUrl}
              alt={details.project.title}
              className="h-64 w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
        <p className="db-subtitle mt-4">{details.project.shortDescription}</p>
      </header>

      <article className="db-card p-6 md:p-8">
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

        <div className="mt-5 h-3 w-full rounded-full bg-[var(--db-surface-soft)]">
          <div className="h-3 rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
        </div>

        <p className="db-prose mt-6 whitespace-pre-line text-sm">{details.project.fullDescription}</p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className="db-button-primary text-sm"
          >
            Donate to project (placeholder)
          </button>
          <Link
            href="/projects"
            className="db-button-secondary text-sm no-underline"
          >
            Back to projects
          </Link>
        </div>
      </article>

      <article className="db-card p-6 md:p-8">
        <h2 className="db-title text-[2rem]">Project Updates</h2>
        {details.updates.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No updates have been published yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {details.updates.map((update) => (
              <li key={update.id} className="db-card-muted p-4">
                <p className="text-sm font-semibold text-slate-900">{update.title}</p>
                <p className="mt-1 text-xs text-slate-500">{update.publishedAt ? formatDate(update.publishedAt) : "Draft"}</p>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{update.body}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="db-card p-6 md:p-8">
        <h2 className="db-title text-[2rem]">Supporters</h2>
        {details.supporters.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No public supporters yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {details.supporters.map((supporter) => (
              <li key={supporter.donationId} className="db-card-muted flex items-center justify-between gap-3 p-4">
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
