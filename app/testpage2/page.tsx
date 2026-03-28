import { CmsEditableBlock } from "@/components/cms/CmsEditableBlock";
import { ContentHero, ContentModule, ContentPageFrame } from "@/components/content-page";
import { canCurrentUserManageCms } from "@/lib/cms/access";
import { getCmsPageContent } from "@/lib/cms/page-content";

export default async function TestPage2() {
  const slug = "testpage2";
  const [canManageCms, cmsContent] = await Promise.all([canCurrentUserManageCms(), getCmsPageContent(slug)]);

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
            isAdmin={canManageCms}
          />
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
