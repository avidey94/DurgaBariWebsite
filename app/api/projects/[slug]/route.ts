import { NextResponse } from "next/server";

import { getProjectDetailsBySlug, canAccessMemberContent, getCurrentFamilyPortalContext } from "@/lib/portal/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const familyContext = await getCurrentFamilyPortalContext();

  const details = await getProjectDetailsBySlug(slug, Boolean(familyContext && canAccessMemberContent(familyContext)));

  if (!details) {
    return NextResponse.json({ message: "Project not found." }, { status: 404 });
  }

  return NextResponse.json(details, { status: 200 });
}
