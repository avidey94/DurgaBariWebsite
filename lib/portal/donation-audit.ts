import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";

type ServiceRoleClient = NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>;

export interface DonationAuditActor {
  familyId: string | null;
  email: string;
}

export interface DonationAuditChange {
  from: unknown;
  to: unknown;
}

export interface DonationAuditRow {
  id: string;
  donation_id: string;
  event_type: "create" | "update";
  changed_at: string;
  changed_by_family_id: string | null;
  changed_by_email: string | null;
  changes: Record<string, DonationAuditChange>;
}

const AUDIT_TRACKED_FIELDS = [
  "family_id",
  "donation_type",
  "project_id",
  "amount_cents",
  "occurred_at",
  "payment_channel",
  "external_reference",
  "is_anonymous",
  "visibility",
  "notes",
] as const;

const toComparableValue = (value: unknown): unknown => (value === undefined ? null : value);

export const buildCreateAuditChanges = (after: Record<string, unknown>): Record<string, DonationAuditChange> =>
  AUDIT_TRACKED_FIELDS.reduce<Record<string, DonationAuditChange>>((acc, field) => {
    acc[field] = {
      from: null,
      to: toComparableValue(after[field]),
    };
    return acc;
  }, {});

export const buildUpdateAuditChanges = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, DonationAuditChange> => {
  const changes: Record<string, DonationAuditChange> = {};

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

export const insertDonationAuditEvent = async (
  supabase: ServiceRoleClient,
  input: {
    donationId: string;
    eventType: "create" | "update";
    actor: DonationAuditActor;
    changes: Record<string, DonationAuditChange>;
  },
) => {
  return supabase.from("donation_audit_events").insert({
    donation_id: input.donationId,
    event_type: input.eventType,
    changed_by_family_id: input.actor.familyId,
    changed_by_email: input.actor.email,
    changes: input.changes,
  });
};
