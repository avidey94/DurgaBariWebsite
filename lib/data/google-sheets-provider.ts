import { env } from "@/lib/env";
import type { DataProvider, FamiliesQuery } from "@/lib/data/provider";
import type { DonationMethod, DonationRecord, FamilyProfile } from "@/lib/types";

interface GoogleVizColumn {
  label?: string;
}

interface GoogleVizCell {
  v?: unknown;
  f?: string;
}

interface GoogleVizRow {
  c: Array<GoogleVizCell | null>;
}

interface GoogleVizResponse {
  table?: {
    cols?: GoogleVizColumn[];
    rows?: GoogleVizRow[];
  };
}

const googleSheetsNotConfiguredMessage =
  "Set DATA_PROVIDER=google-sheets and GOOGLE_SHEETS_SPREADSHEET_ID to enable this provider.";

const normalizeEmailValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^mailto:/, "")
    .replace(/^'+/, "")
    .replace(/\u200B/g, "");

const normalizeHeader = (header: string | undefined, index: number) => {
  const value = header?.trim();
  return value && value.length > 0 ? value : `Column ${index + 1}`;
};

const isGenericHeader = (header: string) => /^column\s+\d+$/i.test(header.trim());

const monthOrder = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

const getCellText = (cell: GoogleVizCell | null | undefined) => {
  if (!cell) {
    return "";
  }

  if (typeof cell.f === "string") {
    return cell.f.trim();
  }

  if (typeof cell.v === "string") {
    return cell.v.trim();
  }

  if (typeof cell.v === "number") {
    return String(cell.v);
  }

  if (typeof cell.v === "boolean") {
    return cell.v ? "TRUE" : "FALSE";
  }

  return "";
};

const parseAmountCents = (rawAmount: string) => {
  const normalized = rawAmount.replace(/[^\d.-]/g, "");
  const amount = Number.parseFloat(normalized);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(amount * 100);
};

const parseDateToIso = (rawDate: string) => {
  const firstLine = rawDate.split("\n").map((line) => line.trim()).find(Boolean) ?? rawDate;
  const parsed = new Date(firstLine);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
};

const toDonationMethod = (rawMethod: string): DonationMethod => {
  const value = rawMethod.toLowerCase();

  if (value.includes("cash")) return "cash";
  if (value.includes("check")) return "check";
  if (value.includes("zelle")) return "zelle";
  if (value.includes("bank")) return "bank_transfer";
  if (value.includes("stripe")) return "stripe";

  return "other";
};

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const normalizeMonthHeader = (value: string) => {
  const match = value.trim().match(/^([A-Za-z]+)-(\d{4})$/);
  if (!match) {
    return null;
  }

  const month = match[1].toLowerCase();
  const year = match[2];
  const normalizedMonth = month === "sept" ? "sep" : month;

  if (!monthOrder.includes(normalizedMonth as (typeof monthOrder)[number])) {
    return null;
  }

  return `${normalizedMonth}-${year}`;
};

const displayMonthHeader = (normalized: string) => {
  const [month, year] = normalized.split("-");
  const displayMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${displayMonth}-${year}`;
};

const buildMonthRange = (startYear: number, startMonthIndex: number, endYear: number, endMonthIndex: number) => {
  const result: string[] = [];

  let year = startYear;
  let monthIndex = startMonthIndex;

  while (year < endYear || (year === endYear && monthIndex <= endMonthIndex)) {
    result.push(`${monthOrder[monthIndex]}-${year}`);
    monthIndex += 1;

    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
  }

  return result;
};

const buildDonationRecords = (
  rowValues: string[],
  headers: string[],
  familyId: string,
): DonationRecord[] => {
  const donationIndex = headers.findIndex((header) => header.toLowerCase() === "donation");
  const dateIndex = headers.findIndex((header) => header.toLowerCase() === "date");
  const paidViaIndex = headers.findIndex((header) => header.toLowerCase() === "paid via");

  if (donationIndex < 0 && dateIndex < 0 && paidViaIndex < 0) {
    return [];
  }

  const donationValues = splitLines(rowValues[donationIndex] ?? "");
  const dateValues = splitLines(rowValues[dateIndex] ?? "");
  const paidViaValues = splitLines(rowValues[paidViaIndex] ?? "");

  const count = Math.max(donationValues.length, dateValues.length, paidViaValues.length, 1);

  return Array.from({ length: count }, (_, index) => ({
    id: `${familyId}-don-${index + 1}`,
    dateISO: parseDateToIso(dateValues[index] ?? dateValues[0] ?? ""),
    amountCents: parseAmountCents(donationValues[index] ?? donationValues[0] ?? ""),
    method: toDonationMethod(paidViaValues[index] ?? paidViaValues[0] ?? ""),
    notes: paidViaValues[index] ?? paidViaValues[0] ?? "",
  }));
};

const getGoogleVizData = async (gid?: string) => {
  if (!env.googleSheetId) {
    throw new Error(googleSheetsNotConfiguredMessage);
  }

  const gidParam = gid ? `&gid=${gid}` : "";
  const endpoint = `https://docs.google.com/spreadsheets/d/${env.googleSheetId}/gviz/tq?tqx=out:json${gidParam}`;
  const response = await fetch(endpoint, { next: { revalidate: 60 } });

  if (!response.ok) {
    throw new Error(`Unable to fetch Google Sheet. HTTP ${response.status}.`);
  }

  const rawText = await response.text();
  const prefix = "google.visualization.Query.setResponse(";
  const suffix = ");";
  const start = rawText.indexOf(prefix);
  const end = rawText.lastIndexOf(suffix);

  if (start < 0 || end < 0) {
    throw new Error("Unexpected Google Sheets response format.");
  }

  const jsonText = rawText.slice(start + prefix.length, end);
  const parsed = JSON.parse(jsonText) as GoogleVizResponse;

  const columns = parsed.table?.cols ?? [];
  const rows = parsed.table?.rows ?? [];

  const inferredHeaders = columns.map((column, index) => normalizeHeader(column.label, index));
  const rawValues = rows.map((row) => row.c.map((cell) => getCellText(cell)));

  const firstRow = rawValues[0] ?? [];
  const firstCellLooksLikeHeader = (firstRow[0] ?? "").trim().toLowerCase() === "email";
  const shouldUseFirstRowAsHeaders =
    firstCellLooksLikeHeader || inferredHeaders.every((header) => isGenericHeader(header));

  const headers = shouldUseFirstRowAsHeaders
    ? firstRow.map((value, index) => value.trim() || `Column ${index + 1}`)
    : inferredHeaders;
  const values = shouldUseFirstRowAsHeaders ? rawValues.slice(1) : rawValues;

  return { headers, values };
};

const toFamilyProfile = (headers: string[], rowValues: string[]): FamilyProfile => {
  const email = (rowValues[0] ?? "").toLowerCase();
  const nameIndex = headers.findIndex((header) => header.toLowerCase() === "name");
  const totalDuesPaidIndex = headers.findIndex((header) => header.trim().toLowerCase() === "donation");
  const familyName = rowValues[nameIndex] || email;
  const totalDuesPaidFromHeader =
    totalDuesPaidIndex >= 0 ? (rowValues[totalDuesPaidIndex] ?? "") : "";
  const totalDuesPaidFromColumnC = rowValues[2] ?? "";
  const totalDuesPaid = (totalDuesPaidFromHeader || totalDuesPaidFromColumnC).trim();

  const profileColumns = headers
    .map((header, index) => ({ header, value: rowValues[index] ?? "" }))
    .filter((column, index) => index !== 0);

  const duesMonths = headers
    .map((header, index) => {
      const normalized = normalizeMonthHeader(header);
      return {
        normalized,
        rawValue: rowValues[index] ?? "",
      };
    })
    .filter((item): item is { normalized: string; rawValue: string } => Boolean(item.normalized));

  const valueByMonth = new Map<string, string>();
  duesMonths.forEach((item) => {
    valueByMonth.set(item.normalized, item.rawValue);
  });

  const canonicalMonths = buildMonthRange(2026, 0, 2028, 11);
  const fullDuesMonths = canonicalMonths.map((normalizedMonth) => {
    const rawValue = valueByMonth.get(normalizedMonth) ?? "";
    return {
      month: displayMonthHeader(normalizedMonth),
      rawValue,
      paid: rawValue.trim().toLowerCase() === "paid",
    };
  });

  return {
    id: email,
    familyName,
    primaryEmail: email,
    foundingFamily: true,
    totalDuesPaid,
    donations: buildDonationRecords(rowValues, headers, email),
    duesMonths: fullDuesMonths,
    profileColumns,
  };
};

export class GoogleSheetsProvider implements DataProvider {
  async getFamilyByEmail(email: string): Promise<FamilyProfile | null> {
    const normalizedEmail = normalizeEmailValue(email);
    const withConfiguredGid = await getGoogleVizData(env.googleSheetGid || undefined);
    const withoutGidFallback = env.googleSheetGid ? await getGoogleVizData(undefined) : null;

    const dataSets = [withConfiguredGid, withoutGidFallback].filter(Boolean) as Array<{
      headers: string[];
      values: string[][];
    }>;

    for (const { headers, values } of dataSets) {
      const row = values.find(
        (rowValues) => normalizeEmailValue(rowValues[0] ?? "") === normalizedEmail,
      );

      if (row) {
        return toFamilyProfile(headers, row);
      }
    }

    return null;
  }

  async getAllFamilies(params?: FamiliesQuery): Promise<FamilyProfile[]> {
    const { headers, values } = await getGoogleVizData(env.googleSheetGid || undefined);
    const query = params?.query?.trim().toLowerCase();

    const families = values
      .filter((rowValues) => Boolean((rowValues[0] ?? "").trim()))
      .map((rowValues) => toFamilyProfile(headers, rowValues));

    const filtered =
      query && query.length > 0
        ? families.filter(
            (family) =>
              family.familyName.toLowerCase().includes(query) ||
              family.primaryEmail.toLowerCase().includes(query),
          )
        : families;

    return filtered.sort((a, b) => a.familyName.localeCompare(b.familyName));
  }
}
