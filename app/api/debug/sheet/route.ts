import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { dataProvider } from "@/lib/data";

export async function GET(request: NextRequest) {
  if (env.nodeEnv === "production") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";

  try {
    const families = await dataProvider.getAllFamilies();
    const emails = families.map((family) => family.primaryEmail).filter(Boolean);
    const hasEmail = email ? emails.includes(email) : false;

    return NextResponse.json(
      {
        provider: env.dataProvider,
        spreadsheetId: env.googleSheetId,
        gid: env.googleSheetGid,
        requestedEmail: email || null,
        hasRequestedEmail: hasEmail,
        rowCount: families.length,
        sampleEmails: emails.slice(0, 25),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        provider: env.dataProvider,
        spreadsheetId: env.googleSheetId,
        gid: env.googleSheetGid,
        requestedEmail: email || null,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
