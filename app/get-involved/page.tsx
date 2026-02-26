import { ContentHero, ContentModule, ContentPageFrame, ContentPlaceholder } from "@/components/content-page";
import { resolveLanguage } from "@/lib/i18n";

const helpNowItems = {
  en: [
    {
      title: "Awareness Ambassadors",
      body: "Share the vision of Durga Mandir with your friends, family, and networks. Help us reach more people who may wish to be part of this noble mission.",
    },
    {
      title: "Fundraising Volunteers",
      body: "Assist in organizing fundraising events, campaigns, and donor outreach. Every effort counts in making this dream a reality.",
    },
    {
      title: "Patron & Sponsor Outreach",
      body: "Help us connect with patrons and well-wishers who can provide long-term support for the Mandir.",
    },
  ],
  bn: [
    {
      title: "সচেতনতা দূত",
      body: "বন্ধু, পরিবার ও পরিচিতদের মধ্যে দুর্গা মন্দিরের ভাবনা ছড়িয়ে দিন। এই মহৎ উদ্যোগে যুক্ত হতে আগ্রহী আরও মানুষের কাছে পৌঁছাতে আমাদের সাহায্য করুন।",
    },
    {
      title: "তহবিল সংগ্রহ স্বেচ্ছাসেবক",
      body: "ফান্ডরেইজিং ইভেন্ট, ক্যাম্পেইন ও দাতা সংযোগে সহায়তা করুন। স্বপ্নকে বাস্তবে রূপ দিতে প্রতিটি প্রচেষ্টাই গুরুত্বপূর্ণ।",
    },
    {
      title: "প্যাট্রন ও স্পন্সর সংযোগ",
      body: "মন্দিরের দীর্ঘমেয়াদি সহায়তার জন্য প্যাট্রন ও শুভানুধ্যায়ীদের সঙ্গে আমাদের সংযোগ স্থাপনে সাহায্য করুন।",
    },
  ],
} as const;

const futureItems = {
  en: [
    "Supporting temple rituals and daily operations",
    "Assisting in cultural and educational programs",
    "Organizing festivals and community events",
    "Maintaining the sanctity and beauty of the temple",
  ],
  bn: [
    "মন্দিরের আচার ও দৈনন্দিন কার্যক্রমে সহায়তা",
    "সাংস্কৃতিক ও শিক্ষামূলক প্রোগ্রামে সহযোগিতা",
    "উৎসব ও কমিউনিটি ইভেন্ট আয়োজনে ভূমিকা",
    "মন্দিরের পবিত্রতা ও সৌন্দর্য রক্ষণাবেক্ষণ",
  ],
} as const;

interface GetInvolvedPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function GetInvolvedPage({ searchParams }: GetInvolvedPageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const isBn = lang === "bn";

  return (
    <ContentPageFrame>
      <ContentHero
        title={isBn ? "যুক্ত হোন" : "Get Involved"}
        subtitle={isBn ? "পবিত্র ও স্থায়ী উদ্যোগের অংশ হোন" : "Be Part of Something Sacred and Lasting"}
        kicker={isBn ? "কমিউনিটি উদ্যোগ" : "Community Action"}
      />

      <div className="mt-4 space-y-4">
        <ContentModule title={isBn ? "মিশনে যুক্ত হোন" : "Join the Mission"}>
          <p>
            {isBn
              ? "দুর্গা মন্দির শুধু একটি মন্দির নয় - এটি আধ্যাত্মিকতা, সংস্কৃতি ও কমিউনিটির জীবন্ত কেন্দ্র। আপনার অংশগ্রহণ এই ভাবনাকে বাস্তবে রূপ দেয়। একসঙ্গে আমরা এমন পবিত্র স্থান গড়তে পারি যেখানে বিশ্বাস, সংস্কৃতি ও ঐক্য বিকশিত হবে।"
              : "Durga Mandir is more than a temple - it is a living center of spirituality, culture, and community. Your participation helps bring this vision to life. Together, we can create a sacred space where faith, culture, and unity flourish."}
          </p>

          <div className="mt-3 border-[2px] border-[#3d6148] bg-[#dde9de] p-3">
            <h3 className="font-serif text-[28px] font-bold text-[#12271d]">
              {isBn ? "এখনই যেভাবে সাহায্য করতে পারেন" : "How You Can Help Now"}
            </h3>
            <ol className="mt-2 space-y-3">
              {helpNowItems[lang].map((item, index) => (
                <li key={item.title} className="border-l-4 border-[#9b1616] bg-[#eef4ec] px-3 py-2">
                  <p className="font-bold text-[#1f2a22]">
                    {index + 1}. {item.title}
                  </p>
                  <p>{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </ContentModule>

        <div className="grid gap-4 md:grid-cols-2">
          <ContentPlaceholder
            label={isBn ? "স্বেচ্ছাসেবক ডেস্ক" : "Volunteer Desk"}
            sublabel={isBn ? "উৎসব ও প্রোগ্রাম সমন্বয় কেন্দ্র" : "Festival and program coordination hub"}
          />
          <ContentPlaceholder
            label={isBn ? "ইয়ুথ সেবা" : "Youth Seva"}
            sublabel={isBn ? "তরুণ সদস্যদের ভবিষ্যৎ স্বেচ্ছাসেবক পথ" : "Future volunteer pathway for younger members"}
          />
        </div>

        <ContentModule title={isBn ? "আগামীর পরিকল্পনা" : "Looking Ahead"} tone="red">
          <p>{isBn ? "মন্দির বড় হওয়ার সঙ্গে সঙ্গে স্বেচ্ছাসেবার সুযোগ বাড়বে:" : "As the Mandir grows, volunteer opportunities will expand into:"}</p>
          <ul className="mt-2 space-y-1">
            {futureItems[lang].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#9b1616]">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 border-l-4 border-[var(--db-brand)] bg-[#edf3ea] px-3 py-2">
            <strong>{isBn ? "যোগাযোগ করুন:" : "Contact Us:"}</strong>{" "}
            {isBn ? "যুক্ত হতে আগ্রহী হলে আমাদের ইমেইল করুন" : "If you are interested in getting involved, please email us"}{" "}
            <strong>info@thedurgacenter.org</strong>.
          </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
