import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";
import type { ProjectStatus } from "@/lib/portal/types";

const ALLOWED_STATUSES: ProjectStatus[] = ["planned", "active", "funded", "completed", "archived"];

export async function GET() {
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

  const [projectsResult, fundingResult] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, slug, title, short_description, full_description, cover_image_url, funding_goal_cents, status, featured, donor_visibility, accept_anonymous, is_public, starts_at, ends_at, funded_at, completed_at, created_by_family_id, created_at, updated_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("project_funding_totals_v")
      .select("project_id, funded_amount_cents, percent_funded"),
  ]);

  if (projectsResult.error) {
    return NextResponse.json({ message: projectsResult.error.message }, { status: 500 });
  }

  if (fundingResult.error) {
    return NextResponse.json({ message: fundingResult.error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      projects: projectsResult.data ?? [],
      funding: fundingResult.data ?? [],
    },
    { status: 200 },
  );
}

interface CreateProjectBody {
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

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildUniqueSlug = async (
  supabase: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>,
  baseSlug: string,
) => {
  let candidate = baseSlug;
  let suffix = 2;

  while (suffix < 1000) {
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  throw new Error("Unable to generate a unique slug for this project title.");
};

export async function POST(request: Request) {
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

  const body = (await request.json()) as CreateProjectBody;
  const title = (body.title ?? "").trim();
  const requestedSlug = normalizeSlug(body.slug ?? title);
  const slug = requestedSlug;
  const shortDescription = (body.shortDescription ?? "").trim();
  const fullDescription = (body.fullDescription ?? "").trim();
  const fundingGoalCents = Math.floor(Number(body.fundingGoalCents ?? 0));

  if (!title || !shortDescription || !fullDescription) {
    return NextResponse.json({ message: "title, shortDescription, fullDescription are required." }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ message: "title must include letters or numbers." }, { status: 400 });
  }

  if (!Number.isFinite(fundingGoalCents) || fundingGoalCents < 1) {
    return NextResponse.json({ message: "fundingGoalCents must be greater than 0." }, { status: 400 });
  }

  const status = body.status ?? "planned";
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  let uniqueSlug: string;
  try {
    uniqueSlug = await buildUniqueSlug(supabase, slug);
  } catch (slugError) {
    return NextResponse.json(
      { message: slugError instanceof Error ? slugError.message : "Unable to generate slug." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      slug: uniqueSlug,
      short_description: shortDescription,
      full_description: fullDescription,
      cover_image_url: body.coverImageUrl?.trim() || null,
      funding_goal_cents: fundingGoalCents,
      status,
      featured: body.featured ?? false,
      donor_visibility: body.donorVisibility ?? "public",
      accept_anonymous: body.acceptAnonymous ?? true,
      is_public: body.isPublic ?? true,
      created_by_family_id: access.familyId,
      updated_at: new Date().toISOString(),
    })
    .select(
      "id, slug, title, short_description, full_description, cover_image_url, funding_goal_cents, status, featured, donor_visibility, accept_anonymous, is_public, starts_at, ends_at, funded_at, completed_at, created_by_family_id, created_at, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data }, { status: 201 });
}
