import { NextResponse } from "next/server";

import { listCmsPageVersions } from "@/lib/cms/page-content";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

export async function GET(request: Request) {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "cms.manage")) {
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
