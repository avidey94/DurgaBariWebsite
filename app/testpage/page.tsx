import { notFound } from "next/navigation";

import { CmsEditableBlock } from "@/components/cms/CmsEditableBlock";
import { AdminVisibilityToggle } from "@/components/cms/AdminVisibilityToggle";
import { ContentHero, ContentModule, ContentPageFrame } from "@/components/content-page";
import { getCurrentUser } from "@/lib/auth/session";
import { getCmsPageContent } from "@/lib/cms/page-content";
import { parsePageVisibility } from "@/lib/cms/page-visibility";

export default async function TestPage() {
  const contentSlug = "testpage";
  const settingsSlug = "testpage-settings";

  const [user, cmsContent, cmsSettings] = await Promise.all([
    getCurrentUser(),
    getCmsPageContent(contentSlug),
    getCmsPageContent(settingsSlug),
  ]);

  const isAdmin = Boolean(user?.isAdmin);
  const isPublic = parsePageVisibility(cmsSettings?.content_html, false);

  if (!isPublic && !isAdmin) {
    notFound();
  }

  return (
    <ContentPageFrame>
      <ContentHero
        title="Test Page"
        subtitle="Simple CMS editing verification page"
        kicker="Admin QA"
      />

      <div className="mt-4 space-y-4">
        <ContentModule title="Hello World Block">
          {isAdmin ? <AdminVisibilityToggle slug={settingsSlug} initialPublic={isPublic} /> : null}

          <div className="mt-3">
            <CmsEditableBlock
              slug={contentSlug}
              initialTitle="Hello World"
              initialHtml={cmsContent?.content_html || "<p>Hello world</p>"}
              isAdmin={isAdmin}
            />
          </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
