import { ContentHero, ContentModule, ContentPageFrame } from "@/components/content-page";

export default function ContactPage() {
  return (
    <ContentPageFrame>
      <ContentHero title="Contact" subtitle="Get in touch with Durga Bari" kicker="Help Desk" />
      <div className="mt-4">
        <ContentModule title="Contact Form">
          <p className="mb-3">
            Use the official form below for questions, volunteering interest, and donation support.
          </p>
          <div className="border-[2px] border-[var(--db-border)] bg-white p-2">
            <iframe
              title="Durga Bari Contact Form"
              src="https://docs.google.com/forms/d/e/1FAIpQLSfW4TMdgsWg9SRWF4CBEZ0H5cwPEm99sFSwNkjzpuAN9Bciuw/viewform?embedded=true"
              className="w-full"
              height={1131}
              frameBorder={0}
              marginHeight={0}
              marginWidth={0}
            >
              Loading...
            </iframe>
          </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
