"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface ExpenseRow {
  id: string;
  expense_type:
    | "operations"
    | "event"
    | "maintenance"
    | "utilities"
    | "supplies"
    | "marketing"
    | "professional_services"
    | "insurance"
    | "technology"
    | "other";
  project_id: string | null;
  vendor_name: string;
  description: string;
  amount_cents: number;
  expense_status: "draft" | "submitted" | "approved" | "paid" | "reimbursed" | "cancelled";
  payment_method: "manual" | "ach" | "check" | "cash" | "card" | "zelle" | "bank_transfer" | "other";
  incurred_at: string;
  due_at: string | null;
  paid_at: string | null;
  receipt_url: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  recorded_by_family_id: string | null;
}

interface ProjectOption {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface FamilyOption {
  id: string;
  family_display_name: string;
  primary_email: string;
}

interface ExpenseAuditChange {
  from: unknown;
  to: unknown;
}

interface ExpenseAuditRow {
  id: string;
  expense_id: string;
  event_type: "create" | "update";
  changed_at: string;
  changed_by_family_id: string | null;
  changed_by_email: string | null;
  changes: Record<string, ExpenseAuditChange>;
}

interface SummaryPayload {
  totalAmountCents: number;
  openAmountCents: number;
  thisMonthAmountCents: number;
  thisYearAmountCents: number;
  byStatus: Record<string, number>;
  count: number;
}

interface ExpensesPayload {
  expenses: ExpenseRow[];
  projects: ProjectOption[];
  families: FamilyOption[];
  auditsByExpenseId?: Record<string, ExpenseAuditRow[]>;
  summary?: SummaryPayload;
  message?: string;
}

const expenseTypeOptions: Array<{ value: ExpenseRow["expense_type"]; label: string }> = [
  { value: "operations", label: "Operations" },
  { value: "event", label: "Event" },
  { value: "maintenance", label: "Maintenance" },
  { value: "utilities", label: "Utilities" },
  { value: "supplies", label: "Supplies" },
  { value: "marketing", label: "Marketing" },
  { value: "professional_services", label: "Professional Services" },
  { value: "insurance", label: "Insurance" },
  { value: "technology", label: "Technology" },
  { value: "other", label: "Other" },
];

const expenseStatusOptions: Array<{ value: ExpenseRow["expense_status"]; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "reimbursed", label: "Reimbursed" },
  { value: "cancelled", label: "Cancelled" },
];

const paymentMethodOptions: Array<{ value: ExpenseRow["payment_method"]; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "ach", label: "ACH" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "zelle", label: "Zelle" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((amountCents ?? 0) / 100);

const formatDateTimeInput = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toIsoFromLocal = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const formatAuditTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const getStatusBadgeClass = (status: ExpenseRow["expense_status"]) => {
  if (status === "paid" || status === "reimbursed") return "bg-emerald-100 text-emerald-700";
  if (status === "approved") return "bg-blue-100 text-blue-700";
  if (status === "cancelled") return "bg-slate-200 text-slate-700";
  if (status === "draft") return "bg-amber-100 text-amber-700";
  return "bg-purple-100 text-purple-700";
};

export function AdminExpensesManager() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [auditsByExpenseId, setAuditsByExpenseId] = useState<Record<string, ExpenseAuditRow[]>>({});
  const [drafts, setDrafts] = useState<Record<string, Partial<ExpenseRow>>>({});
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<"all" | ExpenseRow["expense_type"]>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | ExpenseRow["expense_status"]>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [newType, setNewType] = useState<ExpenseRow["expense_type"]>("operations");
  const [newStatus, setNewStatus] = useState<ExpenseRow["expense_status"]>("submitted");
  const [newPaymentMethod, setNewPaymentMethod] = useState<ExpenseRow["payment_method"]>("manual");
  const [newProjectId, setNewProjectId] = useState("");
  const [newVendorName, setNewVendorName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAmountCents, setNewAmountCents] = useState("5000");
  const [newIncurredAt, setNewIncurredAt] = useState(() => formatDateTimeInput(new Date().toISOString()));
  const [newDueAt, setNewDueAt] = useState("");
  const [newPaidAt, setNewPaidAt] = useState("");
  const [newReceiptUrl, setNewReceiptUrl] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterType !== "all") {
        params.set("type", filterType);
      }
      if (filterStatus !== "all") {
        params.set("status", filterStatus);
      }
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }

      const queryString = params.toString();
      const response = await fetch(`/api/admin/expenses${queryString ? `?${queryString}` : ""}`, { cache: "no-store" });
      const payload = (await response.json()) as ExpensesPayload;

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load expenses.");
      }

      const projectsFromApi = payload.projects ?? [];
      setExpenses(payload.expenses ?? []);
      setProjects(projectsFromApi);
      setFamilies(payload.families ?? []);
      setAuditsByExpenseId(payload.auditsByExpenseId ?? {});
      setSummary(payload.summary ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load expenses.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, searchQuery]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const rows = useMemo(
    () =>
      expenses.map((row) => ({
        ...row,
        ...drafts[row.id],
      })),
    [expenses, drafts],
  );

  const familyNameById = useMemo(
    () => new Map(families.map((family) => [family.id, `${family.family_display_name} (${family.primary_email})`])),
    [families],
  );

  const projectNameById = useMemo(() => new Map(projects.map((project) => [project.id, project.title])), [projects]);

  const updateDraft = <K extends keyof ExpenseRow>(id: string, field: K, value: ExpenseRow[K]) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  };

  const saveExpense = async (id: string) => {
    const draft = drafts[id];

    if (!draft) {
      return;
    }

    setSavingById((current) => ({ ...current, [id]: true }));
    setError(null);

    try {
      const requestBody: Record<string, unknown> = {};

      if (draft.expense_type !== undefined) requestBody.expenseType = draft.expense_type;
      if (draft.project_id !== undefined) requestBody.projectId = draft.project_id;
      if (draft.vendor_name !== undefined) requestBody.vendorName = draft.vendor_name;
      if (draft.description !== undefined) requestBody.description = draft.description;
      if (draft.amount_cents !== undefined) requestBody.amountCents = draft.amount_cents;
      if (draft.expense_status !== undefined) requestBody.expenseStatus = draft.expense_status;
      if (draft.payment_method !== undefined) requestBody.paymentMethod = draft.payment_method;
      if (draft.incurred_at !== undefined) requestBody.incurredAt = draft.incurred_at;
      if (draft.due_at !== undefined) requestBody.dueAt = draft.due_at;
      if (draft.paid_at !== undefined) requestBody.paidAt = draft.paid_at;
      if (draft.receipt_url !== undefined) requestBody.receiptUrl = draft.receipt_url;
      if (draft.notes !== undefined) requestBody.notes = draft.notes;

      const response = await fetch(`/api/admin/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const payload = (await response.json()) as { expense?: ExpenseRow; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to save expense.");
      }

      setDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      await loadExpenses();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save expense.");
    } finally {
      setSavingById((current) => ({ ...current, [id]: false }));
    }
  };

  const createExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseType: newType,
          expenseStatus: newStatus,
          paymentMethod: newPaymentMethod,
          projectId: newProjectId || null,
          vendorName: newVendorName,
          description: newDescription,
          amountCents: Number(newAmountCents),
          incurredAt: toIsoFromLocal(newIncurredAt),
          dueAt: toIsoFromLocal(newDueAt),
          paidAt: toIsoFromLocal(newPaidAt),
          receiptUrl: newReceiptUrl || null,
          notes: newNotes || null,
        }),
      });

      const payload = (await response.json()) as { expense?: ExpenseRow; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to create expense.");
      }

      setNewVendorName("");
      setNewDescription("");
      setNewAmountCents("5000");
      setNewDueAt("");
      setNewPaidAt("");
      setNewReceiptUrl("");
      setNewNotes("");

      await loadExpenses();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create expense.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">Expense Ledger</h2>
        <p className="text-sm text-slate-700">Track operating costs, approvals, and reimbursements with an audit trail.</p>
      </header>

      {summary ? (
        <div className="grid gap-2 md:grid-cols-4">
          <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Tracked</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(summary.totalAmountCents)}</p>
            <p className="text-xs text-slate-600">{summary.count} entries</p>
          </article>
          <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Open Liability</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(summary.openAmountCents)}</p>
            <p className="text-xs text-slate-600">Submitted + approved</p>
          </article>
          <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">This Month</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(summary.thisMonthAmountCents)}</p>
          </article>
          <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">This Year</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(summary.thisYearAmountCents)}</p>
          </article>
        </div>
      ) : null}

      <form className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-12" onSubmit={createExpense}>
        <select
          value={newType}
          onChange={(event) => setNewType(event.target.value as ExpenseRow["expense_type"])}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-2"
        >
          {expenseTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={newStatus}
          onChange={(event) => setNewStatus(event.target.value as ExpenseRow["expense_status"])}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-2"
        >
          {expenseStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={newPaymentMethod}
          onChange={(event) => setNewPaymentMethod(event.target.value as ExpenseRow["payment_method"])}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-2"
        >
          {paymentMethodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          value={newVendorName}
          onChange={(event) => setNewVendorName(event.target.value)}
          placeholder="Vendor"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-3"
          required
        />

        <input
          value={newAmountCents}
          onChange={(event) => setNewAmountCents(event.target.value)}
          type="number"
          min={0}
          placeholder="Amount cents"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-2"
          required
        />

        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 md:col-span-1"
        >
          {creating ? "Adding..." : "Add"}
        </button>

        <input
          value={newDescription}
          onChange={(event) => setNewDescription(event.target.value)}
          placeholder="Description"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-5"
          required
        />

        <select
          value={newProjectId}
          onChange={(event) => setNewProjectId(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-3"
        >
          <option value="">No linked project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>

        <input
          value={newIncurredAt}
          onChange={(event) => setNewIncurredAt(event.target.value)}
          type="datetime-local"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-2"
        />

        <input
          value={newDueAt}
          onChange={(event) => setNewDueAt(event.target.value)}
          type="datetime-local"
          placeholder="Due at"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-2"
        />

        <input
          value={newPaidAt}
          onChange={(event) => setNewPaidAt(event.target.value)}
          type="datetime-local"
          placeholder="Paid at"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-2"
        />

        <input
          value={newReceiptUrl}
          onChange={(event) => setNewReceiptUrl(event.target.value)}
          type="url"
          placeholder="Receipt URL"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-6"
        />

        <input
          value={newNotes}
          onChange={(event) => setNewNotes(event.target.value)}
          placeholder="Notes"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-6"
        />
      </form>

      <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search vendor, description, notes"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        />
        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value as "all" | ExpenseRow["expense_type"])}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="all">All types</option>
          {expenseTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value as "all" | ExpenseRow["expense_status"])}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="all">All statuses</option>
          {expenseStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading expenses...</p> : null}

      {!loading ? (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-[1400px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Vendor</th>
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="px-3 py-2 font-semibold">Project</th>
                <th className="px-3 py-2 font-semibold">Amount</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Payment</th>
                <th className="px-3 py-2 font-semibold">Dates</th>
                <th className="px-3 py-2 font-semibold">Receipt / Notes</th>
                <th className="px-3 py-2 font-semibold">Audit</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const auditEvents = auditsByExpenseId[row.id] ?? [];

                return (
                  <tr key={row.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2">
                      <select
                        value={row.expense_type}
                        onChange={(event) => updateDraft(row.id, "expense_type", event.target.value as ExpenseRow["expense_type"])}
                        className="w-44 rounded-md border border-slate-300 bg-white px-2 py-1"
                      >
                        {expenseTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-2">
                      <input
                        value={row.vendor_name}
                        onChange={(event) => updateDraft(row.id, "vendor_name", event.target.value)}
                        className="w-56 rounded-md border border-slate-300 px-2 py-1"
                      />
                      <p className="mt-1 text-xs text-slate-500">Recorded by: {row.recorded_by_family_id ? familyNameById.get(row.recorded_by_family_id) ?? row.recorded_by_family_id : "Unknown"}</p>
                    </td>

                    <td className="px-3 py-2">
                      <textarea
                        value={row.description}
                        onChange={(event) => updateDraft(row.id, "description", event.target.value)}
                        className="w-64 rounded-md border border-slate-300 px-2 py-1"
                        rows={2}
                      />
                    </td>

                    <td className="px-3 py-2">
                      <select
                        value={row.project_id ?? ""}
                        onChange={(event) => updateDraft(row.id, "project_id", event.target.value || null)}
                        className="w-52 rounded-md border border-slate-300 bg-white px-2 py-1"
                      >
                        <option value="">No linked project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.title}
                          </option>
                        ))}
                      </select>
                      {row.project_id ? <p className="mt-1 text-xs text-slate-500">{projectNameById.get(row.project_id) ?? row.project_id}</p> : null}
                    </td>

                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={row.amount_cents}
                        onChange={(event) => updateDraft(row.id, "amount_cents", Number(event.target.value))}
                        className="w-32 rounded-md border border-slate-300 px-2 py-1"
                      />
                      <p className="mt-1 text-xs text-slate-500">{formatCurrency(row.amount_cents)}</p>
                    </td>

                    <td className="px-3 py-2">
                      <select
                        value={row.expense_status}
                        onChange={(event) => updateDraft(row.id, "expense_status", event.target.value as ExpenseRow["expense_status"])}
                        className="w-36 rounded-md border border-slate-300 bg-white px-2 py-1"
                      >
                        {expenseStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(row.expense_status)}`}>
                        {row.expense_status}
                      </p>
                    </td>

                    <td className="px-3 py-2">
                      <select
                        value={row.payment_method}
                        onChange={(event) => updateDraft(row.id, "payment_method", event.target.value as ExpenseRow["payment_method"])}
                        className="w-36 rounded-md border border-slate-300 bg-white px-2 py-1"
                      >
                        {paymentMethodOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <label className="block text-xs text-slate-600">
                          Incurred
                          <input
                            value={formatDateTimeInput(row.incurred_at)}
                            onChange={(event) => {
                              const iso = toIsoFromLocal(event.target.value);
                              if (iso) updateDraft(row.id, "incurred_at", iso);
                            }}
                            type="datetime-local"
                            className="mt-1 block w-48 rounded-md border border-slate-300 px-2 py-1"
                          />
                        </label>
                        <label className="block text-xs text-slate-600">
                          Due
                          <input
                            value={formatDateTimeInput(row.due_at)}
                            onChange={(event) => updateDraft(row.id, "due_at", toIsoFromLocal(event.target.value))}
                            type="datetime-local"
                            className="mt-1 block w-48 rounded-md border border-slate-300 px-2 py-1"
                          />
                        </label>
                        <label className="block text-xs text-slate-600">
                          Paid
                          <input
                            value={formatDateTimeInput(row.paid_at)}
                            onChange={(event) => updateDraft(row.id, "paid_at", toIsoFromLocal(event.target.value))}
                            type="datetime-local"
                            className="mt-1 block w-48 rounded-md border border-slate-300 px-2 py-1"
                          />
                        </label>
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <input
                        value={row.receipt_url ?? ""}
                        onChange={(event) => updateDraft(row.id, "receipt_url", event.target.value || null)}
                        placeholder="https://receipt"
                        className="w-56 rounded-md border border-slate-300 px-2 py-1"
                      />
                      <textarea
                        value={row.notes ?? ""}
                        onChange={(event) => updateDraft(row.id, "notes", event.target.value || null)}
                        placeholder="Notes"
                        className="mt-2 w-56 rounded-md border border-slate-300 px-2 py-1"
                        rows={2}
                      />
                    </td>

                    <td className="px-3 py-2">
                      {auditEvents.length === 0 ? (
                        <p className="text-xs text-slate-500">No audit events yet</p>
                      ) : (
                        <div className="space-y-1">
                          {auditEvents.slice(0, 2).map((event) => (
                            <div key={event.id} className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                              <p>
                                <span className="font-semibold">{event.event_type}</span> by {event.changed_by_email ?? "unknown"}
                              </p>
                              <p className="text-slate-500">{formatAuditTimestamp(event.changed_at)}</p>
                              <p className="text-slate-500">{Object.keys(event.changes ?? {}).length} field changes</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={savingById[row.id] || !drafts[row.id]}
                        onClick={() => void saveExpense(row.id)}
                        className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
