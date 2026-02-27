import Link from "next/link";

import { ContentHero, ContentModule, ContentPageFrame, ContentPlaceholder } from "@/components/content-page";
import { CmsEditableBlock } from "@/components/cms/CmsEditableBlock";
import { CmsEditableList } from "@/components/cms/CmsEditableList";
import { getCurrentUser } from "@/lib/auth/session";
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
        "Top placement on the Founder & Benefactor Plaque; lifetime listing on website and annual report; VIP acknowledgment at inaugurations and major festivals; invitation to ground-blessing and stone-laying pujas.",
    },
    {
      title: "Benefactor Member",
      contribution: "$15,000 to $24,999",
      recognition:
        "Benefactors section on donor wall; acknowledgment in annual communications; reserved seating at select events; invitation to Patron and Benefactor appreciation.",
    },
    {
      title: "Grand Patron Member",
      contribution: "$10,000-$14,999",
      recognition:
        "Patron plaque listing; acknowledgement during annual Durga Puja; invitations to cultural appreciation events.",
    },
  ],
  bn: [
    {
      title: "গ্র্যান্ড বেনিফ্যাক্টর সদস্য",
      contribution: "$25,000+ (এককালীন বা মোট)",
      recognition:
        "Founder & Benefactor ফলকে সর্বোচ্চ স্থানে নাম; ওয়েবসাইট ও বার্ষিক প্রতিবেদনে আজীবন উল্লেখ; উদ্বোধন ও প্রধান উৎসবে VIP স্বীকৃতি; ভূমিপূজন ও শিলান্যাস পূজায় আমন্ত্রণ।",
    },
    {
      title: "বেনিফ্যাক্টর সদস্য",
      contribution: "$15,000 থেকে $24,999",
      recognition:
        "ডোনার ওয়ালে Benefactors বিভাগে নাম; বার্ষিক যোগাযোগে স্বীকৃতি; নির্বাচিত অনুষ্ঠানে সংরক্ষিত আসন; Patron ও Benefactor সংবর্ধনায় আমন্ত্রণ।",
    },
    {
      title: "গ্র্যান্ড প্যাট্রন সদস্য",
      contribution: "$10,000-$14,999",
      recognition:
        "Patron ফলকে নাম; বার্ষিক দুর্গাপূজায় স্বীকৃতি; সাংস্কৃতিক সংবর্ধনা অনুষ্ঠানে আমন্ত্রণ।",
    },
  ],
} as const;

const foundingBenefits = {
  en: [
    "Permanent name engraving on the Founding Families Wall/Tree",
    '"Founding Family of Durga Bari" certificate and memento at inauguration',
    "Recognition on website/newsletters and at the first Durga Puja",
    "Founders' Appreciation Dinner",
    "Priority participation in opening rituals and children's cultural programs",
    "Eligibility to upgrade to Patron/Benefactor tiers with additional gifts",
  ],
  bn: [
    "Founding Families Wall/Tree-এ স্থায়ী নাম খোদাই",
    'উদ্বোধনে "Founding Family of Durga Bari" সনদ ও স্মারক',
    "ওয়েবসাইট/নিউজলেটার এবং প্রথম দুর্গাপূজায় বিশেষ স্বীকৃতি",
    "Founders' Appreciation Dinner-এ আমন্ত্রণ",
    "উদ্বোধনী আচার ও শিশুদের সাংস্কৃতিক প্রোগ্রামে অগ্রাধিকার",
    "অতিরিক্ত অনুদানে Patron/Benefactor স্তরে উন্নীত হওয়ার সুযোগ",
  ],
} as const;

interface DonatePageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function DonatePage({ searchParams }: DonatePageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const isBn = lang === "bn";
  const cmsSlug = lang === "bn" ? "donate-bn" : "donate";
  const waysToGiveSlug = `${cmsSlug}-ways-to-give`;
  const [user, cmsIntro, cmsWaysToGive] = await Promise.all([
    getCurrentUser(),
    getCmsPageContent(cmsSlug),
    getCmsPageContent(waysToGiveSlug),
  ]);
  const donateIntroDefaultHtml = isBn
    ? "<p>দুর্গা বাড়ি একটি কমিউনিটি-নেতৃত্বাধীন উদ্যোগ, যার লক্ষ্য উপাসনা, শিক্ষা এবং বাঙালি সাংস্কৃতিক উৎকর্ষের কেন্দ্র গড়া। আজকের আপনার উদারতা বীজ-তহবিল থেকে পূর্ণ মন্দিরের পথ আলোকিত করবে।</p>"
    : "<p>Durga Bari is a community-led initiative to establish a center of worship, learning, and Bengali cultural excellence. Your generosity today lights the path from seed funding to sanctum.</p>";
  const waysToGiveItems = parseCmsListContent(cmsWaysToGive?.content_html, [...waysToGive[lang]]);

  return (
    <ContentPageFrame>
      <ContentHero
        title={isBn ? "দুর্গা বাড়ি গড়তে হাতে হাত মিলান" : "Join Hands to Build Durga Bari"}
        subtitle={
          isBn
            ? "দিব্য শক্তি ও সাংস্কৃতিক উৎকর্ষের এক পবিত্র আবাস"
            : "A Sacred Abode of Divine Energy and Cultural Excellence"
        }
        kicker={isBn ? "দান ডেস্ক" : "Donation Desk"}
      />

      <div className="mt-4 space-y-4">
        <ContentModule title={isBn ? "পবিত্র লক্ষ্য" : "Sacred Mission"}>
          <CmsEditableBlock
            slug={cmsSlug}
            initialTitle={isBn ? "পবিত্র লক্ষ্য" : "Sacred Mission"}
            initialHtml={cmsIntro?.content_html || donateIntroDefaultHtml}
            isAdmin={Boolean(user?.isAdmin)}
          />
          <p className="mt-2 border-l-4 border-[var(--db-brand)] bg-[#edf3ea] px-3 py-2">
            <strong>{isBn ? "এখনই অঙ্গীকার করতে চান?" : "Ready to pledge now?"}</strong>{" "}
            {isBn ? "ইমেইল করুন" : "Email"} <strong>info@thedurgacenter.org</strong> {isBn ? "অথবা যোগাযোগ ফর্ম ব্যবহার করুন:" : "or use the contact form:"}{" "}
            <Link href={withLang("/contact", lang)} className="font-semibold underline">
              {isBn ? "যোগাযোগ" : "Contact"}
            </Link>
            .
          </p>
        </ContentModule>

        <ContentModule title={isBn ? "দান করার উপায়" : "Ways to Give"}>
          <CmsEditableList
            slug={waysToGiveSlug}
            initialItems={waysToGiveItems}
            isAdmin={Boolean(user?.isAdmin)}
            emptyItemLabel={isBn ? "দানের উপায়" : "Way to give"}
          />

          <div className="mt-3 border-[2px] border-[#3d6148] bg-[#dde9de] p-3">
            <p>
              <strong>{isBn ? "শুরু করতে:" : "TO GET STARTED:"}</strong> {isBn ? "ইমেইল করুন" : "Email"} <strong>info@thedurgacenter.org</strong> {isBn ? "অথবা ফর্ম পূরণ করুন" : "or fill the form at"}{" "}
              <Link href={withLang("/contact", lang)} className="font-semibold underline">
                {isBn ? "যোগাযোগ" : "Contact"}
              </Link>
              .
            </p>
            <p className="mt-2">
              {isBn
                ? 'Zelle-এ দান করতে recipient name হিসেবে "Durga Bari - Center for Spiritual and Cultural Excellence" এবং business tag হিসেবে "durgabari" নির্বাচন করুন।'
                : 'Donate through Zelle, add recipient name "Durga Bari - Center for Spiritual and Cultural Excellence", and select "durgabari" as Zelle business tag.'}
            </p>
            <p className="mt-2">
              {isBn
                ? "অথবা আপনার ব্যাংকিং অ্যাপের Zelle QR স্ক্যানার দিয়ে নিচের QR কোড স্ক্যান করুন।"
                : "Alternatively scan the QR code below using your banking app's Zelle QR scanner."}
            </p>
          </div>

          <div className="mt-3">
            <ContentPlaceholder
              label={isBn ? "Zelle কিউআর" : "Zelle QR"}
              sublabel={isBn ? "দান স্ক্যান কোডের এলাকা" : "Donation scan code area"}
            />
          </div>
        </ContentModule>

        <div className="grid gap-4 md:grid-cols-2">
          <ContentModule title={isBn ? "চেক পেমেন্ট" : "Check Payments"} tone="gold">
            <p>{isBn ? "ব্যক্তিগত চেকের মাধ্যমে পেমেন্ট করতে, চেকটি লিখুন:" : "For payment through personal checks, please write check payable to:"}</p>
            <p className="font-bold">Durga Bari - Center for Spiritual and Cultural Excellence</p>
            <p className="mt-2">{isBn ? "ডাকযোগে পাঠান:" : "Mail it at:"}</p>
            <p>Durga Bari - Center for Spiritual and Cultural Excellence</p>
            <p>2200 Eastridge Loop #731192</p>
            <p>San Jose, CA 95173</p>
          </ContentModule>

          <ContentModule title={isBn ? "ট্যাক্স তথ্য" : "Tax Information"} tone="gold">
            <p>
              {isBn
                ? "Durga Bari - Center for Spiritual and Cultural Excellence একটি 501 C(3) নন-প্রফিট সংস্থা।"
                : "Durga Bari - Center for Spiritual and Cultural Excellence is a 501 C(3) non profit organization."}
            </p>
            <p>{isBn ? "সব অনুদান ১০০% কর ছাড়যোগ্য।" : "All contributions are 100% tax deductible."}</p>
            <p className="mt-1 font-bold">EIN: 39-4854019.</p>
            <p>{isBn ? "ইমেইল:" : "Email us:"} info@thedurgacenter.org.</p>
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
              <article key={tier.title} className="border-[2px] border-[#3d6148] bg-[#eef4ec] p-3">
                <h3 className="font-serif text-[28px] font-bold text-[#12271d]">{tier.title}</h3>
                <p>
                  <strong>{isBn ? "অবদান:" : "Contribution:"}</strong> {tier.contribution}
                </p>
                <p>
                  <strong>{isBn ? "স্বীকৃতি:" : "Recognition:"}</strong> {tier.recognition}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-3 border-l-4 border-[#9b1616] bg-[#fff4e7] px-3 py-2">
            <strong>{isBn ? "দ্রষ্টব্য:" : "Note:"}</strong>{" "}
            {isBn
              ? "দাতা বিভাগগুলো নন-ভোটিং এবং স্বীকৃতির জন্য। ভোট/তদারকি সংক্রান্ত অধিকার থাকলে তা আলাদাভাবে উপবিধিতে নির্ধারিত।"
              : "Donor categories are non-voting and intended for recognition and gratitude. Voting/oversight privileges, if any, are defined separately in bylaws."}
          </p>
        </ContentModule>

        <ContentModule title={isBn ? "বিশেষ: প্রতিষ্ঠাতা পরিবার সার্কেল (প্রথম ২০০ পরিবার)" : "Special: Founding Family Circle (Limited to First 200 Families)"}>
          <p>
            <strong>$100/month for 36 months</strong> (or $3,600 total). {isBn ? "প্রথমে আসলে আগে সুযোগ - অফিসিয়াল প্রতিষ্ঠাতা পরিবার মর্যাদার জন্য।" : "First-come, first-served for official Founding Family status."}
          </p>
          <p className="mt-2 font-bold">{isBn ? "সুবিধাসমূহ:" : "Benefits:"}</p>
          <ul className="space-y-1">
            {foundingBenefits[lang].map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <span className="text-[#9b1616]">▸</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-l-4 border-[var(--db-brand)] bg-[#edf3ea] px-3 py-2">
            {isBn ? "আজই ২০০-পরিবার সার্কেলে যোগ দিন:" : "Join the 200-Family Circle today:"} {isBn ? "ইমেইল করুন" : "Email"} <strong>info@thedurgacenter.org</strong> {isBn ? "অথবা যোগাযোগ ফর্ম ব্যবহার করুন।" : "or use the contact form."}
          </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
