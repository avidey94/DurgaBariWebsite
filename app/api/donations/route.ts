import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { dataProvider } from "@/lib/data";
import type { DonationApiResponse } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const family = await dataProvider.getFamilyByEmail(user.email);

  if (!family) {
    return NextResponse.json({ message: "Family record not found" }, { status: 404 });
  }

  const response: DonationApiResponse = {
    family: {
      id: family.id,
      familyName: family.familyName,
      primaryEmail: family.primaryEmail,
      foundingFamily: family.foundingFamily,
    },
    donations: family.donations,
  };

  return NextResponse.json(response);
}
