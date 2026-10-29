
import { CmsEditableBlock } from "@/components/cms/CmsEditableBlock";
import { canCurrentUserManageCms } from "@/lib/cms/access";
import { getCmsPageContent } from "@/lib/cms/page-content";
import { getRevampFieldRenderer, type RevampField } from "@/lib/cms/revamp-fields";
import { withLang, type Language } from "@/lib/i18n";

function PageIntro({ eyebrow, title, lead, image, alt, field }: { eyebrow: string; title: string; lead: string; image?: string; alt?: string; field: RevampField }) {
  return (
    <header className={image ? "editorial-hero editorial-hero-image" : "editorial-hero"}>
      <div className="editorial-hero-copy">{field("hero-eyebrow", eyebrow, "p", "elevated-eyebrow")}{field("hero-title", title, "h1")}{field("hero-lead", lead)}</div>
      {image ? field.image("hero-image", image, alt ?? "") : null}
    </header>
  );
}

function PageEnd({ title, body, href, label, lang, field }: { title: string; body: string; href: string; label: string; lang: Language; field: RevampField }) {
  return <section className="editorial-end"><div>{field("end-title", title, "h2")}{field("end-body", body)}</div>{field.link("end-link", label, withLang(href, lang), "elevated-text-link")}</section>;
}

const about = {
  en: {
    eyebrow: "About Durga Bari", title: "A sacred home, shaped by community.",
    lead: "Durga Bari brings worship, cultural heritage, and community life together in one welcoming place.",
    intro: "<p>Durga Bari – Center for Spiritual and Cultural Excellence is a community-led sacred space dedicated to Maa Durga, where devotion, culture, and community come together.</p>",
    imageAlt: "Worship at Durga Bari's inaugural gathering",
    storyLabel: "Our purpose", storyTitle: "A living place for worship and connection.",
    storyBody: "We envision a home for prayer and spiritual growth that also makes room for cultural programs, youth education, and community gatherings. The people who take part give Durga Bari its meaning.",
    principles: "What guides us",
    values: [
      ["Devotion", "A place to worship with humility and care."],
      ["Heritage", "A place to practice and share our festivals, arts, and traditions."],
      ["Belonging", "A place where generations and neighbors can come together."],
    ],
    endTitle: "There is room for you here.", endBody: "Join us in building a spiritual and cultural home for generations to come.", endLink: "Get involved",
  },
  bn: {
    eyebrow: "দুর্গা বাড়ি পরিচিতি", title: "কমিউনিটির হাতে গড়া এক পবিত্র ঘর।",
    lead: "দুর্গা বাড়িতে উপাসনা, সাংস্কৃতিক ঐতিহ্য ও কমিউনিটির জীবন একসঙ্গে মেলে।",
    intro: "<p>দুর্গা বাড়ি মা দুর্গাকে উৎসর্গ করা একটি কমিউনিটি-নেতৃত্বাধীন পবিত্র স্থান, যেখানে ভক্তি, সংস্কৃতি ও মানুষের মিলন ঘটে।</p>",
    imageAlt: "দুর্গা বাড়ির উদ্বোধনী পূজা",
    storyLabel: "আমাদের উদ্দেশ্য", storyTitle: "উপাসনা ও সম্পর্কের এক জীবন্ত স্থান।",
    storyBody: "আমরা প্রার্থনা ও আধ্যাত্মিক বিকাশের এমন একটি ঘর কল্পনা করি, যেখানে সাংস্কৃতিক অনুষ্ঠান, তরুণদের শিক্ষা ও কমিউনিটির মিলনেরও স্থান আছে। অংশগ্রহণকারী মানুষই দুর্গা বাড়িকে অর্থবহ করে তোলেন।",
    principles: "আমাদের পথনির্দেশ",
    values: [
      ["ভক্তি", "নম্রতা ও যত্নের সঙ্গে উপাসনার স্থান।"],
      ["ঐতিহ্য", "উৎসব, শিল্প ও রীতি চর্চা এবং ভাগ করে নেওয়ার স্থান।"],
      ["আপনত্ব", "প্রজন্ম ও প্রতিবেশীদের একসঙ্গে আসার স্থান।"],
    ],
    endTitle: "এখানে আপনারও স্থান আছে।", endBody: "আগামী প্রজন্মের জন্য আধ্যাত্মিক ও সাংস্কৃতিক ঘর গড়তে আমাদের সঙ্গে থাকুন।", endLink: "যুক্ত হোন",
  },
} as const;

export async function ElevatedAboutPage({ lang }: { lang: Language }) {
  const text = about[lang];
  const slug = lang === "bn" ? "about-bn" : "about";
  const [canManageCms, cmsIntro] = await Promise.all([canCurrentUserManageCms(), getCmsPageContent(slug)]);
  const field = await getRevampFieldRenderer("about", lang, canManageCms);
  return (
    <article className="editorial-page elevated-wrap">
      <PageIntro eyebrow={text.eyebrow} title={text.title} lead={text.lead} image="/durgacenter/maa-durga-inauguration.jpg" alt={text.imageAlt} field={field} />
      <section className="editorial-split">
        <div>{field("story-label", text.storyLabel, "p", "elevated-eyebrow")}{field("story-title", text.storyTitle, "h2")}</div>
        <div className="editorial-copy"><CmsEditableBlock slug={slug} initialTitle={text.storyLabel} initialHtml={cmsIntro?.content_html || text.intro} isAdmin={canManageCms} />{field("story-body", text.storyBody)}</div>
      </section>
      <section className="editorial-values">{field("principles-label", text.principles, "p", "elevated-eyebrow")}<div>{text.values.map(([title, body], index) => <section key={title}><span>0{index + 1}</span>{field(`value-${index + 1}-title`, title, "h3")}{field(`value-${index + 1}-body`, body)}</section>)}</div></section>
      <PageEnd title={text.endTitle} body={text.endBody} href="/get-involved" label={text.endLink} lang={lang} field={field} />
    </article>
  );
}

const journey = {
  en: {
    eyebrow: "Our journey", title: "A vision made real, one gathering at a time.",
    lead: "The path to a permanent temple and cultural center begins with people coming together now.",
    intro: "<p>Durga Bari is a community-led initiative to build a lasting home for worship, learning, and cultural life.</p>",
    photoLabel: "The first gatherings", photoTitle: "The community is the beginning.",
    photoBody: "Before any building, there are people who choose to gather, listen, and offer their time. These early moments are part of Durga Bari’s foundation.",
    pathLabel: "The path ahead", pathTitle: "Growing with purpose.",
    phases: [
      ["01", "Gather", "Bring families and neighbors together around a shared vision."],
      ["02", "Establish", "Build a regular rhythm of worship, programs, and service."],
      ["03", "Grow", "Strengthen the support needed for a permanent sacred and cultural home."],
    ],
    endTitle: "Help shape the next chapter.", endBody: "Every act of support helps this vision take root.", endLink: "Join the effort",
  },
  bn: {
    eyebrow: "আমাদের যাত্রা", title: "প্রতিটি মিলনে বাস্তব হয়ে ওঠা এক স্বপ্ন।",
    lead: "স্থায়ী মন্দির ও সাংস্কৃতিক কেন্দ্রের পথ শুরু হয় আজকের মানুষের একত্র হওয়া দিয়ে।",
    intro: "<p>দুর্গা বাড়ি উপাসনা, শিক্ষা ও সাংস্কৃতিক জীবনের স্থায়ী ঘর গড়ার একটি কমিউনিটি-নেতৃত্বাধীন উদ্যোগ।</p>",
    photoLabel: "প্রথম মিলন", photoTitle: "কমিউনিটিই আমাদের শুরু।",
    photoBody: "যেকোনো ভবনের আগে আছেন সেই মানুষরা, যারা একসঙ্গে আসেন, শোনেন এবং সময় দেন। এই প্রথম মুহূর্তগুলোই দুর্গা বাড়ির ভিত্তি।",
    pathLabel: "সামনের পথ", pathTitle: "উদ্দেশ্য নিয়ে এগিয়ে চলা।",
    phases: [
      ["০১", "মিলিত হই", "একটি অভিন্ন স্বপ্নে পরিবার ও প্রতিবেশীদের এক করা।"],
      ["০২", "প্রতিষ্ঠা করি", "নিয়মিত উপাসনা, অনুষ্ঠান ও সেবার ধারা গড়ে তোলা।"],
      ["০৩", "বাড়িয়ে তুলি", "স্থায়ী পবিত্র ও সাংস্কৃতিক ঘরের জন্য সমর্থন শক্তিশালী করা।"],
    ],
    endTitle: "পরবর্তী অধ্যায়ে আপনারও ভূমিকা আছে।", endBody: "প্রতিটি সহায়তা এই স্বপ্নকে আরও গভীরে প্রতিষ্ঠিত করে।", endLink: "আমাদের সঙ্গে থাকুন",
  },
} as const;

export async function ElevatedJourneyPage({ lang }: { lang: Language }) {
  const text = journey[lang];
  const slug = lang === "bn" ? "our-sacred-journey-from-vision-to-temple-bn" : "our-sacred-journey-from-vision-to-temple";
  const [canManageCms, cmsIntro] = await Promise.all([canCurrentUserManageCms(), getCmsPageContent(slug)]);
  const field = await getRevampFieldRenderer("journey", lang, canManageCms);
  return (
    <article className="editorial-page elevated-wrap">
      <PageIntro eyebrow={text.eyebrow} title={text.title} lead={text.lead} field={field} />
      <div className="editorial-opening"><CmsEditableBlock slug={slug} initialTitle={text.eyebrow} initialHtml={cmsIntro?.content_html || text.intro} isAdmin={canManageCms} /></div>
      <section className="editorial-photo-story">{field.image("photo-image", "/durgacenter/gathering-1.jpeg", text.photoLabel)}<div>{field("photo-label", text.photoLabel, "p", "elevated-eyebrow")}{field("photo-title", text.photoTitle, "h2")}{field("photo-body", text.photoBody)}</div></section>
      <section className="editorial-journey"><div>{field("path-label", text.pathLabel, "p", "elevated-eyebrow")}{field("path-title", text.pathTitle, "h2")}</div><ol>{text.phases.map(([number, title, body], index) => <li key={number}><span>{number}</span><div>{field(`phase-${index + 1}-title`, title, "h3")}{field(`phase-${index + 1}-body`, body)}</div></li>)}</ol></section>
      <PageEnd title={text.endTitle} body={text.endBody} href="/get-involved" label={text.endLink} lang={lang} field={field} />
    </article>
  );
}

const involved = {
  en: {
    eyebrow: "Get involved", title: "The future of Durga Bari is built together.",
    lead: "There are many ways to offer your time, share the vision, and help this community grow.",
    intro: "<p>Your participation helps bring a spiritual and cultural home to life. Whether you have an hour to give or a network to share with, there is a place for you here.</p>",
    ways: "Ways to take part",
    items: [
      ["Share the vision", "Tell friends, family, and neighbors about Durga Bari and invite them to gather with us."],
      ["Volunteer your time", "Help with events, hospitality, outreach, and the everyday work of community building."],
      ["Support the mission", "Connect us with patrons and supporters or contribute in a way that is meaningful to you."],
    ],
    photoAlt: "Members of the community gathered together",
    endTitle: "Let’s begin a conversation.", endBody: "Tell us how you would like to be involved.", endLink: "Contact us",
  },
  bn: {
    eyebrow: "যুক্ত হোন", title: "দুর্গা বাড়ির ভবিষ্যৎ আমরা একসঙ্গে গড়ি।",
    lead: "আপনার সময়, পরিচিতি ও সহায়তায় এই কমিউনিটি আরও বড় হতে পারে।",
    intro: "<p>আপনার অংশগ্রহণ আধ্যাত্মিক ও সাংস্কৃতিক ঘরকে প্রাণ দেয়। এক ঘণ্টা সময় দিতে পারুন বা পরিচিতদের সঙ্গে ভাবনা ভাগ করতে পারুন—এখানে আপনার স্থান আছে।</p>",
    ways: "যেভাবে অংশ নিতে পারেন",
    items: [
      ["ভাবনা ছড়িয়ে দিন", "বন্ধু, পরিবার ও প্রতিবেশীদের দুর্গা বাড়ি সম্পর্কে বলুন এবং একসঙ্গে আসতে আমন্ত্রণ জানান।"],
      ["সময় দিন", "অনুষ্ঠান, আতিথেয়তা, প্রচার ও কমিউনিটি গড়ার দৈনন্দিন কাজে সহায়তা করুন।"],
      ["উদ্যোগে সহায়তা করুন", "পৃষ্ঠপোষকদের সঙ্গে সংযোগ করুন বা আপনার পছন্দমতো অবদান রাখুন।"],
    ],
    photoAlt: "একসঙ্গে মিলিত কমিউনিটির সদস্যরা",
    endTitle: "কথা শুরু হোক।", endBody: "আপনি কীভাবে যুক্ত হতে চান আমাদের জানান।", endLink: "যোগাযোগ করুন",
  },
} as const;

export async function ElevatedGetInvolvedPage({ lang }: { lang: Language }) {
  const text = involved[lang];
  const slug = lang === "bn" ? "get-involved-bn" : "get-involved";
  const [canManageCms, cmsIntro] = await Promise.all([canCurrentUserManageCms(), getCmsPageContent(slug)]);
  const field = await getRevampFieldRenderer("involved", lang, canManageCms);
  return (
    <article className="editorial-page elevated-wrap">
      <PageIntro eyebrow={text.eyebrow} title={text.title} lead={text.lead} field={field} />
      <div className="editorial-opening"><CmsEditableBlock slug={slug} initialTitle={text.eyebrow} initialHtml={cmsIntro?.content_html || text.intro} isAdmin={canManageCms} /></div>
      <section className="editorial-ways">{field("ways-label", text.ways, "p", "elevated-eyebrow")}{text.items.map(([title, body], index) => <article key={title}><span>0{index + 1}</span>{field(`way-${index + 1}-title`, title, "h2")}{field(`way-${index + 1}-body`, body)}</article>)}</section>
      <PageEnd title={text.endTitle} body={text.endBody} href="/contact" label={text.endLink} lang={lang} field={field} />
    </article>
  );
}

const contact = {
  en: {
    eyebrow: "Contact", title: "We would love to hear from you.",
    lead: "Questions, ideas, and offers to help are always welcome.",
    intro: "<p>Use the form below for questions about Durga Bari, volunteering, and ways to support the community.</p>",
    formTitle: "Send us a message", directTitle: "Reach us directly", visitTitle: "Visit Durga Bari",
    visitBody: "2350 Paragon Dr, San Jose, CA 95131", directions: "Get directions",
  },
  bn: {
    eyebrow: "যোগাযোগ", title: "আপনার কথা শুনতে আমরা আগ্রহী।",
    lead: "প্রশ্ন, ভাবনা ও সহায়তার প্রস্তাব সব সময় স্বাগত।",
    intro: "<p>দুর্গা বাড়ি, স্বেচ্ছাসেবা ও কমিউনিটিতে সহায়তা সম্পর্কে প্রশ্নের জন্য নিচের ফর্মটি ব্যবহার করুন।</p>",
    formTitle: "বার্তা পাঠান", directTitle: "সরাসরি যোগাযোগ", visitTitle: "দুর্গা বাড়িতে আসুন",
    visitBody: "2350 Paragon Dr, San Jose, CA 95131", directions: "যাওয়ার পথ দেখুন",
  },
} as const;

export async function ElevatedContactPage({ lang }: { lang: Language }) {
  const text = contact[lang];
  const slug = lang === "bn" ? "contact-bn" : "contact";
  const [canManageCms, cmsIntro] = await Promise.all([canCurrentUserManageCms(), getCmsPageContent(slug)]);
  const field = await getRevampFieldRenderer("contact", lang, canManageCms);
  return (
    <article className="editorial-page elevated-wrap">
      <PageIntro eyebrow={text.eyebrow} title={text.title} lead={text.lead} field={field} />
      <div className="editorial-opening"><CmsEditableBlock slug={slug} initialTitle={text.eyebrow} initialHtml={cmsIntro?.content_html || text.intro} isAdmin={canManageCms} /></div>
      <div className="editorial-contact-grid">
        <section>{field("form-title", text.formTitle, "h2")}<iframe title={text.formTitle} src="https://docs.google.com/forms/d/e/1FAIpQLSfW4TMdgsWg9SRWF4CBEZ0H5cwPEm99sFSwNkjzpuAN9Bciuw/viewform?embedded=true" loading="lazy" /></section>
        <aside><div>{field("direct-title", text.directTitle, "p", "elevated-eyebrow")}<a href="mailto:info@thedurgacenter.org">info@thedurgacenter.org</a></div><div>{field("visit-title", text.visitTitle, "p", "elevated-eyebrow")}<address>{text.visitBody}</address>{field.link("directions-link", text.directions, "https://maps.google.com/?q=2350+Paragon+Dr,+San+Jose,+CA+95131", "elevated-text-link")}</div></aside>
      </div>
    </article>
  );
}
