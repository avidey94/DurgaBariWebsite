import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";
import type {
  DonationLedgerEntry,
  FamilyAccount,
  FamilyDashboardSummary,
  FamilyRole,
  FoundingPledgeProgress,
  FundingProject,
  ProjectFundingSnapshot,
  ProjectUpdate,
} from "@/lib/portal/types";

interface FamilyRow {
  id: string;
  auth_user_id: string;
  family_display_name: string;
  primary_email: string;
  phone_number: string | null;
  adults_count: number;
  adult_names: string[] | null;
  children_count: number;
  child_names: string[] | null;
  founding_family_status: FamilyAccount["foundingFamilyStatus"];
  pledge_status: FamilyAccount["pledgeStatus"];
  created_at: string;
  updated_at: string;
}

interface DonationRow {
  id: string;
  family_id: string;
  donation_type: DonationLedgerEntry["donationType"];
  project_id: string | null;
  amount_cents: number;
  occurred_at: string;
  recorded_at: string;
  recorded_by_family_id: string | null;
  payment_channel: DonationLedgerEntry["paymentChannel"];
  external_reference: string | null;
  is_anonymous: boolean;
  visibility: DonationLedgerEntry["visibility"];
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  cover_image_url: string | null;
  funding_goal_cents: number;
  status: FundingProject["status"];
  featured: boolean;
  donor_visibility: FundingProject["donorVisibility"];
  accept_anonymous: boolean;
  is_public: boolean;
  starts_at: string | null;
  ends_at: string | null;
  funded_at: string | null;
  completed_at: string | null;
  created_by_family_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PledgeProgressRow {
  pledge_id: string;
  family_id: string;
  as_of_date: string;
  total_donated_cents: number;
  target_donated_by_now_cents: number;
  remaining_balance_cents: number;
  progress_percent: number;
  progress_status: FoundingPledgeProgress["progressStatus"];
}

interface ProjectFundingRow {
  project_id: string;
  funded_amount_cents: number;
  percent_funded: number;
}

interface ProjectSupporter {
  donationId: string;
  familyName: string;
  amountCents: number;
  occurredAt: string;
  anonymous: boolean;
}

export interface ProjectContributorSummary {
  contributorLabel: string;
  amountCents: number;
  donationCount: number;
}

interface ProjectUpdateRow {
  id: string;
  project_id: string;
  title: string;
  body: string;
  is_published: boolean;
  published_at: string | null;
  created_by_family_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectDonationRow {
  id: string;
  family_id: string | null;
  project_id?: string | null;
  amount_cents: number;
  occurred_at: string;
  is_anonymous: boolean;
  visibility: "public" | "members" | "private";
}

export interface ProjectDetailsResult {
  project: FundingProject;
  funding: ProjectFundingSnapshot | null;
  updates: ProjectUpdate[];
  supporters: ProjectSupporter[];
}

export interface PublicProjectWithContributors {
  project: FundingProject;
  funding: ProjectFundingSnapshot | null;
  contributors: ProjectContributorSummary[];
  totalContributors: number;
  anonymousTotalCents: number;
  myAnonymousContributionCents: number;
}

export interface FamilyPortalContext {
  family: FamilyAccount;
  roles: FamilyRole[];
}

const toFamilyAccount = (row: FamilyRow): FamilyAccount => ({
  id: row.id,
  authUserId: row.auth_user_id,
  familyDisplayName: row.family_display_name,
  primaryEmail: row.primary_email,
  phoneNumber: row.phone_number,
  adultsCount: row.adults_count,
  adultNames: row.adult_names ?? [],
  childrenCount: row.children_count,
  childNames: row.child_names ?? [],
  foundingFamilyStatus: row.founding_family_status,
  pledgeStatus: row.pledge_status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toDonationEntry = (row: DonationRow): DonationLedgerEntry => ({
  id: row.id,
  familyId: row.family_id,
  donationType: row.donation_type,
  projectId: row.project_id,
  amountCents: row.amount_cents,
  occurredAt: row.occurred_at,
  recordedAt: row.recorded_at,
  recordedByFamilyId: row.recorded_by_family_id,
  paymentChannel: row.payment_channel,
  externalReference: row.external_reference,
  isAnonymous: row.is_anonymous,
  visibility: row.visibility,
  notes: row.notes,
  metadata: row.metadata ?? {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toFundingProject = (row: ProjectRow): FundingProject => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  shortDescription: row.short_description,
  fullDescription: row.full_description,
  coverImageUrl: row.cover_image_url,
  fundingGoalCents: row.funding_goal_cents,
  status: row.status,
  featured: row.featured,
  donorVisibility: row.donor_visibility,
  acceptAnonymous: row.accept_anonymous,
  isPublic: row.is_public,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  fundedAt: row.funded_at,
  completedAt: row.completed_at,
  createdByFamilyId: row.created_by_family_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toFundingSnapshot = (row: ProjectFundingRow): ProjectFundingSnapshot => ({
  projectId: row.project_id,
  fundedAmountCents: row.funded_amount_cents,
  percentFunded: Number(row.percent_funded ?? 0),
});

const toPledgeProgress = (row: PledgeProgressRow): FoundingPledgeProgress => ({
  pledgeId: row.pledge_id,
  familyId: row.family_id,
  asOfDate: row.as_of_date,
  totalDonatedCents: row.total_donated_cents,
  targetDonatedByNowCents: row.target_donated_by_now_cents,
  remainingBalanceCents: row.remaining_balance_cents,
  progressPercent: Number(row.progress_percent ?? 0),
  progressStatus: row.progress_status,
});

export const getCurrentFamilyPortalContext = async (
  options?: { ignorePreview?: boolean },
): Promise<FamilyPortalContext | null> => {
  const user = await getCurrentUser({ ignorePreview: options?.ignorePreview });

  if (!user?.id) {
    return null;
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select(
      "id, auth_user_id, family_display_name, primary_email, phone_number, adults_count, adult_names, children_count, child_names, founding_family_status, pledge_status, created_at, updated_at",
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (familyError || !family) {
    return null;
  }

  const { data: roleRows } = await supabase
    .from("family_roles")
    .select("role")
    .eq("family_id", family.id);

  const roles = (roleRows ?? []).map((row) => row.role as FamilyRole);

  return {
    family: toFamilyAccount(family as FamilyRow),
    roles: roles.length > 0 ? roles : ["member"],
  };
};

export const listFamilyDonations = async (familyId: string, limit = 50): Promise<DonationLedgerEntry[]> => {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("donations")
    .select(
      "id, family_id, donation_type, project_id, amount_cents, occurred_at, recorded_at, recorded_by_family_id, payment_channel, external_reference, is_anonymous, visibility, notes, metadata, created_at, updated_at",
    )
    .eq("family_id", familyId)
    .gt("amount_cents", 0)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => toDonationEntry(row as DonationRow));
};

const getProjectFundingMap = async (projectIds: string[]): Promise<Map<string, ProjectFundingSnapshot>> => {
  if (projectIds.length === 0) {
    return new Map();
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("project_funding_totals_v")
    .select("project_id, funded_amount_cents, percent_funded")
    .in("project_id", projectIds);

  if (error) {
    return new Map();
  }

  return new Map(
    (data ?? []).map((row) => {
      const snapshot = toFundingSnapshot(row as ProjectFundingRow);
      return [snapshot.projectId, snapshot];
    }),
  );
};

export const listPublicProjects = async (limit = 20): Promise<Array<FundingProject & { funding: ProjectFundingSnapshot | null }>> => {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, slug, title, short_description, full_description, cover_image_url, funding_goal_cents, status, featured, donor_visibility, accept_anonymous, is_public, starts_at, ends_at, funded_at, completed_at, created_by_family_id, created_at, updated_at",
    )
    .eq("is_public", true)
    .in("status", ["active", "planned", "funded", "completed"])
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  const projects = (data ?? []).map((row) => toFundingProject(row as ProjectRow));
  const fundingMap = await getProjectFundingMap(projects.map((project) => project.id));

  return projects.map((project) => ({
    ...project,
    funding: fundingMap.get(project.id) ?? null,
  }));
};

export const listPublicProjectsWithContributors = async (
  limit = 20,
  viewerFamilyId?: string | null,
): Promise<PublicProjectWithContributors[]> => {
  const projects = await listPublicProjects(limit);

  if (projects.length === 0) {
    return [];
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return projects.map((entry) => ({
      project: entry,
      funding: entry.funding,
      contributors: [],
      totalContributors: 0,
      anonymousTotalCents: 0,
      myAnonymousContributionCents: 0,
    }));
  }

  const projectIds = projects.map((project) => project.id);
  const { data: rawDonations } = await supabase
    .from("donations")
    .select("project_id, family_id, amount_cents, is_anonymous, visibility")
    .in("project_id", projectIds)
    .eq("donation_type", "project")
    .eq("visibility", "public")
    .gt("amount_cents", 0);

  const donations = (rawDonations ?? []) as ProjectDonationRow[];
  const donorFamilyIds = donations
    .filter((row) => !row.is_anonymous)
    .map((row) => row.family_id)
    .filter((value): value is string => Boolean(value));

  const { data: donorFamilies } = donorFamilyIds.length
    ? await supabase
        .from("families")
        .select("id, family_display_name")
        .in("id", donorFamilyIds)
    : { data: [] as Array<{ id: string; family_display_name: string }> };

  const familyNameById = new Map((donorFamilies ?? []).map((row) => [row.id, row.family_display_name]));
  const donationsByProject = donations.reduce<Map<string, ProjectDonationRow[]>>((acc, row) => {
    const projectId = row.project_id ?? null;
    if (!projectId) {
      return acc;
    }

    acc.set(projectId, [...(acc.get(projectId) ?? []), row]);
    return acc;
  }, new Map());

  return projects.map((entry) => {
    const projectDonations = donationsByProject.get(entry.id) ?? [];
    const contributorTotals = new Map<string, ProjectContributorSummary>();
    let anonymousTotalCents = 0;
    let myAnonymousContributionCents = 0;

    projectDonations.forEach((row) => {
      if (row.is_anonymous) {
        anonymousTotalCents += row.amount_cents;
        if (viewerFamilyId && row.family_id === viewerFamilyId) {
          myAnonymousContributionCents += row.amount_cents;
        }
      }

      const label = row.is_anonymous
        ? "Anonymous supporters"
        : familyNameById.get(row.family_id ?? "") ?? "Supporter";
      const existing = contributorTotals.get(label);

      if (existing) {
        existing.amountCents += row.amount_cents;
        existing.donationCount += 1;
        return;
      }

      contributorTotals.set(label, {
        contributorLabel: label,
        amountCents: row.amount_cents,
        donationCount: 1,
      });
    });

    const contributors = Array.from(contributorTotals.values())
      .sort((a, b) => b.amountCents - a.amountCents)
      .slice(0, 8);

    return {
      project: entry,
      funding: entry.funding,
      contributors,
      totalContributors: contributorTotals.size,
      anonymousTotalCents,
      myAnonymousContributionCents,
    };
  });
};

export const getFamilyFoundingPledgeProgress = async (familyId: string): Promise<FoundingPledgeProgress | null> => {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("family_founding_pledge_progress_v")
    .select(
      "pledge_id, family_id, as_of_date, total_donated_cents, target_donated_by_now_cents, remaining_balance_cents, progress_percent, progress_status",
    )
    .eq("family_id", familyId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toPledgeProgress(data as PledgeProgressRow);
};

export const getFamilyDashboardSummary = async (): Promise<FamilyDashboardSummary | null> => {
  const context = await getCurrentFamilyPortalContext();

  if (!context) {
    return null;
  }

  const [pledgeProgress, recentDonations, openProjects] = await Promise.all([
    getFamilyFoundingPledgeProgress(context.family.id),
    listFamilyDonations(context.family.id, 10),
    listPublicProjects(6),
  ]);

  return {
    family: context.family,
    roles: context.roles,
    pledgeProgress,
    recentDonations,
    openProjects,
  };
};

const toProjectUpdate = (row: ProjectUpdateRow): ProjectUpdate => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  body: row.body,
  isPublished: row.is_published,
  publishedAt: row.published_at,
  createdByFamilyId: row.created_by_family_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getProjectDetailsBySlug = async (slug: string, includeMembersOnly = false): Promise<ProjectDetailsResult | null> => {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, slug, title, short_description, full_description, cover_image_url, funding_goal_cents, status, featured, donor_visibility, accept_anonymous, is_public, starts_at, ends_at, funded_at, completed_at, created_by_family_id, created_at, updated_at",
    )
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (projectError || !projectRow) {
    return null;
  }

  const project = toFundingProject(projectRow as ProjectRow);

  const [fundingMap, updatesResponse, donationsResponse] = await Promise.all([
    getProjectFundingMap([project.id]),
    supabase
      .from("project_updates")
      .select(
        "id, project_id, title, body, is_published, published_at, created_by_family_id, created_at, updated_at",
      )
      .eq("project_id", project.id)
      .eq("is_published", true)
      .order("published_at", { ascending: false }),
    supabase
      .from("donations")
      .select("id, family_id, amount_cents, occurred_at, is_anonymous, visibility")
      .eq("project_id", project.id)
      .eq("donation_type", "project")
      .gt("amount_cents", 0)
      .in("visibility", includeMembersOnly ? ["public", "members"] : ["public"])
      .order("occurred_at", { ascending: false })
      .limit(100),
  ]);

  const supportersRaw = (donationsResponse.data ?? []) as ProjectDonationRow[];
  const donorFamilyIds = supportersRaw
    .filter((row) => !row.is_anonymous)
    .map((row) => row.family_id)
    .filter((value): value is string => Boolean(value));

  const { data: donorFamilies } = donorFamilyIds.length
    ? await supabase
        .from("families")
        .select("id, family_display_name")
        .in("id", donorFamilyIds)
    : { data: [] as Array<{ id: string; family_display_name: string }> };

  const familyNameById = new Map((donorFamilies ?? []).map((row) => [row.id, row.family_display_name]));

  const supporters: ProjectSupporter[] = supportersRaw.map((row) => {
    const anonymous = Boolean(row.is_anonymous);
    const familyName = anonymous ? "Anonymous" : familyNameById.get(row.family_id) ?? "Supporter";

    return {
      donationId: row.id,
      familyName,
      amountCents: Math.max(0, row.amount_cents ?? 0),
      occurredAt: row.occurred_at,
      anonymous,
    };
  });

  return {
    project,
    funding: fundingMap.get(project.id) ?? null,
    updates: ((updatesResponse.data ?? []) as ProjectUpdateRow[]).map((row) => toProjectUpdate(row)),
    supporters,
  };
};
