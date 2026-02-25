import { env } from "@/lib/env";
import type { DataProvider, FamiliesQuery } from "@/lib/data/provider";
import type { FamilyProfile } from "@/lib/types";

const googleSheetsNotConfiguredMessage = `GoogleSheetsProvider is not implemented yet.
Set DATA_PROVIDER=google-sheets and configure GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_CLIENT_EMAIL, and GOOGLE_SHEETS_PRIVATE_KEY to enable it.`;

export class GoogleSheetsProvider implements DataProvider {
  async getFamilyByEmail(email: string): Promise<FamilyProfile | null> {
    void email;
    if (!env.googleSheetId || !env.googleServiceEmail || !env.googlePrivateKey) {
      throw new Error(googleSheetsNotConfiguredMessage);
    }

    throw new Error("GoogleSheetsProvider.getFamilyByEmail is a stub.");
  }

  async getAllFamilies(params?: FamiliesQuery): Promise<FamilyProfile[]> {
    void params;
    if (!env.googleSheetId || !env.googleServiceEmail || !env.googlePrivateKey) {
      throw new Error(googleSheetsNotConfiguredMessage);
    }

    throw new Error("GoogleSheetsProvider.getAllFamilies is a stub.");
  }
}
