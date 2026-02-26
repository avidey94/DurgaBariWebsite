import { ContentHero, ContentModule, ContentPageFrame, ContentPlaceholder } from "@/components/content-page";
import { resolveLanguage } from "@/lib/i18n";

interface AboutPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const isBn = lang === "bn";

  return (
    <ContentPageFrame>
      <ContentHero
        title={isBn ? "দুর্গা বাড়ি পরিচিতি" : "About Durga Bari"}
        subtitle={
          isBn
            ? "আধ্যাত্মিক ও সাংস্কৃতিক উৎকর্ষের কেন্দ্র"
            : "Center for Spiritual and Cultural Excellence"
        }
        kicker={isBn ? "আমাদের ভিত্তি" : "Our Foundation"}
      />

      <div className="mt-4 space-y-4">
        <ContentModule title={isBn ? "আমরা কারা" : "Who We Are"}>
          <p>
            {isBn
              ? "দুর্গা বাড়ি - Center for Spiritual and Cultural Excellence একটি কমিউনিটি উদ্যোগ, যেখানে মা দুর্গাকে কেন্দ্র করে ভক্তি, সংস্কৃতি ও সমাজ একসূত্রে মিলবে।"
              : "Durga Bari - Center for Spiritual and Cultural Excellence is a community initiative to establish a sacred space dedicated to Maa Durga, where devotion, culture, and community come together as one."}
          </p>

          <p className="mt-2">
            {isBn
              ? "আমাদের কল্পনায় দুর্গা বাড়ি শুধু একটি মন্দির নয়। এটি হবে প্রার্থনা, উপাসনা ও আধ্যাত্মিক বিকাশের ঘর, পাশাপাশি সাংস্কৃতিক অনুষ্ঠান, তরুণদের শিক্ষা এবং কমিউনিটি মিলনের প্রাণকেন্দ্র।"
              : "We envision Durga Bari as more than just a temple. It will be a home for prayer, worship, and spiritual growth, while also serving as a vibrant hub for cultural programs, youth education, and community gatherings."}
          </p>

          <div className="mt-3 border-[2px] border-[#3d6148] bg-[#dde9de] p-3">
            <p className="font-bold">
              {isBn ? "আমাদের লক্ষ্য সহজ, কিন্তু গভীর:" : "Our mission is simple yet profound:"}
            </p>
            <ul className="mt-2 space-y-1">
              <li className="flex gap-2">
                <span className="text-[#9b1616]">▸</span>
                <span>
                  {isBn
                    ? "রাজনীতি, অহং ও বিভাজনমুক্ত একটি পূজাস্থল তৈরি করা।"
                    : "To create a place of worship free from politics, ego, and division."}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#9b1616]">▸</span>
                <span>
                  {isBn
                    ? "আমাদের ঐতিহ্য, উৎসব ও উত্তরাধিকার সংরক্ষণ ও উদযাপন করা।"
                    : "To preserve and celebrate our rich traditions, festivals, and heritage."}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#9b1616]">▸</span>
                <span>
                  {isBn
                    ? "মা দুর্গার আশীর্বাদে সবাইকে এক পরিবারের মতো একতাবদ্ধ করা।"
                    : "To unite the community as one family under the blessings of Maa Durga."}
                </span>
              </li>
            </ul>
          </div>

          <p className="mt-2">
            {isBn
              ? "দুর্গা বাড়ি বর্তমানে প্রি-ইনিশিয়েশন পর্যায়ে রয়েছে। আমরা সংগঠন গঠন, কমিউনিটির ঐক্যমত তৈরি এবং প্রথম সম্মিলিত পূজার পরিকল্পনার মাধ্যমে ভিত্তি তৈরি করছি। ধাপে ধাপে আমরা স্থায়ী মন্দির ও সাংস্কৃতিক কেন্দ্র গড়ে তোলার লক্ষ্যে এগিয়ে যাব।"
              : "Durga Bari is currently in its Pre-Initiation Phase. We are laying the foundation by forming the organization, building community consensus, and planning for our first collective puja. Together, step by step, we will move toward our ultimate goal - building a permanent temple and cultural center for generations to come."}
          </p>
        </ContentModule>

        <div className="grid gap-4 md:grid-cols-2">
          <ContentPlaceholder
            label={isBn ? "মন্দিরের ভাবনা" : "Temple Vision"}
            sublabel={isBn ? "ভবিষ্যৎ গর্ভগৃহ ও প্রার্থনা হলের ধারণা" : "Future sanctum and prayer hall concept"}
          />
          <ContentPlaceholder
            label={isBn ? "সাংস্কৃতিক অঙ্গন" : "Cultural Wing"}
            sublabel={isBn ? "তরুণ, ভাষা ও ঐতিহ্যভিত্তিক কর্মসূচি" : "Youth, language, and heritage programming"}
          />
        </div>

        <ContentModule title={isBn ? "যাত্রায় যুক্ত হোন" : "Join the Journey"} tone="red">
          <div className="border-l-4 border-[var(--db-brand)] bg-[#edf3ea] px-3 py-2">
            <strong>
              {isBn
                ? "এই পবিত্র যাত্রায় আমাদের সঙ্গে থাকুন"
                : "We invite you to join us on this sacred journey"}
            </strong>{" "}
            {isBn
              ? "- স্বেচ্ছাসেবক, দাতা ও শুভানুধ্যায়ী হিসেবে। আজকের আপনার সহায়তাই আগামীর দুর্গা বাড়ির ভিত্তিপ্রস্তর হবে।"
              : "- as volunteers, donors, and well-wishers. Your support today will become the cornerstone of Durga Bari tomorrow."}
          </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
