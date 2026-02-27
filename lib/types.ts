export type Role = "admin" | "member";

export type DonationMethod =
  | "cash"
  | "check"
  | "zelle"
  | "bank_transfer"
  | "stripe"
  | "other";

export interface DonationRecord {
  id: string;
  dateISO: string;
  amountCents: number;
  method: DonationMethod;
  notes?: string;
}

export interface FamilyProfile {
  id: string;
  familyName: string;
  primaryEmail: string;
  foundingFamily: boolean;
  totalDuesPaid?: string;
  isAdmin?: boolean;
  donations: DonationRecord[];
  duesMonths?: Array<{
    month: string;
    paid: boolean;
    rawValue: string;
  }>;
  profileColumns?: Array<{
    header: string;
    value: string;
  }>;
}

export interface PortalUser {
  id?: string;
  email: string;
  role: Role;
  isAdmin: boolean;
  authSource: "dev-bypass" | "supabase";
}

export interface DonationApiResponse {
  family: Pick<FamilyProfile, "id" | "familyName" | "primaryEmail" | "foundingFamily">;
  donations: DonationRecord[];
}

export interface FamiliesApiResponse {
  families: FamilyProfile[];
}
