import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

interface AuthListUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

function toDisplayName(email: string, metadata: Record<string, unknown> | null | undefined) {
  const metadataName = metadata?.full_name;

  if (typeof metadataName === "string" && metadataName.trim().length > 0) {
    return metadataName.trim();
  }

  const localPart = email.split("@")[0] ?? "";
  const normalized = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return email;
  }

  return normalized
    .split(" ")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export async function POST() {
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

  let page = 1;
  const perPage = 200;
  const authUsers: AuthListUser[] = [];

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const users = (data.users ?? []) as AuthListUser[];
    authUsers.push(...users);

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  const candidates = authUsers
    .filter((user) => typeof user.email === "string" && user.email.trim().length > 0)
    .map((user) => ({
      auth_user_id: user.id,
      primary_email: (user.email ?? "").trim().toLowerCase(),
      family_display_name: toDisplayName((user.email ?? "").trim(), user.user_metadata),
      adults_count: 1,
      children_count: 0,
      founding_family_status: "not_founding",
      pledge_status: "none",
      source: "supabase",
    }));

  if (candidates.length === 0) {
    return NextResponse.json({ created: 0, updated: 0, skipped: 0 }, { status: 200 });
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("families")
    .select("auth_user_id")
    .in(
      "auth_user_id",
      candidates.map((candidate) => candidate.auth_user_id),
    );

  if (existingError) {
    return NextResponse.json({ message: existingError.message }, { status: 500 });
  }

  const existingIds = new Set((existingRows ?? []).map((row) => row.auth_user_id));
  const toInsert = candidates.filter((candidate) => !existingIds.has(candidate.auth_user_id));
  const skipped = candidates.length - toInsert.length;

  if (toInsert.length === 0) {
    return NextResponse.json({ created: 0, updated: 0, skipped }, { status: 200 });
  }

  const { data: insertedFamilies, error: insertError } = await supabase
    .from("families")
    .insert(toInsert)
    .select("id");

  if (insertError) {
    return NextResponse.json({ message: insertError.message }, { status: 500 });
  }

  const newFamilyIds = (insertedFamilies ?? []).map((family) => family.id);

  if (newFamilyIds.length > 0) {
    const memberRoleRows = newFamilyIds.map((familyId) => ({ family_id: familyId, role: "member" as const }));

    const { error: memberRoleError } = await supabase.from("family_roles").insert(memberRoleRows);

    if (memberRoleError && memberRoleError.code !== "23505") {
      return NextResponse.json({ message: memberRoleError.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    {
      created: toInsert.length,
      updated: 0,
      skipped,
    },
    { status: 200 },
  );
}
