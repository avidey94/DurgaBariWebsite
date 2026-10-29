import Link from "next/link";

import { CmsEditableBlock } from "@/components/cms/CmsEditableBlock";
import { getCurrentUser } from "@/lib/auth/session";
import { canCurrentUserManageCms } from "@/lib/cms/access";
import { getCmsPageContent } from "@/lib/cms/page-content";
import { getRevampFieldRenderer } from "@/lib/cms/revamp-fields";
import { listCalendarEvents } from "@/lib/events/server";
import { env } from "@/lib/env";
import { withLang, type Language } from "@/lib/i18n";
import { ArrowUpRightIcon } from "@/components/elevated/Icons";

const copy = {
  en: {
    eyebrow: "A home for devotion and belonging · San Jose, California",
    title: "A place to gather. A tradition to carry forward.",
    intro: "Durga Bari is a community-led spiritual and cultural home dedicated to Maa Durga. We come together in worship, share our traditions, and make space for the next generation to belong.",
    imageCaption: "Inaugural worship at Durga Bari",
    discover: "Discover our story",
    visit: "Visit us",
    spirit: "The spirit of Durga Bari",
    spiritTitle: "Rooted in devotion. Open to everyone.",
    spiritBody: "What begins with worship grows through the people who show up: families, volunteers, artists, teachers, and neighbors. Durga Bari is being shaped by that shared care.",
    pillars: [
      ["Worship", "A sacred space to pray, observe, and celebrate together."],
      ["Culture", "Music, language, festivals, and traditions passed from one generation to the next."],
      ["Community", "A welcoming place to meet, serve, and build lasting connections."],
    ],
    journey: "Our journey",
    journeyTitle: "A home taking shape, together.",
    journeyBody: "From the first gathering to our vision for a permanent temple and cultural center, every chapter is made possible by the community around it.",
    journeyLink: "Explore our journey",
    events: "Gather with us",
    eventsTitle: "What’s happening",
    eventsBody: "Prayer, celebration, and cultural life at Durga Bari.",
    noEvents: "There are no upcoming public events listed yet. Explore the calendar for the latest updates.",
    eventLink: "Event details",
    calendarLink: "See the calendar",
    place: "Find us",
    placeTitle: "Come as you are.",
    placeBody: "We would be glad to welcome you at Durga Bari.",
    directions: "Get directions",
    memberTitle: "Already part of the community?",
    memberBody: "Manage your family account, donations, and volunteer commitments in the member portal.",
    memberLink: "Member portal",
    memberLogin: "Member login",
    livestream: "Watch live",
  },
  bn: {
    eyebrow: "ভক্তি ও মিলনের ঠিকানা · সান হোসে, ক্যালিফোর্নিয়া",
    title: "একসঙ্গে মিলিত হওয়ার স্থান। ঐতিহ্যকে এগিয়ে নেওয়ার অঙ্গীকার।",
    intro: "দুর্গা বাড়ি মা দুর্গাকে উৎসর্গ করা একটি কমিউনিটি-নেতৃত্বাধীন আধ্যাত্মিক ও সাংস্কৃতিক ঘর। এখানে আমরা উপাসনায় মিলিত হই, ঐতিহ্য ভাগ করে নিই, আর পরবর্তী প্রজন্মের জন্য আপন একটি স্থান গড়ি।",
    imageCaption: "দুর্গা বাড়ির উদ্বোধনী পূজা",
    discover: "আমাদের গল্প জানুন",
    visit: "আমাদের কাছে আসুন",
    spirit: "দুর্গা বাড়ির প্রাণ",
    spiritTitle: "ভক্তিতে শিকড়। সবার জন্য উন্মুক্ত।",
    spiritBody: "উপাসনা দিয়ে শুরু, আর মানুষের অংশগ্রহণে তার বিস্তার—পরিবার, স্বেচ্ছাসেবক, শিল্পী, শিক্ষক ও প্রতিবেশীরা একসঙ্গে দুর্গা বাড়ি গড়ছেন।",
    pillars: [
      ["উপাসনা", "একসঙ্গে প্রার্থনা, আচার ও উৎসব পালনের পবিত্র স্থান।"],
      ["সংস্কৃতি", "সঙ্গীত, ভাষা, উৎসব ও ঐতিহ্যকে প্রজন্ম থেকে প্রজন্মে পৌঁছে দেওয়া।"],
      ["কমিউনিটি", "মিলিত হওয়া, সেবা করা এবং স্থায়ী সম্পর্ক গড়ার আপন ঠিকানা।"],
    ],
    journey: "আমাদের যাত্রা",
    journeyTitle: "সবার হাতে গড়ে উঠছে একটি ঘর।",
    journeyBody: "প্রথম মিলন থেকে স্থায়ী মন্দির ও সাংস্কৃতিক কেন্দ্রের স্বপ্ন পর্যন্ত—প্রতিটি অধ্যায় সম্ভব হয়েছে কমিউনিটির জন্য।",
    journeyLink: "যাত্রাটি দেখুন",
    events: "একসঙ্গে মিলি",
    eventsTitle: "সামনের অনুষ্ঠান",
    eventsBody: "দুর্গা বাড়িতে প্রার্থনা, উৎসব ও সাংস্কৃতিক জীবন।",
    noEvents: "এখন কোনো আসন্ন পাবলিক ইভেন্ট তালিকাভুক্ত নেই। সর্বশেষ তথ্যের জন্য ক্যালেন্ডার দেখুন।",
    eventLink: "বিস্তারিত দেখুন",
    calendarLink: "ক্যালেন্ডার দেখুন",
    place: "আমাদের ঠিকানা",
    placeTitle: "আপনাকে স্বাগত।",
    placeBody: "দুর্গা বাড়িতে আপনাকে স্বাগত জানাতে আমরা আনন্দিত হব।",
    directions: "যাওয়ার পথ দেখুন",
    memberTitle: "ইতিমধ্যে কমিউনিটির অংশ?",
    memberBody: "সদস্য পোর্টালে পরিবার, অনুদান ও স্বেচ্ছাসেবার তথ্য দেখুন।",
    memberLink: "সদস্য পোর্টাল",
    memberLogin: "সদস্য লগইন",
    livestream: "সরাসরি দেখুন",
  },
} as const;

const eventDate = (iso: string, lang: Language) =>
  new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
    timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric",
  });

export async function HomePageElevated({ lang }: { lang: Language }) {
  const text = copy[lang];
  const now = new Date();
  const cmsSlug = lang === "bn" ? "home-bn" : "home";
  const [user, canManageCms, cmsIntro, upcomingEvents] = await Promise.all([
    getCurrentUser(),
    canCurrentUserManageCms(),
    getCmsPageContent(cmsSlug),
    listCalendarEvents({
      includeDraft: false, includePrivate: false, includeMembers: false,
      fromIso: now.toISOString(),
      toIso: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    }).then((events) => events.slice(0, 3)),
  ]);
  const youtubeLiveEmbedUrl = env.youtubeLiveEmbedUrl.trim();
  const field = await getRevampFieldRenderer("home", lang, canManageCms);

  return (
    <div className="elevated-home">
      <section className="elevated-home-hero elevated-wrap">
        <div className="elevated-home-hero-copy">
          {field("hero-eyebrow", text.eyebrow, "p", "elevated-eyebrow")}
          {field("hero-title", text.title, "h1")}
          <div className="elevated-home-intro">
            <CmsEditableBlock slug={cmsSlug} initialTitle={lang === "bn" ? "হোম পরিচিতি" : "Home introduction"} initialHtml={cmsIntro?.content_html || `<p>${text.intro}</p>`} isAdmin={canManageCms} />
          </div>
          <div className="elevated-actions">
            {field.link("discover-link", text.discover, withLang("/about", lang), "elevated-button")}
            {field.link("visit-link", text.visit, "#visit", "elevated-text-link", "down")}
          </div>
        </div>
        <figure className="elevated-home-hero-image">
          {field.image("hero-image", "/durgacenter/maa-durga-inauguration.jpg", text.imageCaption)}
          {field("hero-image-caption", text.imageCaption, "figcaption")}
        </figure>
      </section>

      <section className="elevated-statement">
        <div className="elevated-wrap elevated-statement-inner">
          <div>{field("spirit-label", text.spirit, "p", "elevated-eyebrow")}{field("spirit-title", text.spiritTitle, "h2")}</div>
          {field("spirit-body", text.spiritBody)}
        </div>
      </section>

      <section className="elevated-pillars elevated-wrap" aria-label={text.spirit}>
        {text.pillars.map(([title, body], index) => (
          <article key={title}><span>0{index + 1}</span>{field(`pillar-${index + 1}-title`, title, "h3")}{field(`pillar-${index + 1}-body`, body)}</article>
        ))}
      </section>

      <section className="elevated-feature elevated-wrap">
        <div className="elevated-feature-image">
          {field.image("journey-image-one", "/durgacenter/gathering-1.jpeg", lang === "bn" ? "কমিউনিটির প্রথম মিলন" : "An early Durga Bari community gathering")}
          {field.image("journey-image-two", "/durgacenter/gathering-3.jpeg", lang === "bn" ? "দুর্গা বাড়ির সমাবেশ" : "Members gathered at Durga Bari")}
        </div>
        <div className="elevated-feature-copy">{field("journey-label", text.journey, "p", "elevated-eyebrow")}{field("journey-title", text.journeyTitle, "h2")}{field("journey-body", text.journeyBody)}{field.link("journey-link", text.journeyLink, withLang("/our-sacred-journey-from-vision-to-temple/", lang), "elevated-text-link")}</div>
      </section>

      <section className="elevated-events elevated-wrap">
        <div className="elevated-section-heading"><div>{field("events-label", text.events, "p", "elevated-eyebrow")}{field("events-title", text.eventsTitle, "h2")}{field("events-body", text.eventsBody)}</div>{field.link("calendar-link", text.calendarLink, withLang("/events-festivals", lang), "elevated-text-link")}</div>
        {upcomingEvents.length === 0 ? field("events-empty", text.noEvents, "p", "elevated-empty") : (
          <div className="elevated-event-list">{upcomingEvents.map((entry) => (
            <Link key={entry.occurrenceKey} href={`/events-festivals/${entry.event.slug}?occurrenceStart=${encodeURIComponent(entry.occurrenceStart)}`}>
              <time dateTime={entry.occurrenceStart}>{eventDate(entry.occurrenceStart, lang)}</time>
              <strong>{entry.event.title}</strong>
              <span>{text.eventLink} <ArrowUpRightIcon /></span>
            </Link>
          ))}</div>
        )}
      </section>

      <section id="visit" className="elevated-visit">
        <div className="elevated-wrap elevated-visit-grid">
          <div>{field("visit-label", text.place, "p", "elevated-eyebrow")}{field("visit-title", text.placeTitle, "h2")}{field("visit-body", text.placeBody)}<address>2350 Paragon Dr<br />San Jose, CA 95131</address>{field.link("directions-link", text.directions, "https://maps.google.com/?q=2350+Paragon+Dr,+San+Jose,+CA+95131", "elevated-text-link")}</div>
          <div className="elevated-visit-map"><iframe title="Durga Bari location map" src="https://www.google.com/maps?q=2350%20Paragon%20Dr%2C%20San%20Jose%2C%20CA%2095131&z=15&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
        </div>
      </section>

      <section className="elevated-member elevated-wrap"><div>{field("member-title", text.memberTitle, "h2")}{field("member-body", text.memberBody)}</div>{field.link(user ? "member-link" : "member-login", user ? text.memberLink : text.memberLogin, withLang(user ? "/portal" : "/login", lang), "elevated-text-link")}</section>
      {youtubeLiveEmbedUrl ? <section className="elevated-live elevated-wrap">{field("live-title", text.livestream, "h2")}<div className="elevated-live-frame"><iframe src={youtubeLiveEmbedUrl} title={text.livestream} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div></section> : null}
    </div>
  );
}
