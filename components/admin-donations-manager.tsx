"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  WorkspaceEmpty,
  WorkspaceIcon,
  WorkspaceNotice,
} from "@/components/workspace/workspace-ui";

import type { DonationType } from "@/lib/portal/types";

interface DonationRow {
  id: string;
  family_id: string;
  donation_type: DonationType;
  project_id: string | null;
  metadata: Record<string, unknown> | null;
  amount_cents: number;
  occurred_at: string;
  payment_channel: string;
  notes: string | null;
  is_anonymous: boolean;
  visibility: "public" | "members" | "private";
}

interface DonationAuditChange {
  from: unknown;
  to: unknown;
}

interface DonationAuditRow {
  id: string;
  donation_id: string;
  event_type: "create" | "update";
  changed_at: string;
  changed_by_family_id: string | null;
  changed_by_email: string | null;
  changes: Record<string, DonationAuditChange>;
}

interface FamilyOption {
  id: string;
  family_display_name: string;
  primary_email: string;
}

interface ProjectOption {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface ApiPayload {
  donations: DonationRow[];
  families: FamilyOption[];
  projects: ProjectOption[];
  auditsByDonationId?: Record<string, DonationAuditRow[]>;
  message?: string;
}

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);

const centsToDollarInput = (amountCents: number) => {
  const fixed = (amountCents / 100).toFixed(2);
  return fixed.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
};

const dollarsToCents = (value: string): number | null => {
  const normalized = value.replace(/[$,\s]/g, "");
  if (!normalized) return null;

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;

  return Math.round(amount * 100);
};

const formatDateTimeInput = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toIsoFromLocal = (value: string) => {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
};

const formatAuditTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));

const formatAuditValue = (field: string, value: unknown) => {
  if (field === "amount_cents") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return formatCurrency(numeric);
    }
  }

  if (value === null || value === undefined) {
    return "null";
  }

  return String(value);
};

const FOUNDING_MONTH_START_YEAR = 2026;
const FOUNDING_MONTH_END_YEAR = 2028;

const buildFoundingMonthOptions = () => {
  const options: Array<{ value: string; label: string }> = [];

  for (let year = FOUNDING_MONTH_START_YEAR; year <= FOUNDING_MONTH_END_YEAR; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const value = `${year}-${String(month).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value}-01T00:00:00.000Z`));
      options.push({ value, label });
    }
  }

  return options;
};

const isValidFoundingMonth = (value: string) =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value >= "2026-01" && value <= "2028-12";
const isActiveDonorType = (value: DonationType) =>
  value === "active_donor_bronze" ||
  value === "active_donor_silver" ||
  value === "active_donor_gold";

const getFoundingMonthFromMetadata = (metadata: Record<string, unknown> | null | undefined) => {
  const raw = metadata?.founding_month;
  if (typeof raw === "string" && isValidFoundingMonth(raw)) {
    return raw;
  }

  return null;
};

const getActiveDonorMonthFromMetadata = (metadata: Record<string, unknown> | null | undefined) => {
  const raw = metadata?.active_donor_month;
  if (typeof raw === "string" && isValidFoundingMonth(raw)) {
    return raw;
  }

  return null;
};

export function AdminDonationsManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | DonationType>("all");
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, Partial<DonationRow>>>({});
  const [auditsByDonationId, setAuditsByDonationId] = useState<Record<string, DonationAuditRow[]>>(
    {},
  );

  const [newFamilyId, setNewFamilyId] = useState("");
  const [newType, setNewType] = useState<DonationType>("general");
  const [newProjectId, setNewProjectId] = useState("");
  const [newFoundingMonth, setNewFoundingMonth] = useState("2026-01");
  const [newIsAnonymous, setNewIsAnonymous] = useState(false);
  const [newAmountDollars, setNewAmountDollars] = useState("100.00");
  const [newOccurredAt, setNewOccurredAt] = useState(() =>
    formatDateTimeInput(new Date().toISOString()),
  );
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const foundingMonthOptions = useMemo(() => buildFoundingMonthOptions(), []);

  useEffect(() => {
    if (newType !== "project") {
      setNewIsAnonymous(false);
    }
  }, [newType]);

  const loadDonations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = filterType === "all" ? "" : `?type=${filterType}`;
      const response = await fetch(`/api/admin/donations${query}`, { cache: "no-store" });
      const payload = (await response.json()) as ApiPayload;

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load donations.");
      }

      const familiesFromApi = payload.families ?? [];
      setDonations(payload.donations ?? []);
      setFamilies(familiesFromApi);
      setProjects(payload.projects ?? []);
      setAuditsByDonationId(payload.auditsByDonationId ?? {});
      if (familiesFromApi.length > 0) {
        setNewFamilyId((current) => current || familiesFromApi[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load donations.");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    void loadDonations();
  }, [loadDonations]);

  const rows = useMemo(
    () =>
      donations.map((row) => ({
        ...row,
        ...drafts[row.id],
      })),
    [donations, drafts],
  );

  const updateDraft = <K extends keyof DonationRow>(
    id: string,
    field: K,
    value: DonationRow[K],
  ) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  };

  const updateDraftFoundingMonth = (id: string, month: string) => {
    setDrafts((current) => {
      const existingRow = donations.find((row) => row.id === id);
      const baseMetadata =
        (current[id]?.metadata as Record<string, unknown> | undefined) ??
        existingRow?.metadata ??
        {};

      const donationType =
        (current[id]?.donation_type as DonationType | undefined) ?? existingRow?.donation_type;
      const metadata =
        donationType === "founding_pledge"
          ? {
              ...baseMetadata,
              founding_month: month,
              active_donor_month: undefined,
            }
          : {
              ...baseMetadata,
              active_donor_month: month,
              founding_month: undefined,
            };

      return {
        ...current,
        [id]: {
          ...current[id],
          metadata,
        },
      };
    });
  };

  const saveRow = async (id: string) => {
    const draft = drafts[id];
    if (!draft) {
      return;
    }

    setSavingById((current) => ({ ...current, [id]: true }));
    setError(null);

    try {
      const requestBody: Record<string, unknown> = {};
      const existingRow = donations.find((row) => row.id === id);
      const effectiveDonationType = (draft.donation_type ?? existingRow?.donation_type) as
        | DonationType
        | undefined;
      const effectiveFoundingMonth =
        getFoundingMonthFromMetadata(
          (draft.metadata as Record<string, unknown> | undefined) ?? null,
        ) ?? getFoundingMonthFromMetadata(existingRow?.metadata);
      const effectiveActiveDonorMonth =
        getActiveDonorMonthFromMetadata(
          (draft.metadata as Record<string, unknown> | undefined) ?? null,
        ) ?? getActiveDonorMonthFromMetadata(existingRow?.metadata);
      const effectiveIsAnonymous = draft.is_anonymous ?? existingRow?.is_anonymous ?? false;

      if (effectiveDonationType) {
        requestBody.donationType = effectiveDonationType;

        if (effectiveDonationType === "project") {
          requestBody.projectId = draft.project_id ?? existingRow?.project_id ?? null;
          requestBody.isAnonymous = effectiveIsAnonymous;
        } else if (effectiveDonationType === "founding_pledge") {
          requestBody.projectId = null;
          requestBody.foundingMonth = effectiveFoundingMonth ?? "2026-01";
          requestBody.isAnonymous = false;
        } else if (isActiveDonorType(effectiveDonationType)) {
          requestBody.projectId = null;
          requestBody.foundingMonth = effectiveActiveDonorMonth ?? "2026-01";
          requestBody.isAnonymous = false;
        } else {
          requestBody.projectId = null;
          requestBody.foundingMonth = null;
          requestBody.isAnonymous = false;
        }
      } else if (draft.project_id !== undefined) {
        requestBody.projectId = draft.project_id;
      }

      if (draft.amount_cents !== undefined) {
        requestBody.amountCents = draft.amount_cents;
      }

      if (draft.occurred_at !== undefined) {
        requestBody.occurredAt = draft.occurred_at;
      }

      if (draft.notes !== undefined) {
        requestBody.notes = draft.notes;
      }

      if (draft.payment_channel !== undefined) {
        requestBody.paymentChannel = draft.payment_channel;
      }

      if (draft.visibility !== undefined) {
        requestBody.visibility = draft.visibility;
      }

      const response = await fetch(`/api/admin/donations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const payload = (await response.json()) as { donation?: DonationRow; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to save donation.");
      }

      setDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await loadDonations();
      setSuccess("Changes saved. The record’s audit trail has been updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save donation.");
    } finally {
      setSavingById((current) => ({ ...current, [id]: false }));
    }
  };

  const createDonation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const parsedAmountCents = dollarsToCents(newAmountDollars);
      if (parsedAmountCents === null) {
        throw new Error("Amount must be a valid dollar amount (e.g. 200 or 200.58).");
      }

      const response = await fetch("/api/admin/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: newFamilyId,
          donationType: newType,
          projectId: newType === "project" ? newProjectId : null,
          foundingMonth:
            newType === "founding_pledge" || isActiveDonorType(newType) ? newFoundingMonth : null,
          amountCents: parsedAmountCents,
          occurredAt: toIsoFromLocal(newOccurredAt),
          notes: newNotes,
          paymentChannel: "manual",
          visibility: "public",
          isAnonymous: newType === "project" ? newIsAnonymous : false,
        }),
      });

      const payload = (await response.json()) as { donation?: DonationRow; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to create donation.");
      }

      if (payload.donation) {
        setShowCreateForm(false);
        setSuccess("Donation recorded. Its change history will stay with this entry.");
        await loadDonations();
      }
      setNewIsAnonymous(false);
      setNewAmountDollars("100.00");
      setNewNotes("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create donation.");
    } finally {
      setCreating(false);
    }
  };

  const familyNameById = useMemo(
    () =>
      new Map(
        families.map((family) => [
          family.id,
          `${family.family_display_name} (${family.primary_email})`,
        ]),
      ),
    [families],
  );

  const visibleRows = rows.filter((row) =>
    `${familyNameById.get(row.family_id) ?? ""} ${row.notes ?? ""} ${row.donation_type}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <section className="admin-workflow">
      <div className="workflow-context">
        <div className="workflow-context-icon">
          <WorkspaceIcon name="heart" size={22} />
        </div>
        <div>
          <p className="workflow-eyebrow">Community generosity</p>
          <h2>Every gift, accounted for</h2>
          <p>
            Record and reconcile family giving, keep campaign allocations clear and retain a
            complete change history.
          </p>
        </div>
        <button
          type="button"
          className="workflow-button workflow-button-primary"
          aria-expanded={showCreateForm}
          aria-controls="create-donations-form"
          onClick={() => setShowCreateForm((value) => !value)}
        >
          <WorkspaceIcon name={showCreateForm ? "close" : "plus"} size={17} />
          {showCreateForm ? "Close form" : "Record a donation"}
        </button>
      </div>
      <div className="workflow-stats">
        <div>
          <span>
            {loading
              ? "—"
              : formatCurrency(
                  donations.reduce((total, donation) => total + donation.amount_cents, 0),
                )}
          </span>
          <p>Giving in this category</p>
        </div>
        <div>
          <span>{loading ? "—" : donations.length}</span>
          <p>Recorded gifts</p>
        </div>
        <div>
          <span>
            {loading ? "—" : new Set(donations.map((donation) => donation.family_id)).size}
          </span>
          <p>Giving families</p>
        </div>
      </div>
      {showCreateForm ? (
        <form
          id="create-donations-form"
          className="workflow-create-panel"
          onSubmit={createDonation}
        >
          <div>
            <p className="workflow-eyebrow">New ledger entry</p>
            <h3>Record a donation</h3>
            <p className="workflow-helper">
              Confirm the family, giving category and amount against the source transaction.
            </p>
          </div>
          <div className="workflow-form-grid">
            <label className="workflow-field">
              Family account
              <select
                value={newFamilyId}
                onChange={(event) => setNewFamilyId(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
              >
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.family_display_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="workflow-field">
              Giving category
              <select
                value={newType}
                onChange={(event) => setNewType(event.target.value as DonationType)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
              >
                <option value="founding_pledge">Founding pledge</option>
                <option value="active_donor_bronze">Active donor - bronze</option>
                <option value="active_donor_silver">Active donor - silver</option>
                <option value="active_donor_gold">Active donor - gold</option>
                <option value="project">Project</option>
                <option value="general">General</option>
              </select>
            </label>
            {newType === "project" ? (
              <label className="workflow-field">
                Linked project
                <select
                  value={newProjectId}
                  onChange={(event) => setNewProjectId(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                >
                  <option value="">Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : newType === "founding_pledge" || isActiveDonorType(newType) ? (
              <label className="workflow-field">
                Giving month
                <select
                  value={newFoundingMonth}
                  onChange={(event) => setNewFoundingMonth(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                >
                  {foundingMonthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="workflow-helper">This gift supports general temple needs.</p>
            )}
            <label
              className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm ${
                newType === "project"
                  ? "border-slate-300 bg-white text-slate-800"
                  : "border-slate-200 bg-slate-100 text-slate-500"
              }`}
            >
              <input
                type="checkbox"
                checked={newIsAnonymous}
                onChange={(event) => setNewIsAnonymous(event.target.checked)}
                disabled={newType !== "project"}
              />
              Anonymous
            </label>
            <label className="workflow-field">
              Amount (USD)
              <input
                value={newAmountDollars}
                onChange={(event) => setNewAmountDollars(event.target.value)}
                type="number"
                min={0}
                step="0.01"
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                placeholder="Amount ($)"
              />
            </label>
            <label className="workflow-field">
              Received on
              <input
                value={newOccurredAt}
                onChange={(event) => setNewOccurredAt(event.target.value)}
                type="datetime-local"
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {creating ? "Recording…" : "Record donation"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="workflow-toolbar">
        <label className="workflow-search">
          <WorkspaceIcon name="search" size={17} />
          <input
            aria-label="Search donations"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a family or giving note"
          />
        </label>
        <label className="workflow-filter">
          Giving category
          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value as "all" | DonationType)}
          >
            <option value="all">All giving</option>
            <option value="founding_pledge">Founding pledge</option>
            <option value="active_donor_bronze">Active donor · Bronze</option>
            <option value="active_donor_silver">Active donor · Silver</option>
            <option value="active_donor_gold">Active donor · Gold</option>
            <option value="project">Project gifts</option>
            <option value="general">General giving</option>
          </select>
        </label>
      </div>
      {error ? (
        <WorkspaceNotice tone="error">
          {error}{" "}
          <button type="button" onClick={() => void loadDonations()}>
            Try again
          </button>
        </WorkspaceNotice>
      ) : null}
      {success ? <WorkspaceNotice tone="success">{success}</WorkspaceNotice> : null}
      {loading ? (
        <div className="workflow-loading" role="status">
          <span className="workflow-loading-dot" /> Gathering donations…
        </div>
      ) : null}

      {!loading && !error && !visibleRows.length ? (
        <WorkspaceEmpty
          icon="heart"
          eyebrow="Donation ledger"
          title={
            search.trim() || filterType !== "all"
              ? "No records match this view"
              : "A lasting record of generosity"
          }
          description={
            search.trim() || filterType !== "all"
              ? "Try another search or clear the filters to return to the full ledger."
              : "Record the first family gift to begin a trusted history of giving. Each entry keeps its category, amount, allocation and audit history together."
          }
          action={
            search.trim() || filterType !== "all" ? (
              <button
                type="button"
                className="workflow-button"
                onClick={() => {
                  setSearch("");
                  setFilterType("all");
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
                Record the first donation
              </button>
            )
          }
        />
      ) : null}
      {!loading ? (
        <div className="workflow-records">
          {visibleRows.map((row) => (
            <details key={row.id} className="workflow-record">
              <summary className="workflow-record-summary">
                <span className="workflow-record-symbol">
                  <WorkspaceIcon name="heart" size={18} />
                </span>
                <span className="workflow-record-main">
                  <strong>{familyNameById.get(row.family_id) ?? "Family donation"}</strong>
                  <span>
                    {row.donation_type.replaceAll("_", " ")} ·{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeZone: "America/Los_Angeles",
                    }).format(new Date(row.occurred_at))}
                  </span>
                </span>
                <strong className="workflow-record-amount">
                  {formatCurrency(row.amount_cents)}
                </strong>
                <WorkspaceIcon name="chevron" size={17} />
              </summary>
              <div className="workflow-record-editor">
                <div className="workflow-record-field">
                  <span className="workflow-field-label">Family</span>
                  {familyNameById.get(row.family_id) ?? row.family_id}
                </div>
                <div className="workflow-record-field">
                  <span className="workflow-field-label">Type</span>
                  <select
                    aria-label="Type"
                    value={row.donation_type}
                    onChange={(event) =>
                      updateDraft(row.id, "donation_type", event.target.value as DonationType)
                    }
                    className="rounded-md border border-slate-300 bg-white px-2 py-1"
                  >
                    <option value="founding_pledge">Founding pledge</option>
                    <option value="active_donor_bronze">Active donor - bronze</option>
                    <option value="active_donor_silver">Active donor - silver</option>
                    <option value="active_donor_gold">Active donor - gold</option>
                    <option value="project">Project</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div className="workflow-record-field">
                  <span className="workflow-field-label">Allocation or giving month</span>
                  {row.donation_type === "project" ? (
                    <select
                      aria-label="Subtype"
                      value={row.project_id ?? ""}
                      onChange={(event) =>
                        updateDraft(row.id, "project_id", event.target.value || null)
                      }
                      className="rounded-md border border-slate-300 bg-white px-2 py-1"
                    >
                      <option value="">Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  ) : row.donation_type === "founding_pledge" ||
                    isActiveDonorType(row.donation_type) ? (
                    <select
                      aria-label="Subtype"
                      value={
                        row.donation_type === "founding_pledge"
                          ? (getFoundingMonthFromMetadata(row.metadata) ?? "2026-01")
                          : (getActiveDonorMonthFromMetadata(row.metadata) ?? "2026-01")
                      }
                      onChange={(event) => updateDraftFoundingMonth(row.id, event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1"
                    >
                      {foundingMonthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      aria-label="Subtype"
                      disabled
                      className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-slate-500"
                    >
                      <option value="">N/A</option>
                    </select>
                  )}
                </div>
                <div className="workflow-record-field">
                  <span className="workflow-field-label">Public donor recognition</span>
                  <label
                    className={`flex items-center gap-2 text-sm ${
                      row.donation_type === "project" ? "text-slate-700" : "text-slate-500"
                    }`}
                  >
                    <input
                      aria-label="Anonymous (Public)"
                      type="checkbox"
                      checked={Boolean(row.is_anonymous)}
                      disabled={row.donation_type !== "project"}
                      onChange={(event) =>
                        updateDraft(row.id, "is_anonymous", event.target.checked)
                      }
                    />
                    Anonymous
                  </label>
                </div>
                <div className="workflow-record-field">
                  <span className="workflow-field-label">Amount</span>
                  <input
                    aria-label="Amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={centsToDollarInput(row.amount_cents)}
                    onChange={(event) => {
                      const cents = dollarsToCents(event.target.value);
                      if (cents !== null) {
                        updateDraft(row.id, "amount_cents", cents);
                      } else if (event.target.value === "") {
                        updateDraft(row.id, "amount_cents", 0);
                      }
                    }}
                    className="w-32 rounded-md border border-slate-300 px-2 py-1"
                  />
                  <p className="mt-1 text-xs text-slate-500">{formatCurrency(row.amount_cents)}</p>
                </div>
                <div className="workflow-record-field">
                  <span className="workflow-field-label">Received on</span>
                  <input
                    aria-label="Occurred"
                    type="datetime-local"
                    value={formatDateTimeInput(row.occurred_at)}
                    onChange={(event) =>
                      updateDraft(row.id, "occurred_at", toIsoFromLocal(event.target.value))
                    }
                    className="rounded-md border border-slate-300 px-2 py-1"
                  />
                </div>
                <div className="workflow-record-field">
                  <span className="workflow-field-label">Notes</span>
                  <input
                    aria-label="Notes"
                    value={row.notes ?? ""}
                    onChange={(event) => updateDraft(row.id, "notes", event.target.value)}
                    className="w-56 rounded-md border border-slate-300 px-2 py-1"
                  />
                </div>
                <div className="workflow-record-audit">
                  <span className="workflow-field-label">Change history</span>
                  {auditsByDonationId[row.id]?.length ? (
                    <details>
                      <summary className="cursor-pointer select-none font-medium text-slate-900">
                        {auditsByDonationId[row.id][0].changed_by_email ?? "Unknown user"} at{" "}
                        {formatAuditTimestamp(auditsByDonationId[row.id][0].changed_at)}
                      </summary>
                      <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-2">
                        {auditsByDonationId[row.id].map((audit) => (
                          <article
                            key={audit.id}
                            className="rounded border border-slate-200 bg-white p-2"
                          >
                            <p className="font-medium text-slate-900">
                              {audit.event_type === "create" ? "Created" : "Updated"} by{" "}
                              {audit.changed_by_email ?? "Unknown user"}
                            </p>
                            <p className="text-slate-600">
                              {formatAuditTimestamp(audit.changed_at)}
                            </p>
                            <ul className="mt-1 space-y-1 text-slate-700">
                              {Object.entries(audit.changes ?? {}).map(([field, change]) => (
                                <li key={`${audit.id}-${field}`}>
                                  {field}: {formatAuditValue(field, change.from)} →{" "}
                                  {formatAuditValue(field, change.to)}
                                </li>
                              ))}
                            </ul>
                          </article>
                        ))}
                      </div>
                    </details>
                  ) : (
                    <span className="text-slate-500">No audit entries</span>
                  )}
                </div>
                <div className="workflow-record-save">
                  <button
                    type="button"
                    disabled={savingById[row.id]}
                    onClick={() => void saveRow(row.id)}
                    className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {savingById[row.id] ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );
}
