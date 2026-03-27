import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";

type ServiceRoleClient = NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>;

export interface ExpenseAuditActor {
  familyId: string | null;
  email: string;
}

export interface ExpenseAuditChange {
  from: unknown;
  to: unknown;
}

export interface ExpenseAuditRow {
  id: string;
  expense_id: string;
  event_type: "create" | "update";
  changed_at: string;
  changed_by_family_id: string | null;
  changed_by_email: string | null;
  changes: Record<string, ExpenseAuditChange>;
}

const AUDIT_TRACKED_FIELDS = [
  "expense_type",
  "project_id",
  "vendor_name",
  "description",
  "amount_cents",
  "expense_status",
  "payment_method",
  "incurred_at",
  "due_at",
  "paid_at",
  "receipt_url",
  "notes",
] as const;

const toComparableValue = (value: unknown): unknown => (value === undefined ? null : value);

export const buildCreateExpenseAuditChanges = (
  after: Record<string, unknown>,
): Record<string, ExpenseAuditChange> =>
  AUDIT_TRACKED_FIELDS.reduce<Record<string, ExpenseAuditChange>>((acc, field) => {
    acc[field] = {
      from: null,
      to: toComparableValue(after[field]),
    };
    return acc;
  }, {});

export const buildUpdateExpenseAuditChanges = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, ExpenseAuditChange> => {
  const changes: Record<string, ExpenseAuditChange> = {};

  AUDIT_TRACKED_FIELDS.forEach((field) => {
    const previousValue = toComparableValue(before[field]);
    const nextValue = toComparableValue(after[field]);

    if (previousValue !== nextValue) {
      changes[field] = {
        from: previousValue,
        to: nextValue,
      };
    }
  });

  return changes;
};

export const insertExpenseAuditEvent = async (
  supabase: ServiceRoleClient,
  input: {
    expenseId: string;
    eventType: "create" | "update";
    actor: ExpenseAuditActor;
    changes: Record<string, ExpenseAuditChange>;
  },
) => {
  return supabase.from("expense_audit_events").insert({
    expense_id: input.expenseId,
    event_type: input.eventType,
    changed_by_family_id: input.actor.familyId,
    changed_by_email: input.actor.email,
    changes: input.changes,
  });
};
