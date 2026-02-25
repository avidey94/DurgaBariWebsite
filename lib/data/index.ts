import { env } from "@/lib/env";
import { GoogleSheetsProvider } from "@/lib/data/google-sheets-provider";
import { MockProvider } from "@/lib/data/mock-provider";
import type { DataProvider } from "@/lib/data/provider";

const buildProvider = (): DataProvider => {
  if (env.dataProvider === "google-sheets") {
    return new GoogleSheetsProvider();
  }

  return new MockProvider();
};

export const dataProvider = buildProvider();
