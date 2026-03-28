import { NextResponse } from "next/server";

import { getCmsPageContent, upsertCmsPageContent } from "@/lib/cms/page-content";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugParam = searchParams.get("slug") ?? "";
  const slug = normalizeSlug(slugParam);

  if (!slug) {
    return NextResponse.json({ message: "slug is required" }, { status: 400 });
  }

  const page = await getCmsPageContent(slug);
  return NextResponse.json({ page }, { status: 200 });
}

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
    title?: string | null;
    contentHtml?: string;
  };

  const slug = normalizeSlug(body.slug ?? "");
  const contentHtml = (body.contentHtml ?? "").trim();

  if (!slug || !contentHtml) {
    return NextResponse.json({ message: "slug and contentHtml are required" }, { status: 400 });
  }

  try {
    const page = await upsertCmsPageContent({
      slug,
      title: body.title ?? null,
      contentHtml,
      updatedBy: access.familyId,
    });

    return NextResponse.json({ page }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to save CMS content." },
      { status: 500 },
    );
  }
}
