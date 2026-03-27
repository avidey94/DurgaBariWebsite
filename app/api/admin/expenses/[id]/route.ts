import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import {
  buildUpdateExpenseAuditChanges,
  insertExpenseAuditEvent,
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

interface UpdateExpenseBody {
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
}

const parseDateInput = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

const isPaidStatus = (status: ExpenseStatus) => status === "paid" || status === "reimbursed";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const { id } = await context.params;
  const body = (await request.json()) as UpdateExpenseBody;

  const { data: existing, error: existingError } = await supabase
    .from("expenses")
    .select(EXPENSE_SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ message: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ message: "Expense not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.expenseType !== undefined) {
    if (!ALLOWED_EXPENSE_TYPES.includes(body.expenseType)) {
      return NextResponse.json({ message: "expenseType is invalid." }, { status: 400 });
    }

    updates.expense_type = body.expenseType;
  }

  if (body.projectId !== undefined) {
    updates.project_id = body.projectId?.trim() || null;
  }

  if (body.vendorName !== undefined) {
    const vendorName = body.vendorName.trim();
    if (!vendorName) {
      return NextResponse.json({ message: "vendorName cannot be empty." }, { status: 400 });
    }

    updates.vendor_name = vendorName;
  }

  if (body.description !== undefined) {
    const description = body.description.trim();
    if (!description) {
      return NextResponse.json({ message: "description cannot be empty." }, { status: 400 });
    }

    updates.description = description;
  }

  if (body.amountCents !== undefined) {
    const amountCents = Math.floor(Number(body.amountCents));

    if (!Number.isFinite(amountCents) || amountCents < 0) {
      return NextResponse.json({ message: "amountCents must be greater than or equal to 0." }, { status: 400 });
    }

    updates.amount_cents = amountCents;
  }

  if (body.expenseStatus !== undefined) {
    if (!ALLOWED_EXPENSE_STATUSES.includes(body.expenseStatus)) {
      return NextResponse.json({ message: "expenseStatus is invalid." }, { status: 400 });
    }

    updates.expense_status = body.expenseStatus;
  }

  if (body.paymentMethod !== undefined) {
    if (!ALLOWED_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return NextResponse.json({ message: "paymentMethod is invalid." }, { status: 400 });
    }

    updates.payment_method = body.paymentMethod;
  }

  if (body.incurredAt !== undefined) {
    const occurredAt = parseDateInput(body.incurredAt);

    if (occurredAt === null) {
      return NextResponse.json({ message: "incurredAt must be a valid date." }, { status: 400 });
    }

    updates.incurred_at = occurredAt;
  }

  if (body.dueAt !== undefined) {
    const dueAt = parseDateInput(body.dueAt);
    if (body.dueAt && dueAt === null) {
      return NextResponse.json({ message: "dueAt must be a valid date." }, { status: 400 });
    }
    updates.due_at = dueAt;
  }

  if (body.paidAt !== undefined) {
    const paidAt = parseDateInput(body.paidAt);
    if (body.paidAt && paidAt === null) {
      return NextResponse.json({ message: "paidAt must be a valid date." }, { status: 400 });
    }
    updates.paid_at = paidAt;
  }

  if (body.receiptUrl !== undefined) {
    updates.receipt_url = body.receiptUrl?.trim() || null;
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes?.trim() || null;
  }

  const effectiveStatus = (updates.expense_status as ExpenseStatus | undefined) ?? (existing.expense_status as ExpenseStatus);
  const effectivePaidAt = updates.paid_at !== undefined ? updates.paid_at : existing.paid_at;

  if (isPaidStatus(effectiveStatus) && !effectivePaidAt) {
    updates.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase.from("expenses").update(updates).eq("id", id).select(EXPENSE_SELECT_COLUMNS).maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ message: "Expense not found." }, { status: 404 });
  }

  const changes = buildUpdateExpenseAuditChanges(existing as Record<string, unknown>, data as Record<string, unknown>);

  if (Object.keys(changes).length > 0) {
    const auditInsert = await insertExpenseAuditEvent(supabase, {
      expenseId: id,
      eventType: "update",
      actor: {
        familyId: access.familyId,
        email: access.userEmail,
      },
      changes,
    });

    if (auditInsert.error) {
      const rollback = await supabase
        .from("expenses")
        .update({
          expense_type: existing.expense_type,
          project_id: existing.project_id,
          vendor_name: existing.vendor_name,
          description: existing.description,
          amount_cents: existing.amount_cents,
          expense_status: existing.expense_status,
          payment_method: existing.payment_method,
          incurred_at: existing.incurred_at,
          due_at: existing.due_at,
          paid_at: existing.paid_at,
          receipt_url: existing.receipt_url,
          notes: existing.notes,
          metadata: existing.metadata,
          updated_at: existing.updated_at,
        })
        .eq("id", id);

      if (rollback.error) {
        return NextResponse.json(
          {
            message: `Expense audit logging failed and rollback also failed for expense ${id}. Manual intervention required.`,
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { message: `Unable to save expense because audit logging failed: ${auditInsert.error.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ expense: data }, { status: 200 });
}

export async function DELETE() {
  return NextResponse.json(
    {
      message:
        "Expense records cannot be deleted. If an entry was entered in error, set its status to cancelled to preserve the audit trail.",
    },
    { status: 405 },
  );
}
