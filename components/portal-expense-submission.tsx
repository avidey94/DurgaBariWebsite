"use client";

import { useCallback, useEffect, useState } from "react";

interface ProjectOption {
  id: string;
  title: string;
  slug: string;
  status: string;
  is_public: boolean;
}

interface SubmissionRow {
  id: string;
  expense_type: string;
  project_id: string | null;
  vendor_name: string;
  description: string;
  amount_cents: number;
  expense_status: "draft" | "submitted" | "approved" | "paid" | "reimbursed" | "cancelled";
  payment_method: string;
  incurred_at: string;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
}

interface PortalExpensesPayload {
  projects: ProjectOption[];
  submissions: SubmissionRow[];
  message?: string;
}

const expenseTypeOptions = [
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
] as const;

const paymentMethodOptions = [
  { value: "manual", label: "Manual" },
  { value: "ach", label: "ACH" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "zelle", label: "Zelle" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
] as const;

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((amountCents ?? 0) / 100);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const formatDateTimeInput = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const statusBadge = (status: SubmissionRow["expense_status"]) => {
  if (status === "approved") return "bg-blue-100 text-blue-700";
  if (status === "paid" || status === "reimbursed") return "bg-emerald-100 text-emerald-700";
  if (status === "cancelled") return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-700";
};

export function PortalExpenseSubmission() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [projectId, setProjectId] = useState("");
  const [expenseType, setExpenseType] = useState<(typeof expenseTypeOptions)[number]["value"]>("other");
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethodOptions)[number]["value"]>("manual");
  const [vendorName, setVendorName] = useState("");
  const [description, setDescription] = useState("");
  const [amountCents, setAmountCents] = useState("5000");
  const [incurredAt, setIncurredAt] = useState(() => formatDateTimeInput(new Date().toISOString()));
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/portal/expenses", { cache: "no-store" });
      const payload = (await response.json()) as PortalExpensesPayload;

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load expense submission data.");
      }

      const projectsFromApi = payload.projects ?? [];
      setProjects(projectsFromApi);
      setSubmissions(payload.submissions ?? []);
      if (projectsFromApi.length > 0) {
        setProjectId((current) => current || projectsFromApi[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load expense submission data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const submitExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/portal/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          expenseType,
          paymentMethod,
          vendorName,
          description,
          amountCents: Number(amountCents),
          incurredAt: incurredAt ? new Date(incurredAt).toISOString() : new Date().toISOString(),
          receiptUrl: receiptUrl || null,
          notes: notes || null,
        }),
      });

      const payload = (await response.json()) as { submission?: SubmissionRow; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to submit expense.");
      }

      setSuccessMessage("Expense submitted for treasurer approval.");
      setVendorName("");
      setDescription("");
      setAmountCents("5000");
      setReceiptUrl("");
      setNotes("");
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const projectNameById = new Map(projects.map((project) => [project.id, project.title]));

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">Project Expense Submission</h2>
        <p className="mt-1 text-sm text-slate-600">
          Submit project-related expenses. Treasurer or super admin will review and approve in the admin expense queue.
        </p>
      </header>

      <form className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-6" onSubmit={submitExpense}>
        <select
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-2"
          required
        >
          {projects.length === 0 ? <option value="">No active projects available</option> : null}
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>

        <select
          value={expenseType}
          onChange={(event) => setExpenseType(event.target.value as (typeof expenseTypeOptions)[number]["value"])}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          {expenseTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value as (typeof paymentMethodOptions)[number]["value"])}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          {paymentMethodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          value={vendorName}
          onChange={(event) => setVendorName(event.target.value)}
          placeholder="Vendor"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          required
        />

        <input
          value={amountCents}
          onChange={(event) => setAmountCents(event.target.value)}
          type="number"
          min={0}
          placeholder="Amount cents"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          required
        />

        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-3"
          required
        />

        <input
          value={incurredAt}
          onChange={(event) => setIncurredAt(event.target.value)}
          type="datetime-local"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-1"
        />

        <input
          value={receiptUrl}
          onChange={(event) => setReceiptUrl(event.target.value)}
          type="url"
          placeholder="Receipt URL"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-2"
        />

        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:col-span-5"
        />

        <button
          type="submit"
          disabled={submitting || projects.length === 0}
          className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-1"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading submissions...</p> : null}

      {!loading ? (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">Submitted</th>
                <th className="px-3 py-2 font-semibold">Project</th>
                <th className="px-3 py-2 font-semibold">Vendor</th>
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="px-3 py-2 font-semibold">Amount</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{formatDate(row.created_at)}</td>
                  <td className="px-3 py-2 text-slate-700">{row.project_id ? projectNameById.get(row.project_id) ?? row.project_id : "Unlinked"}</td>
                  <td className="px-3 py-2 text-slate-900">{row.vendor_name}</td>
                  <td className="px-3 py-2 text-slate-700">{row.description}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{formatCurrency(row.amount_cents)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(row.expense_status)}`}>
                      {row.expense_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {submissions.length === 0 ? <p className="p-3 text-sm text-slate-600">No submitted expenses yet.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
