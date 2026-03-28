import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import {
  buildCreateAuditChanges,
  insertDonationAuditEvent,
  type DonationAuditRow,
} from "@/lib/portal/donation-audit";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";
import type { DonationType } from "@/lib/portal/types";

const ALLOWED_DONATION_TYPES: DonationType[] = [
  "founding_pledge",
  "project",
  "general",
  "active_donor_bronze",
  "active_donor_silver",
  "active_donor_gold",
];
const ACTIVE_DONOR_DONATION_TYPES: DonationType[] = [
  "active_donor_bronze",
  "active_donor_silver",
  "active_donor_gold",
];
const isActiveDonorType = (value: DonationType) => ACTIVE_DONOR_DONATION_TYPES.includes(value);

export async function GET(request: Request) {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "donations.read_all")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const donationType = (url.searchParams.get("type") ?? "").trim() as DonationType | "";

  let query = supabase
    .from("donations")
    .select(
      "id, family_id, donation_type, project_id, amount_cents, occurred_at, recorded_at, recorded_by_family_id, payment_channel, external_reference, is_anonymous, visibility, notes, metadata, created_at, updated_at",
    )
    .order("occurred_at", { ascending: false })
    .limit(500);

  if (donationType && ALLOWED_DONATION_TYPES.includes(donationType)) {
    query = query.eq("donation_type", donationType);
  }

  const [donationsResult, familiesResult, projectsResult] = await Promise.all([
    query,
    supabase
      .from("families")
      .select("id, family_display_name, primary_email")
      .order("family_display_name", { ascending: true }),
    supabase
      .from("projects")
      .select("id, title, slug, status")
      .order("title", { ascending: true }),
  ]);

  if (donationsResult.error) {
    return NextResponse.json({ message: donationsResult.error.message }, { status: 500 });
  }

  if (familiesResult.error) {
    return NextResponse.json({ message: familiesResult.error.message }, { status: 500 });
  }

  if (projectsResult.error) {
    return NextResponse.json({ message: projectsResult.error.message }, { status: 500 });
  }

  const donationIds = (donationsResult.data ?? []).map((row) => row.id as string);
  let auditsByDonationId: Record<string, DonationAuditRow[]> = {};

  if (donationIds.length > 0) {
    const auditResult = await supabase
      .from("donation_audit_events")
      .select("id, donation_id, event_type, changed_at, changed_by_family_id, changed_by_email, changes")
      .in("donation_id", donationIds)
      .order("changed_at", { ascending: false })
      .limit(5000);

    if (auditResult.error) {
      if (auditResult.error.code !== "42P01") {
        return NextResponse.json({ message: auditResult.error.message }, { status: 500 });
      }
    } else {
      auditsByDonationId = (auditResult.data ?? []).reduce<Record<string, DonationAuditRow[]>>((acc, row) => {
        const donationId = row.donation_id as string;
        acc[donationId] = [...(acc[donationId] ?? []), row as DonationAuditRow];
        return acc;
      }, {});
    }
  }

  return NextResponse.json(
    {
      donations: donationsResult.data ?? [],
      families: familiesResult.data ?? [],
      projects: projectsResult.data ?? [],
      auditsByDonationId,
    },
    { status: 200 },
  );
}

interface CreateDonationBody {
  familyId?: string;
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

const isValidFoundingMonth = (value: string) =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value >= "2026-01" && value <= "2028-12";

export async function POST(request: Request) {
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

  const body = (await request.json()) as CreateDonationBody;
  const familyId = (body.familyId ?? "").trim();
  const donationType = body.donationType;
  const projectId = body.projectId?.trim() || null;
  const foundingMonth = body.foundingMonth?.trim() || null;
  const isAnonymous = donationType === "project" ? Boolean(body.isAnonymous) : false;
  const amountCents = Math.floor(Number(body.amountCents ?? 0));
  const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();

  if (!familyId || !donationType || !ALLOWED_DONATION_TYPES.includes(donationType)) {
    return NextResponse.json({ message: "familyId and valid donationType are required." }, { status: 400 });
  }

  if (donationType === "project" && !projectId) {
    return NextResponse.json({ message: "projectId is required for project donations." }, { status: 400 });
  }

  if (donationType !== "project" && projectId) {
    return NextResponse.json({ message: "projectId is only valid for project donations." }, { status: 400 });
  }

  if (donationType === "founding_pledge" && (!foundingMonth || !isValidFoundingMonth(foundingMonth))) {
    return NextResponse.json(
      { message: "foundingMonth is required for founding pledges and must be between 2026-01 and 2028-12." },
      { status: 400 },
    );
  }

  if (donationType !== "founding_pledge" && foundingMonth) {
    if (!isActiveDonorType(donationType)) {
      return NextResponse.json(
        { message: "foundingMonth is only valid for founding pledge or active donor donations." },
        { status: 400 },
      );
    }
  }

  if (isActiveDonorType(donationType) && (!foundingMonth || !isValidFoundingMonth(foundingMonth))) {
    return NextResponse.json(
      { message: "foundingMonth is required for active donor donations and must be between 2026-01 and 2028-12." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(amountCents) || amountCents < 0) {
    return NextResponse.json({ message: "amountCents must be greater than or equal to 0." }, { status: 400 });
  }

  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ message: "occurredAt must be a valid date." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("donations")
    .insert({
      family_id: familyId,
      donation_type: donationType,
      project_id: projectId,
      amount_cents: amountCents,
      occurred_at: occurredAt.toISOString(),
      payment_channel: body.paymentChannel ?? "manual",
      notes: body.notes?.trim() || null,
      visibility: body.visibility ?? "public",
      is_anonymous: isAnonymous,
      external_reference: body.externalReference?.trim() || null,
      recorded_by_family_id: access.familyId,
      metadata:
        donationType === "founding_pledge"
          ? foundingMonth
            ? { founding_month: foundingMonth }
            : {}
          : isActiveDonorType(donationType)
            ? foundingMonth
              ? { active_donor_month: foundingMonth }
              : {}
            : {},
    })
    .select(
      "id, family_id, donation_type, project_id, amount_cents, occurred_at, recorded_at, recorded_by_family_id, payment_channel, external_reference, is_anonymous, visibility, notes, metadata, created_at, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const auditInsert = await insertDonationAuditEvent(supabase, {
    donationId: data.id as string,
    eventType: "create",
    actor: {
      familyId: access.familyId,
      email: access.userEmail,
    },
    changes: buildCreateAuditChanges(data as Record<string, unknown>),
  });

  if (auditInsert.error) {
    const rollback = await supabase.from("donations").delete().eq("id", data.id);

    if (rollback.error) {
      return NextResponse.json(
        {
          message: `Donation audit logging failed and rollback also failed. Manual cleanup needed for donation ${data.id}.`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: `Unable to create donation because audit logging failed: ${auditInsert.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ donation: data }, { status: 201 });
}
