import { NextResponse } from "next/server";

import { rollbackCmsPageContentVersion } from "@/lib/cms/page-content";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

export async function POST(request: Request) {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPortalPermission(access.roles, "cms.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    slug?: string;
    versionId?: string;
  };

  const slug = normalizeSlug(body.slug ?? "");
  const versionId = (body.versionId ?? "").trim();

  if (!slug || !versionId) {
    return NextResponse.json({ message: "slug and versionId are required" }, { status: 400 });
  }

  try {
    const page = await rollbackCmsPageContentVersion({
      slug,
      versionId,
      updatedBy: access.familyId,
    });

    return NextResponse.json({ page }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to rollback CMS content." },
      { status: 500 },
    );
  }
}
