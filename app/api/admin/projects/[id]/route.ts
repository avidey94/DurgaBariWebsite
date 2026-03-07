import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";
import type { ProjectStatus } from "@/lib/portal/types";

const ALLOWED_STATUSES: ProjectStatus[] = ["planned", "active", "funded", "completed", "archived"];

interface UpdateProjectBody {
  title?: string;
  slug?: string;
  shortDescription?: string;
  fullDescription?: string;
  coverImageUrl?: string | null;
  fundingGoalCents?: number;
  status?: ProjectStatus;
  featured?: boolean;
  donorVisibility?: "public" | "members" | "hidden";
  acceptAnonymous?: boolean;
  isPublic?: boolean;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "projects.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as UpdateProjectBody;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.title !== undefined) {
    updates.title = body.title.trim();
  }

  if (body.slug !== undefined) {
    updates.slug = body.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  if (body.shortDescription !== undefined) {
    updates.short_description = body.shortDescription.trim();
  }

  if (body.fullDescription !== undefined) {
    updates.full_description = body.fullDescription.trim();
  }

  if (body.coverImageUrl !== undefined) {
    updates.cover_image_url = body.coverImageUrl?.trim() || null;
  }

  if (body.fundingGoalCents !== undefined) {
    const fundingGoalCents = Math.floor(Number(body.fundingGoalCents));
    if (!Number.isFinite(fundingGoalCents) || fundingGoalCents < 1) {
      return NextResponse.json({ message: "fundingGoalCents must be greater than 0." }, { status: 400 });
    }

    updates.funding_goal_cents = fundingGoalCents;
  }

  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ message: "Invalid status." }, { status: 400 });
    }

    updates.status = body.status;
  }

  if (body.featured !== undefined) {
    updates.featured = body.featured;
  }

  if (body.donorVisibility !== undefined) {
    updates.donor_visibility = body.donorVisibility;
  }

  if (body.acceptAnonymous !== undefined) {
    updates.accept_anonymous = body.acceptAnonymous;
  }

  if (body.isPublic !== undefined) {
    updates.is_public = body.isPublic;
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select(
      "id, slug, title, short_description, full_description, cover_image_url, funding_goal_cents, status, featured, donor_visibility, accept_anonymous, is_public, starts_at, ends_at, funded_at, completed_at, created_by_family_id, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ message: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project: data }, { status: 200 });
}
