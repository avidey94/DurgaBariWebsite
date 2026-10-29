import Image from "next/image";

import { CmsEditableBlock } from "@/components/cms/CmsEditableBlock";
import { CmsEditableList } from "@/components/cms/CmsEditableList";
import { canCurrentUserManageCms } from "@/lib/cms/access";
import { parseCmsListContent } from "@/lib/cms/list-content";
import { getCmsPageContent } from "@/lib/cms/page-content";
import { getRevampFieldRenderer } from "@/lib/cms/revamp-fields";
import { withLang, type Language } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Support Durga Bari",
    title: "Help build a home for generations to come.",
    lead: "Your support sustains worship and community life today while helping us work toward a lasting spiritual and cultural home.",
    intro: "<p>Durga Bari is a community-led initiative to establish a center of worship, learning, and Bengali cultural excellence. Every contribution helps move this shared vision forward.</p>",
    ways: "Ways to give",
    list: ["Founding Family: $100/month for 36 months", "One-time gifts at any amount", "Employer matching", "In-kind support for events and programs"],
    online: "Give online", onlineBody: "Choose the platform that works best for you.",
    zeffy: "Donate with Zeffy", paypal: "Donate with PayPal",
    zelle: "Give through Zelle", zelleBody: "Use the QR code with your banking app’s Zelle scanner. Confirm the recipient is Durga Bari before sending.",
    checks: "By check", checksBody: "Make checks payable to Durga Bari – Center for Spiritual and Cultural Excellence and mail them to:",
    circle: "Founding Family Circle", circleBody: "A three-year pledge of $100 per month ($3,600 total) supports the foundation of Durga Bari. The circle is limited to the first 200 families.",
    recognition: "Recognition", recognitionBody: "We recognize supporters through non-voting donor categories. Governance remains with the Board under the bylaws.",
    tiers: [["Grand Benefactor", "$25,000+"], ["Benefactor", "$15,000–$24,999"], ["Grand Patron", "$10,000–$14,999"], ["Patron", "$5,000–$9,999"]],
    tax: "Durga Bari – Center for Spiritual and Cultural Excellence is a 501(c)(3) nonprofit organization. EIN: 39-4854019.",
    question: "Questions about giving?", contact: "Contact us",
  },
  bn: {
    eyebrow: "দুর্গা বাড়িকে সহায়তা করুন",
    title: "আগামী প্রজন্মের জন্য একটি ঘর গড়তে সাহায্য করুন।",
    lead: "আপনার সহায়তা আজকের উপাসনা ও কমিউনিটির জীবনকে সমর্থন করে এবং স্থায়ী আধ্যাত্মিক ও সাংস্কৃতিক ঘরের পথে এগিয়ে দেয়।",
    intro: "<p>দুর্গা বাড়ি উপাসনা, শিক্ষা ও বাঙালি সাংস্কৃতিক উৎকর্ষের কেন্দ্র গড়ার একটি কমিউনিটি-নেতৃত্বাধীন উদ্যোগ। প্রতিটি অবদান এই স্বপ্নকে এগিয়ে নেয়।</p>",
    ways: "দানের উপায়",
    list: ["প্রতিষ্ঠাতা পরিবার: ৩৬ মাসের জন্য মাসে $100", "যেকোনো অঙ্কের এককালীন অনুদান", "কর্মস্থলের ম্যাচিং", "অনুষ্ঠান ও প্রোগ্রামে সামগ্রী বা সেবা"],
    online: "অনলাইনে দান", onlineBody: "আপনার সুবিধামতো মাধ্যম বেছে নিন।",
    zeffy: "Zeffy-তে দান", paypal: "PayPal-এ দান",
    zelle: "Zelle-এ দান", zelleBody: "ব্যাংকিং অ্যাপের Zelle স্ক্যানার দিয়ে QR কোড স্ক্যান করুন। পাঠানোর আগে প্রাপক দুর্গা বাড়ি কিনা নিশ্চিত করুন।",
    checks: "চেকের মাধ্যমে", checksBody: "চেকে Durga Bari – Center for Spiritual and Cultural Excellence লিখে পাঠান:",
    circle: "প্রতিষ্ঠাতা পরিবার সার্কেল", circleBody: "মাসে $100 করে তিন বছরের অঙ্গীকার (মোট $3,600) দুর্গা বাড়ির ভিত্তিকে সমর্থন করে। প্রথম ২০০ পরিবার এই সার্কেলে যোগ দিতে পারবেন।",
    recognition: "স্বীকৃতি", recognitionBody: "নন-ভোটিং দাতা বিভাগে সমর্থকদের স্বীকৃতি দেওয়া হয়। উপবিধি অনুযায়ী পরিচালনার দায়িত্ব বোর্ডের।",
    tiers: [["গ্র্যান্ড বেনিফ্যাক্টর", "$25,000+"], ["বেনিফ্যাক্টর", "$15,000–$24,999"], ["গ্র্যান্ড প্যাট্রন", "$10,000–$14,999"], ["প্যাট্রন", "$5,000–$9,999"]],
    tax: "Durga Bari – Center for Spiritual and Cultural Excellence একটি 501(c)(3) ননপ্রফিট সংস্থা। EIN: 39-4854019।",
    question: "দান সম্পর্কে প্রশ্ন আছে?", contact: "যোগাযোগ করুন",
  },
} as const;

export async function ElevatedDonatePage({ lang }: { lang: Language }) {
  const text = copy[lang];
  const slug = lang === "bn" ? "donate-bn" : "donate";
  const [canManageCms, cmsIntro, cmsWays] = await Promise.all([
    canCurrentUserManageCms(),
    getCmsPageContent(slug),
    getCmsPageContent(`${slug}-ways-to-give`),
  ]);
  const ways = parseCmsListContent(cmsWays?.content_html, [...text.list]);
  const field = await getRevampFieldRenderer("donate", lang, canManageCms);
  return (
    <article className="editorial-page elevated-wrap elevated-donate">
      <header className="editorial-hero editorial-hero-image">
        <div className="editorial-hero-copy">{field("hero-eyebrow", text.eyebrow, "p", "elevated-eyebrow")}{field("hero-title", text.title, "h1")}{field("hero-lead", text.lead)}</div>
        {field.image("hero-image", "/durgacenter/maa-durga-inauguration.jpg", lang === "bn" ? "দুর্গা বাড়ির উদ্বোধনী পূজা" : "Worship at Durga Bari")}
      </header>
      <div className="editorial-opening"><CmsEditableBlock slug={slug} initialTitle={text.eyebrow} initialHtml={cmsIntro?.content_html || text.intro} isAdmin={canManageCms} /></div>
      <section className="elevated-donate-ways"><div>{field("ways-label", text.ways, "p", "elevated-eyebrow")}<CmsEditableList slug={`${slug}-ways-to-give`} initialItems={ways} isAdmin={canManageCms} /></div></section>
      <section className="elevated-donate-methods">
        <div><p className="elevated-eyebrow">01</p>{field("online-title", text.online, "h2")}{field("online-body", text.onlineBody)}<div className="elevated-actions">{field.link("zeffy-link", text.zeffy, "https://www.zeffy.com/en-US/donation-form/support-durga-bari-sustaining-spiritual-and-community-wellbeing", "elevated-button")}{field.link("paypal-link", text.paypal, "https://www.paypal.com/ncp/payment/PBSF3LY72MJSC", "elevated-text-link")}</div></div>
        <div><p className="elevated-eyebrow">02</p>{field("zelle-title", text.zelle, "h2")}{field("zelle-body", text.zelleBody)}<Image className="elevated-donate-qr" src="/durgacenter/zelle-qr.jpg" alt="Durga Bari Zelle QR code" width={300} height={295} sizes="220px" /></div>
        <div><p className="elevated-eyebrow">03</p>{field("checks-title", text.checks, "h2")}{field("checks-body", text.checksBody)}<address>2200 Eastridge Loop #731192<br />San Jose, CA 95173</address></div>
      </section>
      <section className="elevated-donate-circle"><div>{field("circle-label", text.circle, "p", "elevated-eyebrow")}{field("circle-title", text.circle, "h2")}{field("circle-body", text.circleBody)}</div><div>{field("recognition-title", text.recognition, "h3")}{field("recognition-body", text.recognitionBody)}<ul>{text.tiers.map(([name, amount], index) => <li key={name}>{field(`tier-${index + 1}-name`, name, "span")}{field(`tier-${index + 1}-amount`, amount, "strong")}</li>)}</ul></div></section>
      <section className="editorial-end"><div>{field("end-title", text.question, "h2")}{field("tax-body", text.tax)}</div>{field.link("contact-link", text.contact, withLang("/contact", lang), "elevated-text-link")}</section>
    </article>
  );
}
