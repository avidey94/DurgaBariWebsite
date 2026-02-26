import Link from "next/link";

import { ContentHero, ContentModule, ContentPageFrame, ContentPlaceholder } from "@/components/content-page";

const waysToGive = [
  "Founding Family (recurring) - $100/month (3-year pledge)",
  "One-time or cumulative gifts - choose any membership tier below",
  "Corporate matching - double your impact (ask your employer)",
  "In-kind - stage/storage, decor, AV, printing, hospitality",
];

const donorTiers = [
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
  {
    title: "Patron Member",
    contribution: "$5,000-$9,999",
    recognition:
      "Patron roll at temple/website; priority invitations to programs. Reserve Seat at Front Row in all programs.",
  },
];

const foundingBenefits = [
  "Permanent name engraving on the Founding Families Wall/Tree",
  '"Founding Family of Durga Bari" certificate and memento at inauguration',
  "Recognition on website/newsletters and at the first Durga Puja",
  "Founders' Appreciation Dinner",
  "Priority participation in opening rituals and children's cultural programs",
  "Eligibility to upgrade to Patron/Benefactor tiers with additional gifts",
];

export default function DonatePage() {
  return (
    <ContentPageFrame>
      <ContentHero
        title="Join Hands to Build Durga Bari"
        subtitle="A Sacred Abode of Divine Energy and Cultural Excellence"
        kicker="Donation Desk"
      />

      <div className="mt-4 space-y-4">
        <ContentModule title="Sacred Mission">
          <p>
            Durga Bari is a community-led initiative to establish a center of worship, learning,
            and Bengali cultural excellence. Your generosity today lights the path from seed
            funding to sanctum.
          </p>
          <p className="mt-2 border-l-4 border-[var(--db-brand)] bg-[#edf3ea] px-3 py-2">
            <strong>Ready to pledge now?</strong> Email <strong>info@thedurgacenter.org</strong> or
            use the contact form:{" "}
            <Link href="/contact" className="font-semibold underline">
              Contact
            </Link>
            .
          </p>
        </ContentModule>

        <ContentModule title="Ways to Give">
          <ul className="space-y-1">
            {waysToGive.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#9b1616]">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 border-[2px] border-[#3d6148] bg-[#dde9de] p-3">
            <p>
              <strong>TO GET STARTED:</strong> Email <strong>info@thedurgacenter.org</strong> or
              fill the form at{" "}
              <Link href="/contact" className="font-semibold underline">
                Contact
              </Link>
              .
            </p>
            <p className="mt-2">
              Donate through Zelle, add recipient name &quot;Durga Bari - Center for Spiritual and
              Cultural Excellence&quot;, and select &quot;durgabari&quot; as Zelle business tag.
            </p>
            <p className="mt-2">
              Alternatively scan the QR code below using your banking app&apos;s Zelle QR scanner.
            </p>
          </div>

          <div className="mt-3">
            <ContentPlaceholder label="Zelle QR" sublabel="Donation scan code area" />
          </div>
        </ContentModule>

        <div className="grid gap-4 md:grid-cols-2">
          <ContentModule title="Check Payments" tone="gold">
            <p>
              For payment through personal checks, please write check payable to:
            </p>
            <p className="font-bold">Durga Bari - Center for Spiritual and Cultural Excellence</p>
            <p className="mt-2">Mail it at:</p>
            <p>Durga Bari - Center for Spiritual and Cultural Excellence</p>
            <p>2200 Eastridge Loop #731192</p>
            <p>San Jose, CA 95173</p>
          </ContentModule>

          <ContentModule title="Tax Information" tone="gold">
            <p>
              Durga Bari - Center for Spiritual and Cultural Excellence is a 501 C(3) non profit
              organization.
            </p>
            <p>All contributions are 100% tax deductible.</p>
            <p className="mt-1 font-bold">EIN: 39-4854019.</p>
            <p>Email us: info@thedurgacenter.org.</p>
          </ContentModule>
        </div>

        <ContentModule title="Membership & Recognition (Non-Voting Donor Categories)" tone="red">
          <p>
            These are honor tiers for recognition only; governance rests with the Board per
            bylaws.
          </p>
          <div className="mt-3 space-y-3">
            {donorTiers.map((tier) => (
              <article key={tier.title} className="border-[2px] border-[#3d6148] bg-[#eef4ec] p-3">
                <h3 className="font-serif text-[28px] font-bold text-[#12271d]">{tier.title}</h3>
                <p>
                  <strong>Contribution:</strong> {tier.contribution}
                </p>
                <p>
                  <strong>Recognition:</strong> {tier.recognition}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-3 border-l-4 border-[#9b1616] bg-[#fff4e7] px-3 py-2">
            <strong>Note:</strong> Donor categories are non-voting and intended for recognition and
            gratitude. Voting/oversight privileges, if any, are defined separately in bylaws.
          </p>
        </ContentModule>

        <ContentModule title="Special: Founding Family Circle (Limited to First 200 Families)">
          <p>
            <strong>$100/month for 36 months</strong> (or $3,600 total). First-come, first-served
            for official Founding Family status.
          </p>
          <p className="mt-2 font-bold">Benefits:</p>
          <ul className="space-y-1">
            {foundingBenefits.map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <span className="text-[#9b1616]">▸</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-l-4 border-[var(--db-brand)] bg-[#edf3ea] px-3 py-2">
            Join the 200-Family Circle today: Email <strong>info@thedurgacenter.org</strong> or use
            the contact form.
          </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
