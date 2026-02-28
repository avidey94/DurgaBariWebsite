import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { listCmsPageVersions } from "@/lib/cms/page-content";

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const slugParam = searchParams.get("slug") ?? "";
  const slug = normalizeSlug(slugParam);

  if (!slug) {
    return NextResponse.json({ message: "slug is required" }, { status: 400 });
  }

  const versions = await listCmsPageVersions(slug);
  return NextResponse.json({ versions }, { status: 200 });
}
