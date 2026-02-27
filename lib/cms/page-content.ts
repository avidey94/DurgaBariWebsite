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

  return data as CmsPageContent;
};
