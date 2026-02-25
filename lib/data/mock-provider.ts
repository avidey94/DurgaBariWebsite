import mockFamilies from "@/data/mock-families.json";
import type { DataProvider, FamiliesQuery } from "@/lib/data/provider";
import type { FamilyProfile } from "@/lib/types";

const families = mockFamilies as FamilyProfile[];

const normalizedIncludes = (value: string, query: string) =>
  value.toLowerCase().includes(query.toLowerCase());

export class MockProvider implements DataProvider {
  async getFamilyByEmail(email: string): Promise<FamilyProfile | null> {
    const family = families.find(
      (item) => item.primaryEmail.toLowerCase() === email.toLowerCase(),
    );

    return family ?? null;
  }

  async getAllFamilies(params?: FamiliesQuery): Promise<FamilyProfile[]> {
    const query = params?.query?.trim();

    if (!query) {
      return [...families].sort((a, b) => a.familyName.localeCompare(b.familyName));
    }

    return families
      .filter(
        (family) =>
          normalizedIncludes(family.familyName, query) ||
          normalizedIncludes(family.primaryEmail, query),
      )
      .sort((a, b) => a.familyName.localeCompare(b.familyName));
  }
}
