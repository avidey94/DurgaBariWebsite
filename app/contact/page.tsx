import { ContentHero, ContentModule, ContentPageFrame } from "@/components/content-page";
import { CmsEditableBlock } from "@/components/cms/CmsEditableBlock";
import { canCurrentUserManageCms } from "@/lib/cms/access";
import { getCmsPageContent } from "@/lib/cms/page-content";
import { resolveLanguage } from "@/lib/i18n";

interface ContactPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const isBn = lang === "bn";
  const cmsSlug = lang === "bn" ? "contact-bn" : "contact";
  const [canManageCms, cmsIntro] = await Promise.all([canCurrentUserManageCms(), getCmsPageContent(cmsSlug)]);
  const contactIntroDefaultHtml = isBn
    ? "<p>প্রশ্ন, স্বেচ্ছাসেবক হিসেবে আগ্রহ এবং দান সংক্রান্ত সহায়তার জন্য নিচের অফিসিয়াল ফর্মটি ব্যবহার করুন।</p>"
    : "<p>Use the official form below for questions, volunteering interest, and donation support.</p>";

  return (
    <ContentPageFrame>
      <ContentHero
        title={isBn ? "যোগাযোগ" : "Contact"}
        subtitle={isBn ? "দুর্গা বাড়ির সাথে যোগাযোগ করুন" : "Get in touch with Durga Bari"}
        kicker={isBn ? "সহায়তা ডেস্ক" : "Help Desk"}
      />
      <div className="mt-4">
        <ContentModule title={isBn ? "যোগাযোগ ফর্ম" : "Contact Form"}>
          <div className="mb-3">
            <CmsEditableBlock
              slug={cmsSlug}
              initialTitle={isBn ? "যোগাযোগ ফর্ম" : "Contact Form"}
              initialHtml={cmsIntro?.content_html || contactIntroDefaultHtml}
              isAdmin={canManageCms}
            />
          </div>
          <div className="border-[2px] border-[var(--db-border)] bg-white p-2">
            <iframe
              title={isBn ? "দুর্গা বাড়ি যোগাযোগ ফর্ম" : "Durga Bari Contact Form"}
              src="https://docs.google.com/forms/d/e/1FAIpQLSfW4TMdgsWg9SRWF4CBEZ0H5cwPEm99sFSwNkjzpuAN9Bciuw/viewform?embedded=true"
              className="w-full"
              height={1131}
              frameBorder={0}
              marginHeight={0}
              marginWidth={0}
            >
              {isBn ? "লোড হচ্ছে..." : "Loading..."}
            </iframe>
          </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
