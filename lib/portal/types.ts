export type FamilyRole =
  | "super_admin"
  | "treasurer"
  | "event_manager"
  | "site_content_manager"
  | "membership_manager"
  | "member";

export type ActiveDonorStatus = "none" | "bronze" | "silver" | "gold";
export type RequestedActiveDonorStatus = Exclude<ActiveDonorStatus, "none">;

export type FoundingFamilyStatus =
  | "not_founding"
  | "founding_active"
  | "founding_completed"
  | "founding_paused";

export type PledgeStatus = "none" | "active" | "completed" | "paused" | "cancelled";

export type ProjectStatus = "planned" | "active" | "funded" | "completed" | "archived";

export type DonorVisibility = "public" | "members" | "hidden";

export type DonationType = "founding_pledge" | "project" | "general";

export type DonationPaymentChannel =
  | "manual"
  | "benevity"
  | "zelle"
  | "check"
  | "cash"
  | "bank_transfer"
  | "stripe"
  | "other";

export interface FamilyAccount {
  id: string;
  authUserId: string;
  familyDisplayName: string;
  primaryEmail: string;
  profileCompleted: boolean;
  phoneNumber: string | null;
  adultsCount: number;
  adultNames: string[];
  childrenCount: number;
  childNames: string[];
  foundingFamilyStatus: FoundingFamilyStatus;
  pledgeStatus: PledgeStatus;
  activeDonorStatus: ActiveDonorStatus;
  requestedActiveDonorStatus: RequestedActiveDonorStatus | null;
  requestedActiveDonorAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyRoleGrant {
  id: string;
  familyId: string;
  role: FamilyRole;
  grantedByFamilyId: string | null;
  grantedAt: string;
}

export interface PledgeProgram {
  id: string;
  familyId: string;
  programCode: string;
  programName: string;
  monthlyCommitmentCents: number;
  startDate: string;
  targetDate: string;
  targetTotalCents: number;
  status: Exclude<PledgeStatus, "none">;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FoundingPledgeProgress {
  pledgeId: string;
  familyId: string;
  asOfDate: string;
  totalDonatedCents: number;
  targetDonatedByNowCents: number;
  remainingBalanceCents: number;
  progressPercent: number;
  progressStatus: "ahead" | "on_track" | "behind";
}

export interface FundingProject {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  coverImageUrl: string | null;
  fundingGoalCents: number;
  status: ProjectStatus;
  featured: boolean;
  donorVisibility: DonorVisibility;
  acceptAnonymous: boolean;
  isPublic: boolean;
  startsAt: string | null;
  endsAt: string | null;
  fundedAt: string | null;
  completedAt: string | null;
  createdByFamilyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFundingSnapshot {
  projectId: string;
  fundedAmountCents: number;
  percentFunded: number;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  title: string;
  body: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdByFamilyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DonationLedgerEntry {
  id: string;
  familyId: string;
  donationType: DonationType;
  projectId: string | null;
  amountCents: number;
  occurredAt: string;
  recordedAt: string;
  recordedByFamilyId: string | null;
  paymentChannel: DonationPaymentChannel;
  externalReference: string | null;
  isAnonymous: boolean;
  visibility: "public" | "members" | "private";
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyDashboardSummary {
  family: FamilyAccount;
  roles: FamilyRole[];
  pledgeProgress: FoundingPledgeProgress | null;
  recentDonations: DonationLedgerEntry[];
  openProjects: Array<FundingProject & { funding: ProjectFundingSnapshot | null }>;
}
