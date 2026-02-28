import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { sanitizeHtml } from "@/lib/cms/sanitize-html";

export interface CmsPageContent {
  id: string;
  slug: string;
  title: string | null;
  content_html: string;
  updated_at: string;
  updated_by: string | null;
}

export interface CmsPageVersion {
  id: string;
  page_content_id: string | null;
  slug: string;
  title: string | null;
  content_html: string;
  created_at: string;
  created_by: string | null;
}

const createCmsPageVersion = async ({
  pageContentId,
  slug,
  title,
  contentHtml,
  createdBy,
}: {
  pageContentId?: string | null;
  slug: string;
  title?: string | null;
  contentHtml: string;
  createdBy?: string | null;
}) => {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for CMS writes.");
  }

  const { error } = await supabase.from("page_content_versions").insert({
    page_content_id: pageContentId ?? null,
    slug,
    title: title ?? null,
    content_html: contentHtml,
    created_by: createdBy ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const getCmsPageContent = async (slug: string): Promise<CmsPageContent | null> => {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("page_content")
    .select("id, slug, title, content_html, updated_at, updated_by")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
};

export const upsertCmsPageContent = async ({
  slug,
  title,
  contentHtml,
  updatedBy,
}: {
  slug: string;
  title?: string | null;
  contentHtml: string;
  updatedBy?: string | null;
}) => {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for CMS writes.");
  }

  const sanitizedContent = sanitizeHtml(contentHtml);
  const { data: existing } = await supabase
    .from("page_content")
    .select("id, slug, title, content_html, updated_at, updated_by")
    .eq("slug", slug)
    .maybeSingle();

  const { data, error } = await supabase
    .from("page_content")
    .upsert(
      {
        slug,
        title: title ?? null,
        content_html: sanitizedContent,
        updated_by: updatedBy ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    )
    .select("id, slug, title, content_html, updated_at, updated_by")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const saved = data as CmsPageContent;

  if (existing?.content_html !== saved.content_html || existing?.title !== saved.title) {
    await createCmsPageVersion({
      pageContentId: saved.id,
      slug: saved.slug,
      title: saved.title,
      contentHtml: saved.content_html,
      createdBy: updatedBy ?? null,
    });
  }

  return saved;
};

export const listCmsPageVersions = async (slug: string, limit = 30): Promise<CmsPageVersion[]> => {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("page_content_versions")
    .select("id, page_content_id, slug, title, content_html, created_at, created_by")
    .eq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []) as CmsPageVersion[];
};

export const rollbackCmsPageContentVersion = async ({
  slug,
  versionId,
  updatedBy,
}: {
  slug: string;
  versionId: string;
  updatedBy?: string | null;
}) => {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for CMS writes.");
  }

  const { data: version, error } = await supabase
    .from("page_content_versions")
    .select("id, page_content_id, slug, title, content_html, created_at, created_by")
    .eq("slug", slug)
    .eq("id", versionId)
    .maybeSingle();

  if (error || !version) {
    throw new Error("Version not found for this slug.");
  }

  return upsertCmsPageContent({
    slug,
    title: version.title ?? null,
    contentHtml: version.content_html,
    updatedBy: updatedBy ?? null,
  });
};
