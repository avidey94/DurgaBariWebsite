import Link from "next/link";

import { getCurrentFamilyPortalContext, listPublicProjectsWithContributors } from "@/lib/portal/server";
import type { FundingProject } from "@/lib/portal/types";

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

const statusPillClasses: Record<FundingProject["status"], string> = {
  planned: "bg-amber-50 text-amber-800 ring-amber-200",
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  funded: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  completed: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  archived: "bg-slate-100 text-slate-700 ring-slate-200",
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export default async function ProjectsPage() {
  const context = await getCurrentFamilyPortalContext();
  const projects = await listPublicProjectsWithContributors(100, context?.family.id ?? null);

  return (
    <section className="db-shell space-y-8">
      <header className="db-panel p-8 md:p-10">
        <p className="db-kicker">Open Campaigns</p>
        <h1 className="db-display mt-3 max-w-4xl">Build The Next Temple Milestones</h1>
        <p className="db-subtitle mt-5 max-w-3xl">
          Kickstarter-style project funding for the whole community. Everyone can track goals, progress, and top contributors in real time.
        </p>
      </header>

      {projects.length === 0 ? (
        <article className="db-card p-6 text-sm text-[var(--db-text-soft)]">
          No public projects are available yet.
        </article>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {projects.map((item) => {
            const project = item.project;
            const fundedAmount = item.funding?.fundedAmountCents ?? 0;
            const percent = clampPercent(item.funding?.percentFunded ?? 0);
            const maxContributor = item.contributors[0]?.amountCents ?? 0;

              return (
                <article
                  key={project.id}
                  className="db-card p-6 transition hover:-translate-y-px"
                >
                  {project.coverImageUrl ? (
                    <div className="mb-5 overflow-hidden rounded-[var(--db-radius-sm)] border border-[var(--db-border-soft)] bg-[var(--db-surface-soft)]">
                      <img
                        src={project.coverImageUrl}
                        alt={project.title}
                        className="h-44 w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-[var(--db-text)]">{project.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--db-text-soft)]">{project.shortDescription}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${
                      statusPillClasses[project.status] ?? statusPillClasses.active
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="db-card-muted mt-6 grid grid-cols-3 gap-3 p-4 text-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Goal</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(project.fundingGoalCents)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Funded</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-700">{formatCurrency(fundedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contributors</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{item.totalContributors}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>Funding progress</span>
                    <span>{percent.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="db-card-muted mt-5 p-4">
                  <p className="text-sm font-semibold text-[var(--db-text)]">Top contributors</p>
                  {item.myAnonymousContributionCents > 0 ? (
                    <p className="mt-1 text-xs text-slate-600">
                      You contributed {formatCurrency(item.myAnonymousContributionCents)} anonymously out of{" "}
                      {formatCurrency(item.anonymousTotalCents)} anonymous total.
                    </p>
                  ) : null}
                  {item.contributors.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-600">No public contributions yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {item.contributors.map((contributor) => {
                        const width = maxContributor > 0 ? Math.max(8, (contributor.amountCents / maxContributor) * 100) : 0;
                        return (
                          <li key={`${project.id}-${contributor.contributorLabel}`} className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-700">
                              <span className="truncate font-medium">{contributor.contributorLabel}</span>
                              <span className="font-semibold text-slate-900">{formatCurrency(contributor.amountCents)}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-sky-600"
                                style={{ width: `${Math.min(100, width)}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="db-button-secondary text-sm no-underline"
                  >
                    View Details
                  </Link>
                  <button
                    type="button"
                    className="db-button-primary text-sm"
                  >
                    Back This Project
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
