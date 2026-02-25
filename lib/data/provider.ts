import type { FamilyProfile } from "@/lib/types";

export interface FamiliesQuery {
  query?: string;
}

export interface DataProvider {
  getFamilyByEmail(email: string): Promise<FamilyProfile | null>;
  getAllFamilies(params?: FamiliesQuery): Promise<FamilyProfile[]>;
}
