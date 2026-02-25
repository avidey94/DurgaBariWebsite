import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { dataProvider } from "@/lib/data";
import type { FamiliesApiResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  const families = await dataProvider.getAllFamilies({ query });

  const response: FamiliesApiResponse = {
    families,
  };

  return NextResponse.json(response);
}
