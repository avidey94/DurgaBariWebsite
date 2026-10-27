import { NextResponse } from "next/server";

import { listSpaceCalendarEntries, visibleSpaceCalendarEntries } from "@/lib/events/availability";
import { computeVisibilityForUser } from "@/lib/events/server";

export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month") ?? "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ message: "Choose a valid calendar month." }, { status: 400 });
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const fromDate = `${month}-01`;
  const toDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  try {
    const [entries, access] = await Promise.all([
      listSpaceCalendarEntries(fromDate, toDate),
      computeVisibilityForUser(),
    ]);
    return NextResponse.json(
      { entries: visibleSpaceCalendarEntries(entries, { admin: access.includePrivate, member: access.includeMembers }) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ message: "Could not load the calendar." }, { status: 503 });
  }
}
