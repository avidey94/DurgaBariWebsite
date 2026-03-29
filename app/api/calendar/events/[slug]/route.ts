import { NextResponse } from "next/server";

import { getEventBySlug, computeVisibilityForUser } from "@/lib/events/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const visibility = await computeVisibilityForUser();
  const event = await getEventBySlug(slug, {
    includePrivate: visibility.includePrivate,
    includeMembers: visibility.includeMembers,
  });

  if (!event) {
    return NextResponse.json({ message: "Event not found." }, { status: 404 });
  }

  if (event.visibility === "members" && !visibility.includeMembers) {
    return NextResponse.json({ message: "Members-only event." }, { status: 403 });
  }

  return NextResponse.json({ event }, { status: 200 });
}
