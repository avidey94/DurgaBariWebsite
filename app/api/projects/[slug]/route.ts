import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { getProjectDetailsBySlug } from "@/lib/portal/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const user = await getCurrentUser();

  const details = await getProjectDetailsBySlug(slug, Boolean(user));

  if (!details) {
    return NextResponse.json({ message: "Project not found." }, { status: 404 });
  }

  return NextResponse.json(details, { status: 200 });
}
