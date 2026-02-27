import { ContentHero, ContentModule, ContentPageFrame, ContentPlaceholder } from "@/components/content-page";
import { CmsEditableBlock } from "@/components/cms/CmsEditableBlock";
import { getCurrentUser } from "@/lib/auth/session";
import { getCmsPageContent } from "@/lib/cms/page-content";
import { resolveLanguage } from "@/lib/i18n";

const festivalSections = {
  en: [
    "Major Hindu Festivals - Durga Puja, Kali Puja, Saraswati Puja, Diwali, Holi, and more.",
    "Special Observances - Monthly pujas, sacred rituals, spiritual discourses, and collective prayers.",
    "Cultural Celebrations - Music, dance, language, and traditions that reflect our Bengali and broader Hindu heritage.",
    "Community Events - Family gatherings, youth activities, educational workshops, and social service programs.",
  ],
  bn: [
    "প্রধান হিন্দু উৎসব - দুর্গাপূজা, কালীপূজা, সরস্বতী পূজা, দীপাবলি, হোলি এবং আরও অনেক কিছু।",
    "বিশেষ আচার - মাসিক পূজা, পবিত্র আচার, আধ্যাত্মিক আলোচনা ও সম্মিলিত প্রার্থনা।",
    "সাংস্কৃতিক উদযাপন - সঙ্গীত, নৃত্য, ভাষা ও ঐতিহ্য, যা আমাদের বাঙালি ও বৃহত্তর হিন্দু উত্তরাধিকারের প্রতিফলন।",
    "কমিউনিটি অনুষ্ঠান - পারিবারিক মিলন, তরুণ কার্যক্রম, শিক্ষামূলক কর্মশালা ও সামাজিক সেবামূলক প্রোগ্রাম।",
  ],
} as const;

interface EventsFestivalsPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function EventsFestivalsPage({ searchParams }: EventsFestivalsPageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const isBn = lang === "bn";
  const cmsSlug = lang === "bn" ? "events-festivals-bn" : "events-festivals";
  const [user, cmsIntro] = await Promise.all([getCurrentUser(), getCmsPageContent(cmsSlug)]);
  const eventsIntroDefaultHtml = isBn
    ? "<p>দুর্গা বাড়ি একদিন এমন প্রাণবন্ত কেন্দ্র হবে যেখানে আমরা সবাই এক পরিবার হিসেবে আমাদের ঐতিহ্য উদযাপন করব, দেবদেবীর আরাধনা করব এবং সংস্কৃতির আনন্দ ভাগ করে নেব।</p>"
    : "<p>Durga Bari will one day be a vibrant center where we come together as one family to celebrate our traditions, honor our deities, and rejoice in our cultural heritage.</p>";

  return (
    <ContentPageFrame>
      <ContentHero
        title={isBn ? "ইভেন্ট ও উৎসব" : "Events & Festivals"}
        subtitle={isBn ? "ভক্তি, উদযাপন ও কমিউনিটির মিলন" : "Devotion, Celebration, and Community Togetherness"}
        kicker={isBn ? "মৌসুমি ক্যালেন্ডার" : "Seasonal Calendar"}
      />

      <div className="mt-4 space-y-4">
        <ContentModule title={isBn ? "উদযাপন নিয়ে আমাদের ভাবনা" : "Our Vision for Celebrations"}>
          <CmsEditableBlock
            slug={cmsSlug}
            initialTitle={isBn ? "উদযাপন নিয়ে আমাদের ভাবনা" : "Our Vision for Celebrations"}
            initialHtml={cmsIntro?.content_html || eventsIntroDefaultHtml}
            isAdmin={Boolean(user?.isAdmin)}
          />

          <p className="mt-2">
            {isBn
              ? "এই প্রারম্ভিক পর্যায়ে আমরা মন্দির প্রতিষ্ঠার কাজ করছি এবং ভক্তি ও কমিউনিটি মিলনের জন্য পবিত্র স্থান তৈরির ভিত্তি গড়ছি। দুর্গা বাড়ি নির্মিত হলে, এই পাতায় আপনি দেখবেন:"
              : "At this early stage, we are establishing the temple and laying the foundation for a sacred space of devotion and community gathering. Once Durga Bari is built, this page will share details of:"}
          </p>

          <div className="mt-3 border-[2px] border-[#3d6148] bg-[#dde9de] p-3">
            <ul className="space-y-2">
              {festivalSections[lang].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#9b1616]">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </ContentModule>

        <div className="grid gap-4 md:grid-cols-2">
          <ContentPlaceholder
            label={isBn ? "উৎসব মঞ্চ" : "Festival Stage"}
            sublabel={isBn ? "ভবিষ্যৎ পূজা ও সাংস্কৃতিক পরিবেশনার স্থান" : "Future puja and cultural performance area"}
          />
          <ContentPlaceholder
            label={isBn ? "কমিউনিটি হল" : "Community Hall"}
            sublabel={isBn ? "সম্মিলিত প্রার্থনা ও উদযাপনের স্থান" : "Shared prayer and celebration space"}
          />
        </div>

        <ContentModule title={isBn ? "সংযুক্ত থাকুন" : "Stay Connected"} tone="red">
          <p>
            {isBn
              ? "ততদিন পর্যন্ত, এই স্বপ্ন বাস্তবায়নে আমাদের সঙ্গে হাতে হাত রেখে চলার আমন্ত্রণ রইল। আপনার সহায়তায় দুর্গা বাড়ি একদিন ভক্তি, আনন্দ ও মিলনের উৎসবে ভরে উঠবে।"
              : "Until then, we warmly invite you to join hands in helping us realize this dream. With your support, Durga Bari will become the place where these festivals are celebrated with devotion, joy, and togetherness."}
          </p>
          <div className="mt-3 border-l-4 border-[var(--db-brand)] bg-[#edf3ea] px-3 py-2">
            <strong>{isBn ? "সংযুক্ত থাকুন:" : "Stay connected:"}</strong>{" "}
            {isBn
              ? "আপডেট পেতে এবং আমাদের প্রতিষ্ঠাতা পরিবারের অংশ হতে অনুগ্রহ করে যোগাযোগ করুন।"
              : "Please contact us to receive updates and to be part of our founding family."}
          </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
