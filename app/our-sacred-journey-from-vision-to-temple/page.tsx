import Link from "next/link";

import { ContentHero, ContentModule, ContentPageFrame } from "@/components/content-page";
import { CmsEditableBlock } from "@/components/cms/CmsEditableBlock";
import { CmsEditableList } from "@/components/cms/CmsEditableList";
import { canCurrentUserManageCms } from "@/lib/cms/access";
import { parseCmsListContent } from "@/lib/cms/list-content";
import { getCmsPageContent } from "@/lib/cms/page-content";
import { resolveLanguage, withLang } from "@/lib/i18n";

const waysToGive = {
  en: [
    "Founding Family (recurring) - $100/month (3-year pledge)",
    "One-time or cumulative gifts - choose any membership tier below",
    "Corporate matching - double your impact (ask your employer)",
    "In-kind - stage/storage, decor, AV, printing, hospitality",
  ],
  bn: [
    "প্রতিষ্ঠাতা পরিবার (পুনরাবৃত্ত) - $100/মাস (৩ বছরের অঙ্গীকার)",
    "এককালীন বা মোট উপহার - নিচের যেকোনো সদস্যপদ স্তর বেছে নিন",
    "কর্পোরেট ম্যাচিং - আপনার অবদান দ্বিগুণ করুন (কর্মস্থলে জিজ্ঞেস করুন)",
    "ইন-কাইন্ড সহায়তা - স্টেজ/স্টোরেজ, সজ্জা, AV, প্রিন্টিং, আতিথেয়তা",
  ],
} as const;

const donorTiers = {
  en: [
    {
      title: "Grand Benefactor Member",
      contribution: "$25,000+ (one-time or cumulative)",
      recognition:
        "Top placement on the Founder & Benefactor Plaque; lifetime listing on website and annual report; VIP acknowledgment at inaugurations and major festivals.",
    },
    {
      title: "Benefactor Member",
      contribution: "$15,000 to $24,999",
      recognition:
        "Benefactors section on donor wall; acknowledgment in annual communications; reserved seating at select events.",
    },
    {
      title: "Grand Patron Member",
      contribution: "$10,000 to $14,999",
      recognition:
        "Patron plaque listing; acknowledgment during annual Durga Puja; invitations to cultural appreciation events.",
    },
  ],
  bn: [
    {
      title: "গ্র্যান্ড বেনিফ্যাক্টর সদস্য",
      contribution: "$25,000+ (এককালীন বা মোট)",
      recognition:
        "Founder & Benefactor ফলকে সর্বোচ্চ স্থানে নাম; ওয়েবসাইট ও বার্ষিক প্রতিবেদনে আজীবন উল্লেখ; উদ্বোধন ও প্রধান উৎসবে VIP স্বীকৃতি।",
    },
    {
      title: "বেনিফ্যাক্টর সদস্য",
      contribution: "$15,000 থেকে $24,999",
      recognition:
        "ডোনার ওয়ালে Benefactors বিভাগে নাম; বার্ষিক যোগাযোগে স্বীকৃতি; নির্বাচিত অনুষ্ঠানে সংরক্ষিত আসন।",
    },
    {
      title: "গ্র্যান্ড প্যাট্রন সদস্য",
      contribution: "$10,000 থেকে $14,999",
      recognition:
        "Patron ফলকে নাম; বার্ষিক দুর্গাপূজায় স্বীকৃতি; সাংস্কৃতিক সংবর্ধনা অনুষ্ঠানে আমন্ত্রণ।",
    },
  ],
} as const;

interface OurJourneyPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function OurJourneyPage({ searchParams }: OurJourneyPageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const isBn = lang === "bn";
  const cmsSlug = lang === "bn" ? "our-sacred-journey-from-vision-to-temple-bn" : "our-sacred-journey-from-vision-to-temple";
  const waysToGiveSlug = `${cmsSlug}-ways-to-give`;
  const [canManageCms, cmsIntro, cmsWaysToGive] = await Promise.all([
    canCurrentUserManageCms(),
    getCmsPageContent(cmsSlug),
    getCmsPageContent(waysToGiveSlug),
  ]);
  const journeyIntroDefaultHtml = isBn
    ? "<p><em>দিব্য শক্তি ও সাংস্কৃতিক উৎকর্ষের এক পবিত্র আবাস</em></p><p>দুর্গা বাড়ি একটি কমিউনিটি-নেতৃত্বাধীন উদ্যোগ, যার লক্ষ্য উপাসনা, শিক্ষা এবং বাঙালি সাংস্কৃতিক উৎকর্ষের কেন্দ্র গড়া।</p>"
    : "<p><em>A Sacred Abode of Divine Energy and Cultural Excellence</em></p><p>Durga Bari is a community-led initiative to establish a center of worship, learning, and Bengali cultural excellence.</p>";
  const waysToGiveItems = parseCmsListContent(cmsWaysToGive?.content_html, [...waysToGive[lang]]);

  return (
    <ContentPageFrame>
      <ContentHero
        title={isBn ? "আমাদের পবিত্র যাত্রা: ভাবনা থেকে মন্দির" : "Our Sacred Journey: From Vision to Temple"}
        subtitle={
          isBn
            ? "দুর্গা বাড়ি গড়তে হাতে হাত মিলান - আধ্যাত্মিক ও সাংস্কৃতিক উৎকর্ষের কেন্দ্র"
            : "Join Hands to Build Durga Bari - Center for Spiritual and Cultural Excellence"
        }
        kicker={isBn ? "দূরদর্শী পরিকল্পনা" : "Vision Roadmap"}
      />

      <div className="mt-5 space-y-5">
        <ContentModule title={isBn ? "পবিত্র লক্ষ্য" : "Sacred Mission"} tone="red">
            <CmsEditableBlock
              slug={cmsSlug}
              initialTitle={isBn ? "পবিত্র লক্ষ্য" : "Sacred Mission"}
              initialHtml={cmsIntro?.content_html || journeyIntroDefaultHtml}
              isAdmin={canManageCms}
            />
            <p className="db-card-muted mt-4 border-l-4 border-[var(--db-brand)] px-4 py-3">
              <strong>{isBn ? "এখনই অঙ্গীকার করতে চান?" : "Ready to pledge now?"}</strong> Email <strong>info@thedurgacenter.org</strong> {isBn ? "অথবা যোগাযোগ ফর্ম ব্যবহার করুন:" : "or use the contact form:"}
              <Link href={withLang("/contact", lang)} className="ml-1 font-semibold underline">
                {isBn ? "যোগাযোগ পৃষ্ঠা" : "Contact Page"}
              </Link>
            </p>
        </ContentModule>

        <ContentModule title={isBn ? "দান করার উপায়" : "Ways to Give"} tone="gold">
            <CmsEditableList
              slug={waysToGiveSlug}
              initialItems={waysToGiveItems}
              isAdmin={canManageCms}
              emptyItemLabel={isBn ? "দানের উপায়" : "Way to give"}
            />

            <div className="db-card-muted mt-4 p-4">
              <p>
                <strong>{isBn ? "শুরু করতে:" : "To get started:"}</strong> Email <strong>info@thedurgacenter.org</strong> {isBn ? "অথবা যোগাযোগ ফর্ম ব্যবহার করুন।" : "or use the contact form."}
              </p>
              <p className="mt-2">
                {isBn
                  ? 'Zelle-এ দান করুন এবং recipient name হিসেবে "Durga Bari - Center for Spiritual and Cultural Excellence" যোগ করুন।'
                  : 'Donate through Zelle and add recipient name "Durga Bari - Center for Spiritual and Cultural Excellence".'}
              </p>
              <p className="mt-1">{isBn ? "আপনার ব্যাংকিং অ্যাপ থেকে QR কোড স্ক্যান করুন:" : "Scan the QR code from your banking app:"}</p>
              <img
                src="https://thedurgacenter.org/wp-content/uploads/2026/02/QR-Code-300x295.jpg"
                alt={isBn ? "Durga Bari Zelle QR কোড" : "Durga Bari Zelle QR code"}
                className="mt-4 rounded-[var(--db-radius-sm)] border border-[var(--db-border-soft)] bg-white p-2 shadow-[0_16px_30px_rgba(87,44,33,0.08)]"
                width={300}
                height={295}
              />
            </div>
        </ContentModule>

        <div className="grid gap-5 md:grid-cols-2">
          <ContentModule title={isBn ? "চেক পেমেন্ট" : "Check Payments"} tone="green">
              <div className="space-y-2">
                <p>
                  {isBn ? "ব্যক্তিগত চেকের জন্য প্রাপক হিসেবে লিখুন:" : "For personal checks, make payable to:"}
                  <br />
                  <strong>Durga Bari - Center for Spiritual and Cultural Excellence</strong>
                </p>
                <p>
                  {isBn ? "ডাকে পাঠান:" : "Mail to:"}
                  <br />
                  Durga Bari - Center for Spiritual and Cultural Excellence
                  <br />
                  2200 Eastridge Loop #731192
                  <br />
                  San Jose, CA 95173
                </p>
              </div>
          </ContentModule>

          <ContentModule title={isBn ? "ট্যাক্স তথ্য" : "Tax Information"} tone="green">
              <div className="space-y-2">
                <p>
                  {isBn
                    ? "Durga Bari - Center for Spiritual and Cultural Excellence একটি 501(c)(3) ননপ্রফিট সংস্থা। অনুদান কর ছাড়যোগ্য।"
                    : "Durga Bari - Center for Spiritual and Cultural Excellence is a 501(c)(3) nonprofit organization. Contributions are tax deductible."}
                </p>
                <p>
                  EIN: <strong>39-4854019</strong>
                  <br />
                  Email: <strong>info@thedurgacenter.org</strong>
                </p>
              </div>
          </ContentModule>
        </div>

        <ContentModule title={isBn ? "সদস্যপদ ও স্বীকৃতি (নন-ভোটিং দাতা বিভাগ)" : "Membership & Recognition (Non-Voting Donor Categories)"} tone="red">
            <p>
              {isBn
                ? "এই স্তরগুলো কেবল স্বীকৃতির জন্য; প্রশাসনিক ক্ষমতা উপবিধি অনুযায়ী বোর্ডের হাতে থাকবে।"
                : "These are honor tiers for recognition only; governance rests with the Board per bylaws."}
            </p>

            <div className="mt-3 space-y-3">
              {donorTiers[lang].map((tier) => (
                <section key={tier.title} className="db-card-muted p-4">
                  <h3 className="font-serif text-[30px] font-bold text-[var(--db-text)]">{tier.title}</h3>
                  <p className="mt-1">
                    <strong>{isBn ? "অবদান:" : "Contribution:"}</strong> {tier.contribution}
                  </p>
                  <p className="mt-1">
                    <strong>{isBn ? "স্বীকৃতি:" : "Recognition:"}</strong> {tier.recognition}
                  </p>
                </section>
              ))}
            </div>

            <div className="mt-4 rounded-[var(--db-radius-sm)] border-l-4 border-[var(--db-danger)] bg-[#fce9e9] px-4 py-3">
              <strong>{isBn ? "দ্রষ্টব্য:" : "Note:"}</strong>{" "}
              {isBn
                ? "দাতা বিভাগগুলো নন-ভোটিং এবং স্বীকৃতির জন্য। ভোট ও তদারকি সংক্রান্ত অধিকার উপবিধিতে নির্ধারিত।"
                : "Donor categories are non-voting and intended for recognition and gratitude. Voting and oversight privileges are defined separately in bylaws."}
            </div>
        </ContentModule>

        <ContentModule title={isBn ? "বিশেষ: প্রতিষ্ঠাতা পরিবার সার্কেল (প্রথম ২০০ পরিবার)" : "Special: Founding Family Circle (First 200 Families)"} tone="gold">
            <p>
              <strong>$100/month for 36 months</strong> (or $3,600 total). {isBn ? "প্রথমে আসলে আগে সুযোগ - অফিসিয়াল প্রতিষ্ঠাতা পরিবার মর্যাদা।" : "First-come, first-served for official Founding Family status."}
            </p>
            <p className="mt-2 font-bold">{isBn ? "সুবিধাসমূহ:" : "Benefits:"}</p>
            <ul className="mt-1 space-y-1">
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>{isBn ? "Founding Families Wall/Tree-এ স্থায়ী নাম খোদাই" : "Permanent name engraving on the Founding Families Wall/Tree"}</li>
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>{isBn ? "উদ্বোধনে প্রতিষ্ঠাতা পরিবারের সনদ ও স্মারক" : "Founding Family certificate and memento at inauguration"}</li>
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>{isBn ? "ওয়েবসাইট/নিউজলেটার ও প্রথম দুর্গাপূজায় স্বীকৃতি" : "Recognition on website/newsletters and first Durga Puja"}</li>
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>{isBn ? "প্রতিষ্ঠাতা সংবর্ধনা নৈশভোজে আমন্ত্রণ" : "Founders' appreciation dinner invitation"}</li>
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>{isBn ? "উদ্বোধনী আচার ও ইয়ুথ প্রোগ্রামে অগ্রাধিকার" : "Priority participation in opening rituals and youth programs"}</li>
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>{isBn ? "অতিরিক্ত অনুদানে Patron/Benefactor স্তরে উন্নীত হওয়া" : "Eligibility to upgrade to Patron/Benefactor tiers with added gifts"}</li>
            </ul>

            <div className="db-card-muted mt-4 px-4 py-3">
              <strong>{isBn ? "আজই যোগ দিন:" : "Join today:"}</strong> Email <strong>info@thedurgacenter.org</strong> {isBn ? "অথবা যোগাযোগ ফর্ম ব্যবহার করুন।" : "or use the contact form."}
            </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
