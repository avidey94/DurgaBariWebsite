"use client";

import { useCallback, useEffect, useState } from "react";

import {
  MemberEmptyState,
  MemberIcon,
  MemberLoading,
  PortalArrow,
} from "@/components/portal-member-page";

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
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (amountCents ?? 0) / 100,
  );

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );

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

export function PortalExpenseSubmission({ elevated = false }: { elevated?: boolean }) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [projectId, setProjectId] = useState("");
  const [expenseType, setExpenseType] = useState<(typeof expenseTypeOptions)[number]["value"] | "">(
    elevated ? "" : "other",
  );
  const [paymentMethod, setPaymentMethod] = useState<
    (typeof paymentMethodOptions)[number]["value"] | ""
  >(elevated ? "" : "manual");
  const [vendorName, setVendorName] = useState("");
  const [description, setDescription] = useState("");
  const [amountCents, setAmountCents] = useState("5000");
  const [amountDollars, setAmountDollars] = useState("");
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
      if (!elevated && projectsFromApi.length > 0) {
        setProjectId((current) => current || projectsFromApi[0].id);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load expense submission data.",
      );
    } finally {
      setLoading(false);
    }
  }, [elevated]);

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
          amountCents: elevated ? Math.round(Number(amountDollars) * 100) : Number(amountCents),
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
      setAmountDollars("");
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

  if (elevated) {
    return (
      <>
        <div className="member-workflow-note">
          <MemberIcon name="receipt" />
          <div>
            <strong>A simple path to reimbursement</strong>
            <p>
              Share the purchase and receipt. The treasurer reviews your request, then records its
              approval and payment here.
            </p>
          </div>
        </div>
        {error ? (
          <div className="member-feedback is-error" role="alert">
            <p>{error}</p>
            {!submitting ? (
              <button type="button" className="member-text-action" onClick={() => void loadData()}>
                Refresh expense data
              </button>
            ) : null}
          </div>
        ) : null}
        {successMessage ? (
          <p className="member-feedback is-success" role="status">
            {successMessage} Follow its status in your submissions below.
          </p>
        ) : null}
        <section className="member-section" aria-labelledby="expense-submit-heading">
          <div className="member-section-heading">
            <div>
              <h2 id="expense-submit-heading">New reimbursement</h2>
              <p className="member-section-lede">
                For a purchase you’ve made on behalf of a temple project.
              </p>
            </div>
            <a href="#expense-history-heading" className="member-inline-link">
              Your submissions <PortalArrow />
            </a>
          </div>
          {loading && projects.length === 0 ? (
            <MemberLoading label="Loading expense projects…" />
          ) : projects.length === 0 && !error ? (
            <MemberEmptyState
              icon="receipt"
              title="Let’s connect your expense to a project."
              description="There aren’t any active projects accepting expenses yet. Contact your project lead or the treasurer to open the right project before submitting."
            >
              <a href="/contact" className="member-secondary-action">
                Contact the team <PortalArrow />
              </a>
            </MemberEmptyState>
          ) : (
            <form
              className="member-form-grid member-expense-form"
              onSubmit={submitExpense}
              aria-busy={submitting}
            >
              <div className="member-form-section">
                <span>01</span>
                <div>
                  <h3>The purchase</h3>
                  <p>Tell us which project this supports and what you paid.</p>
                </div>
              </div>
              <label className="member-field">
                <span>Project</span>
                <select
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  required
                >
                  <option value="">Choose a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="member-field">
                <span>Expense type</span>
                <select
                  value={expenseType}
                  onChange={(event) =>
                    setExpenseType(
                      event.target.value as (typeof expenseTypeOptions)[number]["value"],
                    )
                  }
                  required
                >
                  <option value="">Select type</option>
                  {expenseTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="member-field">
                <span>Vendor or store</span>
                <input
                  value={vendorName}
                  onChange={(event) => setVendorName(event.target.value)}
                  placeholder="Where did you make the purchase?"
                  required
                />
              </label>
              <label className="member-field">
                <span>Amount (USD)</span>
                <input
                  value={amountDollars}
                  onChange={(event) => setAmountDollars(event.target.value)}
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  required
                />
              </label>
              <label className="member-field member-field-wide">
                <span>What was purchased?</span>
                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="For example, flowers for the community gathering"
                  required
                />
              </label>
              <label className="member-field">
                <span>Paid on</span>
                <input
                  value={incurredAt}
                  onChange={(event) => setIncurredAt(event.target.value)}
                  type="datetime-local"
                  required
                />
              </label>
              <label className="member-field">
                <span>Payment method</span>
                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value as (typeof paymentMethodOptions)[number]["value"],
                    )
                  }
                  required
                >
                  <option value="">Select method</option>
                  {paymentMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="member-form-section">
                <span>02</span>
                <div>
                  <h3>Supporting details</h3>
                  <p>A receipt helps the treasurer review your request.</p>
                </div>
              </div>
              <label className="member-field member-field-wide">
                <span>Receipt link (optional)</span>
                <input
                  value={receiptUrl}
                  onChange={(event) => setReceiptUrl(event.target.value)}
                  type="url"
                  placeholder="https://"
                />
                <small>
                  Paste a shareable link to your receipt. Make sure the treasurer can open it.
                </small>
              </label>
              <label className="member-field member-field-wide">
                <span>Notes (optional)</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
              <div className="member-form-footer">
                <p>Your request is sent to the treasurer for review.</p>
                <button
                  type="submit"
                  className="member-submit"
                  disabled={submitting || projects.length === 0}
                >
                  {submitting ? "Sending for review…" : "Send for review"}
                  <PortalArrow />
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="member-section" aria-labelledby="expense-history-heading">
          <div className="member-section-heading">
            <h2 id="expense-history-heading">Your submissions</h2>
          </div>
          {loading && submissions.length === 0 ? (
            <MemberLoading label="Loading your submissions…" />
          ) : submissions.length === 0 && !error ? (
            <MemberEmptyState
              icon="receipt"
              title="Nothing to follow up on."
              description="Your submitted expenses will appear here with their review and payment status. Keep a receipt whenever you purchase something for a temple project."
              compact
            />
          ) : (
            <div className="member-ledger">
              {submissions.map((row) => (
                <article key={row.id} className="member-ledger-row">
                  <div>
                    <strong>{row.vendor_name}</strong>
                    <p>{row.description}</p>
                    <small>
                      {formatDate(row.created_at)} ·{" "}
                      {row.project_id
                        ? (projectNameById.get(row.project_id) ?? "Project")
                        : "Unlinked"}
                    </small>
                    <span className={`member-status-pill is-${row.expense_status}`}>
                      {row.expense_status === "submitted"
                        ? "Awaiting review"
                        : row.expense_status === "paid" || row.expense_status === "reimbursed"
                          ? "Payment complete"
                          : row.expense_status}
                    </span>
                  </div>
                  <span>{formatCurrency(row.amount_cents)}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  return (
    <section className="db-card space-y-5 p-6">
      <header>
        <h2 className="text-2xl font-semibold text-[var(--db-text)]">Project Expense Submission</h2>
        <p className="mt-1 text-sm text-[var(--db-text-soft)]">
          Submit project-related expenses. Treasurer or super admin will review and approve in the
          admin expense queue.
        </p>
      </header>

      <form className="db-card-muted grid gap-3 p-4 md:grid-cols-6" onSubmit={submitExpense}>
        <select
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
          className="db-select text-sm md:col-span-2"
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
          onChange={(event) =>
            setExpenseType(event.target.value as (typeof expenseTypeOptions)[number]["value"])
          }
          className="db-select text-sm"
        >
          {expenseTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={paymentMethod}
          onChange={(event) =>
            setPaymentMethod(event.target.value as (typeof paymentMethodOptions)[number]["value"])
          }
          className="db-select text-sm"
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
          className="db-input text-sm"
          required
        />

        <input
          value={amountCents}
          onChange={(event) => setAmountCents(event.target.value)}
          type="number"
          min={0}
          placeholder="Amount cents"
          className="db-input text-sm"
          required
        />

        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          className="db-input text-sm md:col-span-3"
          required
        />

        <input
          value={incurredAt}
          onChange={(event) => setIncurredAt(event.target.value)}
          type="datetime-local"
          className="db-input text-sm md:col-span-1"
        />

        <input
          value={receiptUrl}
          onChange={(event) => setReceiptUrl(event.target.value)}
          type="url"
          placeholder="Receipt URL"
          className="db-input text-sm md:col-span-2"
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
                  <td className="px-3 py-2 text-slate-700">
                    {row.project_id
                      ? (projectNameById.get(row.project_id) ?? row.project_id)
                      : "Unlinked"}
                  </td>
                  <td className="px-3 py-2 text-slate-900">{row.vendor_name}</td>
                  <td className="px-3 py-2 text-slate-700">{row.description}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">
                    {formatCurrency(row.amount_cents)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(row.expense_status)}`}
                    >
                      {row.expense_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {submissions.length === 0 ? (
            <p className="p-3 text-sm text-slate-600">No submitted expenses yet.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
