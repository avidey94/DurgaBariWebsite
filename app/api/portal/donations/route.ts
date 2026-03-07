import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentFamilyPortalContext, listFamilyDonations } from "@/lib/portal/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const context = await getCurrentFamilyPortalContext();

  if (!context) {
    return NextResponse.json({ message: "Family profile not found." }, { status: 404 });
  }

  const donations = await listFamilyDonations(context.family.id, 200);

  return NextResponse.json(
    {
      family: context.family,
      roles: context.roles,
      donations,
    },
    { status: 200 },
  );
}
