import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/session";
import { listCalendarEvents } from "@/lib/events/server";
import { env } from "@/lib/env";
import { withLang, type Language } from "@/lib/i18n";

const JOURNEY_IMAGE_URL =
  "https://thedurgacenter.org/wp-content/uploads/2025/09/Orange-and-Violet-Process-Flow-Timelines-Concept-Map.png";
const LOCATION_LABEL = "2350 Paragon Dr, San Jose, CA 95131";
const MAP_EMBED_URL =
  "https://www.google.com/maps?q=2350%20Paragon%20Dr%2C%20San%20Jose%2C%20CA%2095131&z=15&output=embed";
const MAP_LINK_URL = "https://maps.google.com/?q=2350+Paragon+Dr,+San+Jose,+CA+95131";

const copy = {
  en: {
    heroTitle: "Together, let's build a home for Maa Durga and our community.",
    heroBody:
      "Durga Bari - Center for Spiritual and Cultural Excellence is a community initiative to create a sacred and cultural space where devotion and tradition come alive.",
    locationLabel: "Location",
    mapLink: "Open in Google Maps",
    sacredJourney: "Our Sacred Journey",
    sacredJourneyBody:
      "From the foundation stage to a permanent temple, this timeline reflects the long-term effort to establish a sacred center for worship, culture, and community life.",
    upcoming: "Upcoming Events",
    upcomingBody: "The next three events from our public calendar.",
    noEvents: "No upcoming public events are published yet.",
    viewAllEvents: "View All Events",
    liveStream: "Live Stream",
    liveStreamBody: "Watch temple events and broadcasts live here.",
    liveStreamPlaceholder: "Set NEXT_PUBLIC_YOUTUBE_LIVE_EMBED_URL to enable the livestream player.",
    portalKicker: "Members",
    portalBody:
      "Access donations, pledge management, volunteer signup, and family account updates from one place.",
    portalPrimary: "Open Member Portal",
    portalSecondary: "Member Login",
    eventCta: "View Event",
  },
  bn: {
    heroTitle: "আসুন, মা দুর্গা এবং আমাদের কমিউনিটির জন্য একটি স্থায়ী ঘর তৈরি করি।",
    heroBody:
      "দুর্গা বাড়ি - আধ্যাত্মিক ও সাংস্কৃতিক উৎকর্ষের কেন্দ্র হল এমন একটি কমিউনিটি উদ্যোগ যেখানে ভক্তি, ঐতিহ্য এবং সাংস্কৃতিক জীবন একসাথে বিকশিত হবে।",
    locationLabel: "ঠিকানা",
    mapLink: "গুগল ম্যাপে খুলুন",
    sacredJourney: "আমাদের পবিত্র যাত্রা",
    sacredJourneyBody:
      "ভিত্তি নির্মাণ থেকে স্থায়ী মন্দির পর্যন্ত, এই সময়রেখা উপাসনা, সংস্কৃতি এবং কমিউনিটি জীবনের জন্য একটি পবিত্র কেন্দ্র গড়ে তোলার দীর্ঘমেয়াদি প্রচেষ্টা তুলে ধরে।",
    upcoming: "আসন্ন ইভেন্ট",
    upcomingBody: "আমাদের পাবলিক ক্যালেন্ডারের পরবর্তী তিনটি ইভেন্ট।",
    noEvents: "এখনও কোনো আসন্ন পাবলিক ইভেন্ট প্রকাশিত হয়নি।",
    viewAllEvents: "সব ইভেন্ট দেখুন",
    liveStream: "লাইভ সম্প্রচার",
    liveStreamBody: "মন্দির অনুষ্ঠান ও সম্প্রচারের লাইভ ভিডিও এখানে দেখুন।",
    liveStreamPlaceholder: "লাইভ স্ট্রিম চালু করতে NEXT_PUBLIC_YOUTUBE_LIVE_EMBED_URL সেট করুন।",
    portalKicker: "সদস্য",
    portalBody:
      "দান, pledge ব্যবস্থাপনা, স্বেচ্ছাসেবক নিবন্ধন এবং পরিবার প্রোফাইল আপডেটের জন্য এক জায়গায় প্রবেশ করুন।",
    portalPrimary: "সদস্য পোর্টাল খুলুন",
    portalSecondary: "সদস্য লগইন",
    eventCta: "ইভেন্ট দেখুন",
  },
} as const;

const eventDateLabel = (iso: string, lang: "en" | "bn") =>
  new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export async function HomePageRevamp({ lang }: { lang: Language }) {
  const text = copy[lang];
  const user = await getCurrentUser();
  const youtubeLiveEmbedUrl = env.youtubeLiveEmbedUrl.trim();
  const now = new Date();
  const upcomingEvents = (await listCalendarEvents({
    includeDraft: false,
    includePrivate: false,
    includeMembers: false,
    fromIso: now.toISOString(),
    toIso: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  })).slice(0, 3);

  return (
    <section className="bg-[#f8e7de] pb-16">
      <div className="mx-auto max-w-[1240px] px-6 py-10 md:px-10 md:py-16">
        <div className="rounded-[28px] bg-[linear-gradient(180deg,#fff1ea_0%,#f8e7de_100%)] px-7 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_40px_rgba(104,33,21,0.09)] md:px-12 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_360px] lg:items-start">
            <div className="order-1 lg:order-1">
              <p className="text-[1.04rem] font-bold uppercase tracking-[0.36em] text-[#b65a42] md:text-[1.12rem]">
                Durga Bari Bay Area
              </p>
              <h1 className="mt-4 max-w-4xl font-serif text-[clamp(1.7rem,3.75vw,2.95rem)] font-bold leading-[1.08] text-[#1e2437]">
                {text.heroTitle}
              </h1>
              <p className="mt-6 max-w-4xl text-[clamp(1.12rem,1.95vw,1.52rem)] leading-10 text-[#495264]">
                {text.heroBody}
              </p>
            </div>

            <aside className="order-2 rounded-[26px] border border-[#e6c7b6] bg-[linear-gradient(180deg,#fff8f3_0%,#f7ecdf_100%)] p-6 shadow-[0_14px_30px_rgba(125,64,36,0.08)] lg:order-2">
              <p className="text-[1.02rem] font-bold uppercase tracking-[0.36em] text-[#7a2e1f] md:text-[1.1rem]">
                {text.portalKicker}
              </p>
              <p className="mt-4 text-[1.04rem] leading-8 text-[#495264]">{text.portalBody}</p>
              <div className="mt-6">
                {user ? (
                  <Link
                    href={withLang("/portal", lang)}
                    className="block rounded-xl border border-[#6b2a00] bg-[#f3b53a] px-5 py-3 text-center text-base font-semibold text-[#132a1f] no-underline hover:bg-[#f1c15d]"
                  >
                    {text.portalPrimary}
                  </Link>
                ) : (
                  <Link
                    href={withLang("/login", lang)}
                    className="block rounded-xl border border-[#6b2a00] bg-[#f3b53a] px-5 py-3 text-center text-base font-semibold text-[#132a1f] no-underline hover:bg-[#f1c15d]"
                  >
                    {text.portalSecondary}
                  </Link>
                )}
              </div>
            </aside>

            <div className="order-3 lg:order-3 lg:col-start-1">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e6c7b6] bg-white/82 px-5 py-4 text-[1.04rem] text-[#4e5768] shadow-[0_10px_22px_rgba(87,44,33,0.06)]">
                <span className="text-xl text-[#b65a42]">📍</span>
                <span>
                  <strong>{text.locationLabel}:</strong> {LOCATION_LABEL}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-[24px] border border-[#efc5b9] bg-white shadow-[0_14px_34px_rgba(103,51,35,0.08)]">
            <iframe
              title="Durga Bari Bay Area location map"
              src={MAP_EMBED_URL}
              className="h-[320px] w-full md:h-[380px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="mt-3 text-right">
            <a
              href={MAP_LINK_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#d69e7b] bg-white px-4 py-2 text-sm font-semibold text-[#8e3b22] no-underline hover:bg-[#fff7f2]"
            >
              {text.mapLink}
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_380px]">
          <section className="rounded-[28px] bg-[#fff7ef] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_14px_30px_rgba(78,35,28,0.09)] md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b65a42]">Temple Journey</p>
                <h2 className="mt-2 font-serif text-[clamp(2.2rem,4vw,4.1rem)] font-bold leading-[1.02] text-[#2d2470]">
                  {text.sacredJourney}
                </h2>
              </div>
              <p className="max-w-xl text-[1.02rem] leading-8 text-[#495264] md:text-[1.08rem]">{text.sacredJourneyBody}</p>
            </div>

            <div className="mt-6 overflow-hidden rounded-[22px] border border-[#ecd6c4] bg-white p-3 shadow-[0_10px_22px_rgba(79,43,34,0.07)] md:p-5">
              <img
                src={JOURNEY_IMAGE_URL}
                alt="Our Sacred Journey timeline"
                className="h-auto w-full rounded-[16px]"
              />
            </div>
          </section>

          <aside className="rounded-[28px] bg-[linear-gradient(180deg,#a84d35_0%,#7f3423_100%)] p-6 text-white shadow-[0_18px_38px_rgba(98,39,26,0.22)] md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/72">Calendar</p>
            <h2 className="mt-3 font-serif text-4xl font-bold leading-tight">{text.upcoming}</h2>
            <p className="mt-3 text-[1rem] leading-8 text-white/88">{text.upcomingBody}</p>

            <div className="mt-6 space-y-4">
              {upcomingEvents.length === 0 ? (
                <div className="rounded-2xl border border-white/15 bg-white/8 p-5 text-sm text-white/85">{text.noEvents}</div>
              ) : (
                upcomingEvents.map((entry) => (
                  <article
                    key={entry.occurrenceKey}
                    className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-[2px]"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffd9b7]">
                      {eventDateLabel(entry.occurrenceStart, lang)}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold leading-tight text-white">{entry.event.title}</h3>
                    {entry.event.short_summary ? (
                      <p className="mt-3 text-[0.98rem] leading-8 text-white/86">{entry.event.short_summary}</p>
                    ) : null}
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.18em] text-white/62">
                        {entry.event.event_type}
                      </span>
                      <Link
                        href={`/events-festivals/${entry.event.slug}?occurrenceStart=${encodeURIComponent(entry.occurrenceStart)}`}
                        className="rounded-full border border-white/25 bg-white/12 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-white/18"
                      >
                        {text.eventCta}
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>

            <Link
              href={withLang("/events-festivals", lang)}
              className="mt-6 inline-flex rounded-xl border border-[#6b2a00] bg-[#f3b53a] px-5 py-3 text-sm font-semibold text-[#132a1f] no-underline hover:bg-[#f1c15d]"
            >
              {text.viewAllEvents}
            </Link>
          </aside>
        </div>
      </div>

      <section className="mx-auto mt-8 max-w-[1240px] px-6 md:px-10">
        <div className="rounded-[28px] border-[3px] border-[var(--db-border-strong)] bg-white p-5 shadow-[inset_0_1px_0_#fff,0_2px_0_#173522] md:p-6">
          <h2 className="font-serif text-3xl font-bold leading-tight text-[#132a1f] md:text-4xl">{text.liveStream}</h2>
          <p className="mt-2 text-base text-[#35513d] md:text-lg">{text.liveStreamBody}</p>

          {youtubeLiveEmbedUrl ? (
            <div className="mt-4 overflow-hidden rounded-md border-[2px] border-[var(--db-border)] bg-black">
              <div className="relative aspect-video w-full">
                <iframe
                  src={youtubeLiveEmbedUrl}
                  title={lang === "bn" ? "দুর্গাবাড়ি লাইভ স্ট্রিম" : "Durgabari live stream"}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-md border border-dashed border-[#3d6148] bg-[#eef4ec] px-3 py-2 text-sm text-[#35513d]">
              {text.liveStreamPlaceholder}
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
