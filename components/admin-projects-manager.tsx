"use client";

import { useEffect, useMemo, useState } from "react";

import {
  WorkspaceEmpty,
  WorkspaceIcon,
  WorkspaceNotice,
} from "@/components/workspace/workspace-ui";
import { parseDollarAmount } from "@/lib/portal/currency";
import type { ProjectStatus } from "@/lib/portal/types";

interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  cover_image_url: string | null;
  funding_goal_cents: number;
  status: ProjectStatus;
  featured: boolean;
  is_public: boolean;
}

interface FundingRow {
  project_id: string;
  funded_amount_cents: number;
  percent_funded: number;
}

interface ProjectsPayload {
  projects: ProjectRow[];
  funding: FundingRow[];
  message?: string;
}

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

export function AdminProjectsManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState("");
  const [success, setSuccess] = useState("");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [funding, setFunding] = useState<FundingRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Partial<ProjectRow>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});

  const [newTitle, setNewTitle] = useState("");
  const [newShortDescription, setNewShortDescription] = useState("");
  const [newFullDescription, setNewFullDescription] = useState("");
  const [newCoverImageUrl, setNewCoverImageUrl] = useState("");
  const [newGoal, setNewGoal] = useState("1000");
  const [goalInputs, setGoalInputs] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/projects", { cache: "no-store" });
      const payload = (await response.json()) as ProjectsPayload;

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load projects.");
      }

      setProjects(payload.projects ?? []);
      setFunding(payload.funding ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const fundingByProjectId = useMemo(
    () => new Map(funding.map((row) => [row.project_id, row])),
    [funding],
  );

  const rows = useMemo(
    () => projects.map((project) => ({ ...project, ...drafts[project.id] })),
    [projects, drafts],
  );

  const updateDraft = <K extends keyof ProjectRow>(id: string, field: K, value: ProjectRow[K]) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  };

  const saveProject = async (id: string) => {
    const draft = drafts[id];

    if (!draft) {
      return;
    }

    if (goalInputs[id] !== undefined && parseDollarAmount(goalInputs[id]) === null) {
      setError("Enter a funding goal in dollars, with no more than two decimal places.");
      return;
    }
    setSavingById((current) => ({ ...current, [id]: true }));
    setError(null);

    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          slug: draft.slug,
          shortDescription: draft.short_description,
          fullDescription: draft.full_description,
          coverImageUrl: draft.cover_image_url,
          fundingGoalCents: draft.funding_goal_cents,
          status: draft.status,
          featured: draft.featured,
          isPublic: draft.is_public,
        }),
      });

      const payload = (await response.json()) as { project?: ProjectRow; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to save project.");
      }

      if (payload.project) {
        setProjects((current) =>
          current.map((row) => (row.id === id ? (payload.project as ProjectRow) : row)),
        );
      }

      setSuccess("Project changes saved.");
      setDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save project.");
    } finally {
      setSavingById((current) => ({ ...current, [id]: false }));
    }
  };

  const createProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const goalCents = parseDollarAmount(newGoal);
    if (goalCents === null) {
      setError("Enter a valid funding goal in dollars.");
      return;
    }
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          shortDescription: newShortDescription,
          fullDescription: newFullDescription,
          coverImageUrl: newCoverImageUrl,
          fundingGoalCents: goalCents,
          status: "planned",
          featured: false,
          isPublic: true,
        }),
      });

      const payload = (await response.json()) as { project?: ProjectRow; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to create project.");
      }

      if (payload.project) {
        setProjects((current) => [payload.project as ProjectRow, ...current]);
      }

      setShowCreateForm(false);
      setSuccess("Project created. Add campaign details and update its status when it is ready.");
      setNewTitle("");
      setNewShortDescription("");
      setNewFullDescription("");
      setNewCoverImageUrl("");
      setNewGoal("1000");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create project.");
    } finally {
      setCreating(false);
    }
  };

  const visibleRows = rows.filter(
    (row) =>
      (statusFilter === "all" || row.status === statusFilter) &&
      `${row.title} ${row.short_description}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <section className="admin-workflow">
      <div className="workflow-context">
        <div className="workflow-context-icon">
          <WorkspaceIcon name="folder" size={22} />
        </div>
        <div>
          <p className="workflow-eyebrow">Building our future</p>
          <h2>Purpose behind every project</h2>
          <p>
            Turn community priorities into clear campaigns, and show families what their giving
            makes possible.
          </p>
        </div>
        <button
          type="button"
          className="workflow-button workflow-button-primary"
          onClick={() => setShowCreateForm((value) => !value)}
          aria-expanded={showCreateForm}
          aria-controls="create-project-form"
        >
          <WorkspaceIcon name={showCreateForm ? "close" : "plus"} size={17} />
          {showCreateForm ? "Close form" : "New project"}
        </button>
      </div>
      <div className="workflow-stats">
        <div>
          <span>
            {loading ? "—" : projects.filter((project) => project.status === "active").length}
          </span>
          <p>Active campaigns</p>
        </div>
        <div>
          <span>
            {loading
              ? "—"
              : formatCurrency(
                  funding.reduce((total, item) => total + item.funded_amount_cents, 0),
                )}
          </span>
          <p>Community funding</p>
        </div>
        <div>
          <span>
            {loading ? "—" : projects.filter((project) => project.status === "completed").length}
          </span>
          <p>Completed projects</p>
        </div>
      </div>
      {showCreateForm ? (
        <form id="create-project-form" className="workflow-create-panel" onSubmit={createProject}>
          <div>
            <p className="workflow-eyebrow">A new community priority</p>
            <h3>Create a project</h3>
            <p className="workflow-helper">
              New projects start as planned and are public. You can adjust visibility after creating
              the project.
            </p>
          </div>
          <div className="workflow-form-grid">
            <label className="workflow-field">
              Project title
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                required
                placeholder="What are we building together?"
              />
            </label>
            <label className="workflow-field">
              Funding goal (USD)
              <input
                value={newGoal}
                onChange={(event) => setNewGoal(event.target.value)}
                inputMode="decimal"
                type="number"
                min={0.01}
                step="0.01"
                required
              />
            </label>
            <label className="workflow-field">
              Short description
              <input
                value={newShortDescription}
                onChange={(event) => setNewShortDescription(event.target.value)}
                required
                placeholder="A clear introduction for families"
              />
            </label>
            <label className="workflow-field">
              Cover image URL (optional)
              <input
                value={newCoverImageUrl}
                onChange={(event) => setNewCoverImageUrl(event.target.value)}
                type="url"
                placeholder="https://"
              />
            </label>
          </div>
          <label className="workflow-field">
            Full project story
            <textarea
              value={newFullDescription}
              onChange={(event) => setNewFullDescription(event.target.value)}
              rows={4}
              required
              placeholder="Explain the need, the plan and the impact."
            />
          </label>
          <div className="workflow-actions">
            <button
              type="submit"
              disabled={creating}
              className="workflow-button workflow-button-primary"
            >
              {creating ? "Creating project…" : "Create project"}
              <WorkspaceIcon name="arrow" size={16} />
            </button>
            <button
              type="button"
              className="workflow-button workflow-button-quiet"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      {error ? (
        <WorkspaceNotice tone="error">
          {error}{" "}
          <button type="button" onClick={() => void loadProjects()}>
            Try again
          </button>
        </WorkspaceNotice>
      ) : null}
      {success ? <WorkspaceNotice tone="success">{success}</WorkspaceNotice> : null}
      <div className="workflow-toolbar">
        <label className="workflow-search">
          <WorkspaceIcon name="search" size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search projects"
            placeholder="Find a community project"
          />
        </label>
        <label className="workflow-filter">
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All projects</option>
            {["planned", "active", "funded", "completed", "archived"].map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading ? (
        <div className="workflow-loading" role="status">
          <span className="workflow-loading-dot" /> Gathering community projects…
        </div>
      ) : null}
      {!loading && !error && !visibleRows.length ? (
        <WorkspaceEmpty
          icon="folder"
          eyebrow={search || statusFilter !== "all" ? "Project results" : "Community impact"}
          title={
            search || statusFilter !== "all"
              ? "No projects match this view"
              : "A shared vision starts with one project"
          }
          description={
            search || statusFilter !== "all"
              ? "Try another search or view all project statuses."
              : "Introduce a community need, set a funding goal and give families a meaningful way to help build Durga Bari’s future."
          }
          action={
            search || statusFilter !== "all" ? (
              <button
                type="button"
                className="workflow-button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </button>
            ) : (
              <button
                type="button"
                className="workflow-button workflow-button-primary"
                onClick={() => setShowCreateForm(true)}
              >
                <WorkspaceIcon name="plus" size={17} />
                Create the first project
              </button>
            )
          }
        />
      ) : null}
      {!loading ? (
        <div className="project-campaign-grid">
          {visibleRows.map((row) => {
            const funded = fundingByProjectId.get(row.id);
            const expanded = expandedId === row.id;
            return (
              <article className="project-campaign-card" key={row.id}>
                <div className="project-campaign-heading">
                  <span className="project-campaign-icon">
                    <WorkspaceIcon name="folder" size={22} />
                  </span>
                  <span className={`workflow-badge workflow-badge-${row.status}`}>
                    {row.status}
                  </span>
                </div>
                <h3>{row.title}</h3>
                <p>{row.short_description}</p>
                <div className="project-campaign-progress">
                  <div>
                    <strong>{formatCurrency(funded?.funded_amount_cents ?? 0)}</strong>
                    <span>of {formatCurrency(row.funding_goal_cents)}</span>
                  </div>
                  <progress
                    max={100}
                    value={Math.max(0, Math.min(100, funded?.percent_funded ?? 0))}
                    aria-label={`Funding progress for ${row.title}`}
                  />
                  <p>
                    {(funded?.percent_funded ?? 0).toFixed(1)}% funded ·{" "}
                    {row.is_public ? "Public" : "Private"}
                    {row.featured ? " · Featured" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="workflow-button"
                  aria-expanded={expanded}
                  aria-controls={`project-editor-${row.id}`}
                  onClick={() => setExpandedId(expanded ? "" : row.id)}
                >
                  {expanded ? "Close project details" : "Manage project"}
                  <WorkspaceIcon name="arrow" size={16} />
                </button>
                {expanded ? (
                  <div id={`project-editor-${row.id}`} className="project-campaign-editor">
                    <label className="workflow-field">
                      Project title
                      <input
                        value={row.title}
                        onChange={(event) => updateDraft(row.id, "title", event.target.value)}
                      />
                    </label>
                    <label className="workflow-field">
                      Short description
                      <input
                        value={row.short_description}
                        onChange={(event) =>
                          updateDraft(row.id, "short_description", event.target.value)
                        }
                      />
                    </label>
                    <label className="workflow-field">
                      Full project story
                      <textarea
                        value={row.full_description}
                        onChange={(event) =>
                          updateDraft(row.id, "full_description", event.target.value)
                        }
                        rows={4}
                      />
                    </label>
                    <label className="workflow-field">
                      Cover image URL
                      <input
                        value={row.cover_image_url ?? ""}
                        onChange={(event) =>
                          updateDraft(row.id, "cover_image_url", event.target.value || null)
                        }
                        type="url"
                      />
                    </label>
                    <div className="workflow-form-grid">
                      <label className="workflow-field">
                        Funding goal (USD)
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={goalInputs[row.id] ?? String(row.funding_goal_cents / 100)}
                          inputMode="decimal"
                          onChange={(event) => {
                            const value = event.target.value;
                            setGoalInputs((current) => ({ ...current, [row.id]: value }));
                            updateDraft(
                              row.id,
                              "funding_goal_cents",
                              parseDollarAmount(value) ?? 0,
                            );
                          }}
                        />
                      </label>
                      <label className="workflow-field">
                        Project stage
                        <select
                          value={row.status}
                          onChange={(event) =>
                            updateDraft(row.id, "status", event.target.value as ProjectStatus)
                          }
                        >
                          {["planned", "active", "funded", "completed", "archived"].map(
                            (status) => (
                              <option value={status} key={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    </div>
                    <div className="workflow-actions">
                      <label className="workflow-checkbox">
                        <input
                          type="checkbox"
                          checked={row.featured}
                          onChange={(event) =>
                            updateDraft(row.id, "featured", event.target.checked)
                          }
                        />
                        <span>Featured campaign</span>
                      </label>
                      <label className="workflow-checkbox">
                        <input
                          type="checkbox"
                          checked={row.is_public}
                          onChange={(event) =>
                            updateDraft(row.id, "is_public", event.target.checked)
                          }
                        />
                        <span>Publicly visible</span>
                      </label>
                    </div>
                    <p className="workflow-helper">Public page: /projects/{row.slug}</p>
                    <button
                      type="button"
                      className="workflow-button workflow-button-primary"
                      disabled={savingById[row.id] || !drafts[row.id]}
                      onClick={() => void saveProject(row.id)}
                    >
                      {savingById[row.id] ? "Saving…" : "Save project changes"}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
