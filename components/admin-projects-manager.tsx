"use client";

import { useEffect, useMemo, useState } from "react";

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
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    amountCents / 100,
  );

export function AdminProjectsManager() {
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
  const [newGoal, setNewGoal] = useState("100000");
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
        setProjects((current) => current.map((row) => (row.id === id ? payload.project as ProjectRow : row)));
      }

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
          fundingGoalCents: Number(newGoal),
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

      setNewTitle("");
      setNewShortDescription("");
      setNewFullDescription("");
      setNewCoverImageUrl("");
      setNewGoal("100000");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create project.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">Projects</h2>
        <p className="text-sm text-slate-700">Manage project campaigns and publish status.</p>
      </header>

      <form className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-5" onSubmit={createProject}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Title"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          required
        />
        <input
          value={newGoal}
          onChange={(event) => setNewGoal(event.target.value)}
          type="number"
          min={1}
          placeholder="Goal cents"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          required
        />
        <input
          value={newShortDescription}
          onChange={(event) => setNewShortDescription(event.target.value)}
          placeholder="Short description"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          required
        />
        <input
          value={newCoverImageUrl}
          onChange={(event) => setNewCoverImageUrl(event.target.value)}
          placeholder="Image URL"
          type="url"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {creating ? "Creating..." : "Create"}
        </button>
        <textarea
          value={newFullDescription}
          onChange={(event) => setNewFullDescription(event.target.value)}
          placeholder="Full description"
          className="md:col-span-5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          rows={3}
          required
        />
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading projects...</p> : null}

      {!loading ? (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">Title</th>
                <th className="px-3 py-2 font-semibold">Short Description</th>
                <th className="px-3 py-2 font-semibold">Full Description</th>
                <th className="px-3 py-2 font-semibold">Image URL</th>
                <th className="px-3 py-2 font-semibold">Goal</th>
                <th className="px-3 py-2 font-semibold">Funded</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Flags</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const fundingRow = fundingByProjectId.get(row.id);
                return (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <input
                        value={row.title}
                        onChange={(event) => updateDraft(row.id, "title", event.target.value)}
                        className="w-52 rounded-md border border-slate-300 px-2 py-1"
                      />
                      <p className="mt-1 text-xs text-slate-500">/{row.slug}</p>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.short_description}
                        onChange={(event) => updateDraft(row.id, "short_description", event.target.value)}
                        className="w-72 rounded-md border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        value={row.full_description}
                        onChange={(event) => updateDraft(row.id, "full_description", event.target.value)}
                        className="w-96 rounded-md border border-slate-300 px-2 py-1"
                        rows={3}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.cover_image_url ?? ""}
                        onChange={(event) => updateDraft(row.id, "cover_image_url", event.target.value || null)}
                        placeholder="https://..."
                        type="url"
                        className="w-72 rounded-md border border-slate-300 px-2 py-1"
                      />
                      {row.cover_image_url ? (
                        <p className="mt-1 truncate text-xs text-slate-500">{row.cover_image_url}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        value={row.funding_goal_cents}
                        onChange={(event) => updateDraft(row.id, "funding_goal_cents", Number(event.target.value))}
                        className="w-32 rounded-md border border-slate-300 px-2 py-1"
                      />
                      <p className="mt-1 text-xs text-slate-500">{formatCurrency(row.funding_goal_cents)}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {formatCurrency(fundingRow?.funded_amount_cents ?? 0)}
                      <p className="text-xs text-slate-500">{(fundingRow?.percent_funded ?? 0).toFixed(1)}%</p>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.status}
                        onChange={(event) => updateDraft(row.id, "status", event.target.value as ProjectStatus)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1"
                      >
                        <option value="planned">Planned</option>
                        <option value="active">Active</option>
                        <option value="funded">Funded</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <label className="flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={row.featured}
                          onChange={(event) => updateDraft(row.id, "featured", event.target.checked)}
                        />
                        Featured
                      </label>
                      <label className="mt-1 flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={row.is_public}
                          onChange={(event) => updateDraft(row.id, "is_public", event.target.checked)}
                        />
                        Public
                      </label>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={savingById[row.id]}
                        onClick={() => void saveProject(row.id)}
                        className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {savingById[row.id] ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
