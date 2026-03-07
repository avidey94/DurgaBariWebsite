import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import {
  buildUpdateAuditChanges,
  insertDonationAuditEvent,
} from "@/lib/portal/donation-audit";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";
import type { DonationType } from "@/lib/portal/types";

interface UpdateDonationBody {
  donationType?: DonationType;
  projectId?: string | null;
  foundingMonth?: string | null;
  amountCents?: number;
  occurredAt?: string;
  paymentChannel?: string;
  notes?: string | null;
  visibility?: "public" | "members" | "private";
  isAnonymous?: boolean;
  externalReference?: string | null;
}

const ALLOWED_DONATION_TYPES: DonationType[] = ["founding_pledge", "project", "general"];
const isValidFoundingMonth = (value: string) =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value >= "2026-01" && value <= "2028-12";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "donations.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as UpdateDonationBody;
  const { data: existing, error: existingError } = await supabase
    .from("donations")
    .select(
      "id, family_id, donation_type, project_id, amount_cents, occurred_at, recorded_at, recorded_by_family_id, payment_channel, external_reference, is_anonymous, visibility, notes, metadata, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ message: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ message: "Donation not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.donationType) {
    if (!ALLOWED_DONATION_TYPES.includes(body.donationType)) {
      return NextResponse.json({ message: "Invalid donationType." }, { status: 400 });
    }

    updates.donation_type = body.donationType;
  }

  if (body.projectId !== undefined) {
    updates.project_id = body.projectId?.trim() || null;
  }

  let requestedFoundingMonth: string | null | undefined;
  if (body.foundingMonth !== undefined) {
    const normalized = body.foundingMonth?.trim() || null;
    if (normalized !== null && !isValidFoundingMonth(normalized)) {
      return NextResponse.json(
        { message: "foundingMonth must be between 2026-01 and 2028-12." },
        { status: 400 },
      );
    }
    requestedFoundingMonth = normalized;
  }

  if (body.amountCents !== undefined) {
    const amountCents = Math.floor(Number(body.amountCents));
    if (!Number.isFinite(amountCents) || amountCents < 0) {
      return NextResponse.json({ message: "amountCents must be greater than or equal to 0." }, { status: 400 });
    }

    updates.amount_cents = amountCents;
  }

  if (body.occurredAt !== undefined) {
    const occurredAt = new Date(body.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json({ message: "occurredAt must be a valid date." }, { status: 400 });
    }

    updates.occurred_at = occurredAt.toISOString();
  }

  if (body.paymentChannel !== undefined) {
    updates.payment_channel = body.paymentChannel;
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes?.trim() || null;
  }

  if (body.visibility !== undefined) {
    updates.visibility = body.visibility;
  }

  if (body.externalReference !== undefined) {
    updates.external_reference = body.externalReference?.trim() || null;
  }

  const effectiveDonationType = (updates.donation_type as DonationType | undefined) ?? existing.donation_type;
  const effectiveProjectId =
    updates.project_id !== undefined ? (updates.project_id as string | null) : existing.project_id;

  if (effectiveDonationType === "project" && effectiveProjectId === null) {
    return NextResponse.json({ message: "projectId is required for project donations." }, { status: 400 });
  }

  if (effectiveDonationType !== "project" && effectiveProjectId !== null) {
    return NextResponse.json({ message: "projectId is only valid for project donations." }, { status: 400 });
  }

  if (effectiveDonationType === "project") {
    if (body.isAnonymous !== undefined) {
      updates.is_anonymous = body.isAnonymous;
    }
  } else if (existing.is_anonymous || body.isAnonymous !== undefined || updates.donation_type !== undefined) {
    updates.is_anonymous = false;
  }

  const existingMetadata =
    existing.metadata && typeof existing.metadata === "object"
      ? { ...(existing.metadata as Record<string, unknown>) }
      : {};
  const existingFoundingMonth =
    typeof existingMetadata.founding_month === "string" ? existingMetadata.founding_month : null;
  const effectiveFoundingMonth = requestedFoundingMonth === undefined ? existingFoundingMonth : requestedFoundingMonth;

  if (effectiveDonationType === "founding_pledge") {
    if (!effectiveFoundingMonth || !isValidFoundingMonth(effectiveFoundingMonth)) {
      return NextResponse.json(
        { message: "foundingMonth is required for founding pledges and must be between 2026-01 and 2028-12." },
        { status: 400 },
      );
    }

    updates.metadata = {
      ...existingMetadata,
      founding_month: effectiveFoundingMonth,
    };
  } else if (requestedFoundingMonth !== undefined || updates.donation_type !== undefined || existingFoundingMonth) {
    const metadataWithoutFoundingMonth = { ...existingMetadata };
    delete metadataWithoutFoundingMonth.founding_month;
    updates.metadata = metadataWithoutFoundingMonth;
  }

  const { data, error } = await supabase
    .from("donations")
    .update(updates)
    .eq("id", id)
    .select(
      "id, family_id, donation_type, project_id, amount_cents, occurred_at, recorded_at, recorded_by_family_id, payment_channel, external_reference, is_anonymous, visibility, notes, metadata, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ message: "Donation not found." }, { status: 404 });
  }

  const changes = buildUpdateAuditChanges(
    existing as Record<string, unknown>,
    data as Record<string, unknown>,
  );

  if (Object.keys(changes).length > 0) {
    const auditInsert = await insertDonationAuditEvent(supabase, {
      donationId: id,
      eventType: "update",
      actor: {
        familyId: access.familyId,
        email: access.userEmail,
      },
      changes,
    });

    if (auditInsert.error) {
      const rollback = await supabase
        .from("donations")
        .update({
          donation_type: existing.donation_type,
          project_id: existing.project_id,
          amount_cents: existing.amount_cents,
          occurred_at: existing.occurred_at,
          payment_channel: existing.payment_channel,
          external_reference: existing.external_reference,
          is_anonymous: existing.is_anonymous,
          visibility: existing.visibility,
          notes: existing.notes,
          metadata: existing.metadata,
          updated_at: existing.updated_at,
        })
        .eq("id", id);

      if (rollback.error) {
        return NextResponse.json(
          {
            message: `Donation audit logging failed and rollback also failed for donation ${id}. Manual intervention required.`,
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { message: `Unable to save donation because audit logging failed: ${auditInsert.error.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ donation: data }, { status: 200 });
}

export async function DELETE() {
  return NextResponse.json(
    {
      message:
        "Donation records cannot be deleted. To reverse an entry, set the amount to 0 and keep the audit history.",
    },
    { status: 405 },
  );
}
