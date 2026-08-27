import type { Language } from "@/lib/i18n";

const MAP_EMBED_URL = "https://maps.google.com/maps?q=2350%20Paragon%20Dr%2C%20San%20Jose%2C%20CA&t=m&z=17&output=embed&iwloc=near";
const JOURNEY_IMAGE_URL = "https://thedurgacenter.org/wp-content/uploads/2025/09/Orange-and-Violet-Process-Flow-Timelines-Concept-Map.png";

const copy = {
  en: {
    title: "Together, let’s build a home for Maa Durga and our community.",
    intro: "Durga Bari – Center for Spiritual and Cultural Excellence is a community initiative to create a sacred and cultural space where devotion and tradition come alive.",
    location: "Location: 2350 Paragon Dr, San Jose, CA 95131",
    mapTitle: "2350 Paragon Dr, San Jose, CA",
  },
  bn: {
    title: "আসুন, মা দুর্গা এবং আমাদের কমিউনিটির জন্য একটি স্থায়ী ঘর তৈরি করি।",
    intro: "দুর্গা বাড়ি – আধ্যাত্মিক ও সাংস্কৃতিক উৎকর্ষের কেন্দ্র হল এমন একটি কমিউনিটি উদ্যোগ যেখানে ভক্তি ও ঐতিহ্য জীবন্ত হয়ে ওঠে।",
    location: "ঠিকানা: 2350 Paragon Dr, San Jose, CA 95131",
    mapTitle: "২৩৫০ প্যারাগন ড্রাইভ, সান হোসে, ক্যালিফোর্নিয়া",
  },
} as const;

export function HomePageDurgacenter({ lang }: { lang: Language }) {
  const text = copy[lang];

  return (
    <section className="durgacenter-home">
      <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-12">
        <article className="durgacenter-content">
          <h1>{text.title}</h1>
          <p className="durgacenter-intro">{text.intro}</p>
          <p className="durgacenter-location">📍 {text.location}</p>
          <div className="durgacenter-map">
            <iframe loading="lazy" src={MAP_EMBED_URL} title={text.mapTitle} aria-label={text.mapTitle} />
          </div>
          <div className="durgacenter-journey">
            <img src={JOURNEY_IMAGE_URL} alt="Our Sacred Journey" />
          </div>
        </article>
      </div>
    </section>
  );
}
