import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { jsonNoStore } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth/session";
import {
  buildCreateExpenseAuditChanges,
  insertExpenseAuditEvent,
} from "@/lib/portal/expense-audit";
import { canAccessMemberContent, getCurrentFamilyPortalContext } from "@/lib/portal/server";

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

interface CreatePortalExpenseBody {
  expenseType?: ExpenseType;
  projectId?: string;
  vendorName?: string;
  description?: string;
  amountCents?: number;
  paymentMethod?: ExpensePaymentMethod;
  incurredAt?: string;
  receiptUrl?: string | null;
  notes?: string | null;
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

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonNoStore({ message: "Unauthorized" }, { status: 401 });
  }

  const context = await getCurrentFamilyPortalContext();

  if (!context) {
    return jsonNoStore({ message: "Family profile not found." }, { status: 404 });
  }

  if (!canAccessMemberContent(context)) {
    return jsonNoStore({ message: "Portal access is pending approval.", code: "portal_access_pending" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return jsonNoStore({ message: "Supabase is not configured." }, { status: 500 });
  }

  const [projectsResult, expensesResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, slug, status, is_public")
      .in("status", ["planned", "active", "funded", "completed"])
      .eq("is_public", true)
      .order("title", { ascending: true }),
    supabase
      .from("expenses")
      .select(EXPENSE_SELECT_COLUMNS)
      .eq("recorded_by_family_id", context.family.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (projectsResult.error) {
    return jsonNoStore({ message: projectsResult.error.message }, { status: 500 });
  }

  if (expensesResult.error) {
    return jsonNoStore({ message: expensesResult.error.message }, { status: 500 });
  }

  return jsonNoStore(
    {
      projects: projectsResult.data ?? [],
      submissions: expensesResult.data ?? [],
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonNoStore({ message: "Unauthorized" }, { status: 401 });
  }

  const context = await getCurrentFamilyPortalContext();

  if (!context) {
    return jsonNoStore({ message: "Family profile not found." }, { status: 404 });
  }

  if (!canAccessMemberContent(context)) {
    return jsonNoStore({ message: "Portal access is pending approval.", code: "portal_access_pending" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return jsonNoStore({ message: "Supabase is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as CreatePortalExpenseBody;

  const expenseType = body.expenseType ?? "other";
  const projectId = (body.projectId ?? "").trim();
  const vendorName = (body.vendorName ?? "").trim();
  const description = (body.description ?? "").trim();
  const amountCents = Math.floor(Number(body.amountCents ?? 0));
  const paymentMethod = body.paymentMethod ?? "manual";
  const incurredAt = parseDateInput(body.incurredAt) ?? new Date().toISOString();

  if (!ALLOWED_EXPENSE_TYPES.includes(expenseType)) {
    return jsonNoStore({ message: "expenseType is invalid." }, { status: 400 });
  }

  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    return jsonNoStore({ message: "paymentMethod is invalid." }, { status: 400 });
  }

  if (!projectId) {
    return jsonNoStore({ message: "projectId is required." }, { status: 400 });
  }

  if (!vendorName || !description) {
    return jsonNoStore({ message: "vendorName and description are required." }, { status: 400 });
  }

  if (!Number.isFinite(amountCents) || amountCents < 0) {
    return jsonNoStore({ message: "amountCents must be greater than or equal to 0." }, { status: 400 });
  }

  const projectCheck = await supabase
    .from("projects")
    .select("id, title, status")
    .eq("id", projectId)
    .in("status", ["planned", "active", "funded", "completed"])
    .maybeSingle();

  if (projectCheck.error) {
    return jsonNoStore({ message: projectCheck.error.message }, { status: 500 });
  }

  if (!projectCheck.data) {
    return jsonNoStore({ message: "Selected project is unavailable for submissions." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      expense_type: expenseType,
      project_id: projectId,
      vendor_name: vendorName,
      description,
      amount_cents: amountCents,
      expense_status: "submitted",
      payment_method: paymentMethod,
      incurred_at: incurredAt,
      due_at: null,
      paid_at: null,
      receipt_url: body.receiptUrl?.trim() || null,
      notes: body.notes?.trim() || null,
      metadata: {
        submission_source: "member_portal",
        submitted_by_email: user.email,
      },
      recorded_by_family_id: context.family.id,
    })
    .select(EXPENSE_SELECT_COLUMNS)
    .single();

  if (error) {
    return jsonNoStore({ message: error.message }, { status: 500 });
  }

  const auditInsert = await insertExpenseAuditEvent(supabase, {
    expenseId: data.id as string,
    eventType: "create",
    actor: {
      familyId: context.family.id,
      email: user.email,
    },
    changes: buildCreateExpenseAuditChanges(data as Record<string, unknown>),
  });

  if (auditInsert.error) {
    const rollback = await supabase.from("expenses").delete().eq("id", data.id);

    if (rollback.error) {
      return jsonNoStore(
        {
          message: `Expense submission audit logging failed and rollback also failed. Manual cleanup needed for expense ${data.id}.`,
        },
        { status: 500 },
      );
    }

    return jsonNoStore(
      { message: `Unable to submit expense because audit logging failed: ${auditInsert.error.message}` },
      { status: 500 },
    );
  }

  return jsonNoStore({ submission: data }, { status: 201 });
}
