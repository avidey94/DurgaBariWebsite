import { CmsEditableBlock } from "@/components/cms/CmsEditableBlock";
import { ContentHero, ContentModule, ContentPageFrame } from "@/components/content-page";
import { getCurrentUser } from "@/lib/auth/session";
import { getCmsPageContent } from "@/lib/cms/page-content";

export default async function TestPage2() {
  const slug = "testpage2";
  const [user, cmsContent] = await Promise.all([getCurrentUser(), getCmsPageContent(slug)]);

  return (
    <ContentPageFrame>
      <ContentHero
        title="Test Page 2"
        subtitle="CMS creation verification page"
        kicker="Admin QA"
      />

      <div className="mt-4">
        <ContentModule title="Placeholder Content">
          <CmsEditableBlock
            slug={slug}
            initialTitle="Placeholder Content"
            initialHtml={cmsContent?.content_html || "<p>good evening world</p>"}
            isAdmin={Boolean(user?.isAdmin)}
          />
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
