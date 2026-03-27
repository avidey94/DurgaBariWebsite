import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import {
  buildCreateExpenseAuditChanges,
  insertExpenseAuditEvent,
  type ExpenseAuditRow,
} from "@/lib/portal/expense-audit";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

type ExpenseType =
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

type ExpenseStatus = "draft" | "submitted" | "approved" | "paid" | "reimbursed" | "cancelled";

type ExpensePaymentMethod = "manual" | "ach" | "check" | "cash" | "card" | "zelle" | "bank_transfer" | "other";

const ALLOWED_EXPENSE_TYPES: ExpenseType[] = [
  "operations",
  "event",
  "maintenance",
  "utilities",
  "supplies",
  "marketing",
  "professional_services",
  "insurance",
  "technology",
  "other",
];

const ALLOWED_EXPENSE_STATUSES: ExpenseStatus[] = ["draft", "submitted", "approved", "paid", "reimbursed", "cancelled"];
const ALLOWED_PAYMENT_METHODS: ExpensePaymentMethod[] = [
  "manual",
  "ach",
  "check",
  "cash",
  "card",
  "zelle",
  "bank_transfer",
  "other",
];

const EXPENSE_SELECT_COLUMNS =
  "id, expense_type, project_id, vendor_name, description, amount_cents, expense_status, payment_method, incurred_at, due_at, paid_at, receipt_url, notes, metadata, recorded_by_family_id, created_at, updated_at";

interface CreateExpenseBody {
  expenseType?: ExpenseType;
  projectId?: string | null;
  vendorName?: string;
  description?: string;
  amountCents?: number;
  expenseStatus?: ExpenseStatus;
  paymentMethod?: ExpensePaymentMethod;
  incurredAt?: string;
  dueAt?: string | null;
  paidAt?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

const parseDateInput = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

const isPaidStatus = (status: ExpenseStatus) => status === "paid" || status === "reimbursed";

export async function GET(request: Request) {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "expenses.read_all")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const expenseType = (url.searchParams.get("type") ?? "").trim() as ExpenseType | "";
  const expenseStatus = (url.searchParams.get("status") ?? "").trim() as ExpenseStatus | "";
  const query = (url.searchParams.get("q") ?? "").trim();

  let expenseQuery = supabase.from("expenses").select(EXPENSE_SELECT_COLUMNS).order("incurred_at", { ascending: false }).limit(1000);

  if (expenseType && ALLOWED_EXPENSE_TYPES.includes(expenseType)) {
    expenseQuery = expenseQuery.eq("expense_type", expenseType);
  }

  if (expenseStatus && ALLOWED_EXPENSE_STATUSES.includes(expenseStatus)) {
    expenseQuery = expenseQuery.eq("expense_status", expenseStatus);
  }

  if (query) {
    const escaped = query.replace(/,/g, " ");
    expenseQuery = expenseQuery.or(`vendor_name.ilike.%${escaped}%,description.ilike.%${escaped}%,notes.ilike.%${escaped}%`);
  }

  const [expensesResult, projectsResult, familiesResult] = await Promise.all([
    expenseQuery,
    supabase.from("projects").select("id, title, slug, status").order("title", { ascending: true }),
    supabase.from("families").select("id, family_display_name, primary_email").order("family_display_name", { ascending: true }),
  ]);

  if (expensesResult.error) {
    return NextResponse.json({ message: expensesResult.error.message }, { status: 500 });
  }

  if (projectsResult.error) {
    return NextResponse.json({ message: projectsResult.error.message }, { status: 500 });
  }

  if (familiesResult.error) {
    return NextResponse.json({ message: familiesResult.error.message }, { status: 500 });
  }

  const expenseIds = (expensesResult.data ?? []).map((row) => row.id as string);
  let auditsByExpenseId: Record<string, ExpenseAuditRow[]> = {};

  if (expenseIds.length > 0) {
    const auditResult = await supabase
      .from("expense_audit_events")
      .select("id, expense_id, event_type, changed_at, changed_by_family_id, changed_by_email, changes")
      .in("expense_id", expenseIds)
      .order("changed_at", { ascending: false })
      .limit(5000);

    if (auditResult.error) {
      if (auditResult.error.code !== "42P01") {
        return NextResponse.json({ message: auditResult.error.message }, { status: 500 });
      }
    } else {
      auditsByExpenseId = (auditResult.data ?? []).reduce<Record<string, ExpenseAuditRow[]>>((acc, row) => {
        const expenseId = row.expense_id as string;
        acc[expenseId] = [...(acc[expenseId] ?? []), row as ExpenseAuditRow];
        return acc;
      }, {});
    }
  }

  const now = new Date();
  const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const thisYear = String(now.getUTCFullYear());
  const totals = (expensesResult.data ?? []).reduce(
    (acc, row) => {
      const amount = Number(row.amount_cents ?? 0);
      const status = row.expense_status as ExpenseStatus;
      const incurredAt = String(row.incurred_at ?? "");
      const monthPrefix = incurredAt.slice(0, 7);
      const yearPrefix = incurredAt.slice(0, 4);

      acc.totalAmountCents += amount;
      if (!isPaidStatus(status) && status !== "cancelled") {
        acc.openAmountCents += amount;
      }
      if (monthPrefix === thisMonth) {
        acc.thisMonthAmountCents += amount;
      }
      if (yearPrefix === thisYear) {
        acc.thisYearAmountCents += amount;
      }
      acc.byStatus[status] = (acc.byStatus[status] ?? 0) + amount;

      return acc;
    },
    {
      totalAmountCents: 0,
      openAmountCents: 0,
      thisMonthAmountCents: 0,
      thisYearAmountCents: 0,
      byStatus: {} as Record<ExpenseStatus, number>,
    },
  );

  return NextResponse.json(
    {
      expenses: expensesResult.data ?? [],
      projects: projectsResult.data ?? [],
      families: familiesResult.data ?? [],
      auditsByExpenseId,
      summary: {
        ...totals,
        count: (expensesResult.data ?? []).length,
      },
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "expenses.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as CreateExpenseBody;
  const expenseType = body.expenseType;
  const expenseStatus = body.expenseStatus ?? "submitted";
  const paymentMethod = body.paymentMethod ?? "manual";
  const projectId = body.projectId?.trim() || null;
  const vendorName = (body.vendorName ?? "").trim();
  const description = (body.description ?? "").trim();
  const amountCents = Math.floor(Number(body.amountCents ?? 0));
  const incurredAt = parseDateInput(body.incurredAt) ?? new Date().toISOString();
  const dueAt = parseDateInput(body.dueAt);
  const paidAtInput = parseDateInput(body.paidAt);
  const paidAt = isPaidStatus(expenseStatus) ? paidAtInput ?? incurredAt : paidAtInput;

  if (!expenseType || !ALLOWED_EXPENSE_TYPES.includes(expenseType)) {
    return NextResponse.json({ message: "expenseType is required and must be valid." }, { status: 400 });
  }

  if (!ALLOWED_EXPENSE_STATUSES.includes(expenseStatus)) {
    return NextResponse.json({ message: "expenseStatus is invalid." }, { status: 400 });
  }

  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ message: "paymentMethod is invalid." }, { status: 400 });
  }

  if (!vendorName || !description) {
    return NextResponse.json({ message: "vendorName and description are required." }, { status: 400 });
  }

  if (!Number.isFinite(amountCents) || amountCents < 0) {
    return NextResponse.json({ message: "amountCents must be greater than or equal to 0." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      expense_type: expenseType,
      project_id: projectId,
      vendor_name: vendorName,
      description,
      amount_cents: amountCents,
      expense_status: expenseStatus,
      payment_method: paymentMethod,
      incurred_at: incurredAt,
      due_at: dueAt,
      paid_at: paidAt,
      receipt_url: body.receiptUrl?.trim() || null,
      notes: body.notes?.trim() || null,
      metadata: body.metadata ?? {},
      recorded_by_family_id: access.familyId,
    })
    .select(EXPENSE_SELECT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const auditInsert = await insertExpenseAuditEvent(supabase, {
    expenseId: data.id as string,
    eventType: "create",
    actor: {
      familyId: access.familyId,
      email: access.userEmail,
    },
    changes: buildCreateExpenseAuditChanges(data as Record<string, unknown>),
  });

  if (auditInsert.error) {
    const rollback = await supabase.from("expenses").delete().eq("id", data.id);

    if (rollback.error) {
      return NextResponse.json(
        {
          message: `Expense audit logging failed and rollback also failed. Manual cleanup needed for expense ${data.id}.`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: `Unable to create expense because audit logging failed: ${auditInsert.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ expense: data }, { status: 201 });
}
