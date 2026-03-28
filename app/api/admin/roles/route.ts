import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { normalizeUsPhoneNumber } from "@/lib/phone";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";
import type { ActiveDonorStatus, FamilyRole } from "@/lib/portal/types";

const ALLOWED_ROLES: FamilyRole[] = [
  "super_admin",
  "treasurer",
  "event_manager",
  "site_content_manager",
  "membership_manager",
  "member",
];

interface RoleMutationBody {
  familyId?: string;
  role?: FamilyRole;
}

interface FamilyProfileUpdateBody {
  familyId?: string;
  familyDisplayName?: string;
  primaryEmail?: string;
  phoneNumber?: string | null;
  adultsCount?: number;
  adultNames?: string[];
  childrenCount?: number;
  childNames?: string[];
  roles?: FamilyRole[];
  activeDonorStatus?: ActiveDonorStatus;
}

export async function GET() {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "roles.read_all")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const [familiesResult, grantsResult] = await Promise.all([
    supabase
      .from("families")
      .select(
        "id, family_display_name, primary_email, phone_number, adults_count, adult_names, children_count, child_names, founding_family_status, pledge_status, active_donor_status, requested_active_donor_status, requested_active_donor_at, created_at, updated_at",
      )
      .order("family_display_name", { ascending: true }),
    supabase
      .from("family_roles")
      .select("id, family_id, role, granted_by_family_id, granted_at")
      .order("granted_at", { ascending: false }),
  ]);

  if (familiesResult.error) {
    return NextResponse.json({ message: familiesResult.error.message }, { status: 500 });
  }

  if (grantsResult.error) {
    return NextResponse.json({ message: grantsResult.error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      families: familiesResult.data ?? [],
      roleGrants: grantsResult.data ?? [],
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "roles.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as RoleMutationBody;
  const familyId = (body.familyId ?? "").trim();
  const role = body.role;

  if (!familyId || !role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ message: "familyId and valid role are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("family_roles")
    .insert({
      family_id: familyId,
      role,
      granted_by_family_id: access.familyId,
    })
    .select("id, family_id, role, granted_by_family_id, granted_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Role is already assigned to this family." }, { status: 409 });
    }

    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ roleGrant: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "roles.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as RoleMutationBody;
  const familyId = (body.familyId ?? "").trim();
  const role = body.role;

  if (!familyId || !role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ message: "familyId and valid role are required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("family_roles")
    .delete()
    .eq("family_id", familyId)
    .eq("role", role);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function PATCH(request: Request) {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "families.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as FamilyProfileUpdateBody;
  const familyId = (body.familyId ?? "").trim();

  if (!familyId) {
    return NextResponse.json({ message: "familyId is required." }, { status: 400 });
  }

  const familyDisplayName = (body.familyDisplayName ?? "").trim();
  const primaryEmail = (body.primaryEmail ?? "").trim().toLowerCase();
  const phoneNumberInput = body.phoneNumber?.trim() || null;
  const adultsCount = Math.floor(Number(body.adultsCount ?? 0));
  const childrenCount = Math.floor(Number(body.childrenCount ?? 0));
  const adultNames = (body.adultNames ?? []).map((value) => value.trim()).filter(Boolean);
  const childNames = (body.childNames ?? []).map((value) => value.trim()).filter(Boolean);
  const includeRoles = Array.isArray(body.roles);
  const roles = includeRoles
    ? Array.from(new Set(body.roles ?? [])).filter((role): role is FamilyRole => ALLOWED_ROLES.includes(role))
    : [];
  const includeActiveDonorStatus = typeof body.activeDonorStatus === "string";
  const activeDonorStatus = body.activeDonorStatus;

  if (!familyDisplayName || !primaryEmail) {
    return NextResponse.json({ message: "familyDisplayName and primaryEmail are required." }, { status: 400 });
  }

  if (!primaryEmail.includes("@")) {
    return NextResponse.json({ message: "primaryEmail must be a valid email address." }, { status: 400 });
  }

  if (!Number.isFinite(adultsCount) || adultsCount < 0 || !Number.isFinite(childrenCount) || childrenCount < 0) {
    return NextResponse.json({ message: "adultsCount and childrenCount must be non-negative numbers." }, { status: 400 });
  }

  if (includeActiveDonorStatus && !["none", "bronze", "silver", "gold"].includes(activeDonorStatus as string)) {
    return NextResponse.json({ message: "activeDonorStatus must be none, bronze, silver, or gold." }, { status: 400 });
  }

  let phoneNumber: string | null = null;
  if (phoneNumberInput) {
    const normalizedPhone = normalizeUsPhoneNumber(phoneNumberInput);
    if (!normalizedPhone) {
      return NextResponse.json({ message: "phoneNumber must be a valid US number." }, { status: 400 });
    }
    phoneNumber = normalizedPhone;
  }

  if (adultNames.length !== adultsCount) {
    return NextResponse.json({ message: "Provide one adult name per adult count." }, { status: 400 });
  }

  if (childNames.length !== childrenCount) {
    return NextResponse.json({ message: "Provide one child name per child count." }, { status: 400 });
  }

  if (includeRoles && !hasPortalPermission(access.roles, "roles.manage")) {
    return NextResponse.json({ message: "Only super_admin can modify roles." }, { status: 403 });
  }

  if (includeRoles && roles.length === 0) {
    return NextResponse.json({ message: "At least one role is required." }, { status: 400 });
  }

  const { error: familyUpdateError } = await supabase
    .from("families")
    .update({
      family_display_name: familyDisplayName,
      primary_email: primaryEmail,
      phone_number: phoneNumber,
      adults_count: adultsCount,
      adult_names: adultNames,
      children_count: childrenCount,
      child_names: childNames,
      ...(includeActiveDonorStatus
        ? {
            active_donor_status: activeDonorStatus,
            active_donor_status_set_by_family_id: access.familyId,
            active_donor_status_set_at: new Date().toISOString(),
            requested_active_donor_status: null,
            requested_active_donor_at: null,
          }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", familyId);

  if (familyUpdateError) {
    return NextResponse.json({ message: familyUpdateError.message }, { status: 500 });
  }

  if (includeRoles) {
    const { data: currentGrants, error: grantsError } = await supabase
      .from("family_roles")
      .select("role")
      .eq("family_id", familyId);

    if (grantsError) {
      return NextResponse.json({ message: grantsError.message }, { status: 500 });
    }

    const currentRoles = new Set((currentGrants ?? []).map((grant) => grant.role as FamilyRole));
    const incomingRoles = new Set(roles);
    const rolesToAdd = roles.filter((role) => !currentRoles.has(role));
    const rolesToRemove = Array.from(currentRoles).filter((role) => !incomingRoles.has(role));

    if (rolesToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from("family_roles")
        .delete()
        .eq("family_id", familyId)
        .in("role", rolesToRemove);

      if (removeError) {
        return NextResponse.json({ message: removeError.message }, { status: 500 });
      }
    }

    if (rolesToAdd.length > 0) {
      const { error: addError } = await supabase
        .from("family_roles")
        .insert(
          rolesToAdd.map((role) => ({
            family_id: familyId,
            role,
            granted_by_family_id: access.familyId,
          })),
        );

      if (addError) {
        return NextResponse.json({ message: addError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
