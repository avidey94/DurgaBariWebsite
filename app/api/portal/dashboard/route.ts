import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { getFamilyDashboardSummary } from "@/lib/portal/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const summary = await getFamilyDashboardSummary();

  if (!summary) {
    return NextResponse.json({ message: "Family profile not found." }, { status: 404 });
  }

  return NextResponse.json({ summary }, { status: 200 });
}
