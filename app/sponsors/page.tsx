import { ContentHero, ContentModule, ContentPageFrame, ContentPlaceholder } from "@/components/content-page";
import { CmsEditableBlock } from "@/components/cms/CmsEditableBlock";
import { getCurrentUser } from "@/lib/auth/session";
import { getCmsPageContent } from "@/lib/cms/page-content";
import { ActiveDonorsSection, type ActiveDonor } from "@/components/active-donors-section";
import { dataProvider } from "@/lib/data";
import { env } from "@/lib/env";
import { resolveLanguage } from "@/lib/i18n";
import type { FamilyProfile } from "@/lib/types";

interface SponsorTier {
  id: string;
  title: string;
  contribution: string;
  recognition: string;
  minCents: number;
  maxCents: number | null;
}

const tiers = {
  en: [
    {
      id: "grand-benefactor",
      title: "Grand Benefactor — Lifetime Recognition",
      contribution: "$25,000+ (one-time or cumulative)",
      recognition:
        "Top placement on the Founder & Benefactor Plaque; lifetime listing on website and annual report; VIP acknowledgment at inaugurations and major festivals; invitation to ground-blessing/stone-laying pujas.",
      minCents: 2_500_000,
      maxCents: null,
    },
    {
      id: "benefactor",
      title: "Benefactor — Lifetime Recognition",
      contribution: "$15,000 to $24,999",
      recognition:
        "Benefactors section on donor wall; acknowledgment in annual communications; reserved seating at select events; invitation to Patron & Benefactor appreciation.",
      minCents: 1_500_000,
      maxCents: 2_499_999,
    },
    {
      id: "grand-patron",
      title: "Grand Patron — Lifetime Recognition",
      contribution: "$10,000 to $14,999",
      recognition:
        "Patron plaque listing; acknowledgement during annual Durga Puja; invitations to cultural appreciation events.",
      minCents: 1_000_000,
      maxCents: 1_499_999,
    },
  ],
  bn: [
    {
      id: "grand-benefactor",
      title: "গ্র্যান্ড বেনিফ্যাক্টর সদস্য — আজীবন স্বীকৃতি",
      contribution: "$25,000+ (এককালীন বা মোট)",
      recognition:
        "Founder & Benefactor ফলকে সর্বোচ্চ স্থানে নাম; ওয়েবসাইট ও বার্ষিক প্রতিবেদনে আজীবন উল্লেখ; উদ্বোধন ও প্রধান উৎসবে VIP স্বীকৃতি; ভূমিপূজন/শিলান্যাসে আমন্ত্রণ।",
      minCents: 2_500_000,
      maxCents: null,
    },
    {
      id: "benefactor",
      title: "বেনিফ্যাক্টর সদস্য — আজীবন স্বীকৃতি",
      contribution: "$15,000 থেকে $24,999",
      recognition:
        "ডোনার ওয়ালে Benefactors বিভাগে নাম; বার্ষিক যোগাযোগে স্বীকৃতি; নির্বাচিত অনুষ্ঠানে সংরক্ষিত আসন; Patron & Benefactor সংবর্ধনায় আমন্ত্রণ।",
      minCents: 1_500_000,
      maxCents: 2_499_999,
    },
    {
      id: "grand-patron",
      title: "গ্র্যান্ড প্যাট্রন সদস্য — আজীবন স্বীকৃতি",
      contribution: "$10,000 থেকে $14,999",
      recognition:
        "Patron ফলকে নাম; বার্ষিক দুর্গাপূজায় স্বীকৃতি; সাংস্কৃতিক সংবর্ধনা অনুষ্ঠানে আমন্ত্রণ।",
      minCents: 1_000_000,
      maxCents: 1_499_999,
    },
  ],
} as const satisfies Record<"en" | "bn", SponsorTier[]>;

interface SponsorMember {
  id: string;
  name: string;
  email: string;
  amountCents: number;
  foundingFamily: boolean;
  promisedFounder: boolean;
}

interface SponsorsPageProps {
  searchParams: Promise<{ q?: string; lang?: string }>;
}

interface GoogleVizColumn {
  label?: string;
}

interface GoogleVizCell {
  v?: unknown;
  f?: string;
}

interface GoogleVizRow {
  c: Array<GoogleVizCell | null>;
}

interface GoogleVizResponse {
  table?: {
    cols?: GoogleVizColumn[];
    rows?: GoogleVizRow[];
  };
}

const fallbackActiveDonors: ActiveDonor[] = [
  { name: "Asha Mukherjee", monthlyCents: 10_000 },
  { name: "Rohan Das", monthlyCents: 10_000 },
  { name: "Priya Banerjee", monthlyCents: 50_000 },
  { name: "Neel Chatterjee", monthlyCents: 50_000 },
  { name: "Suman Ghosh", monthlyCents: 100_000 },
  { name: "Anika Sen", monthlyCents: 150_000 },
];

const parseCurrencyToCents = (value?: string) => {
  if (!value) return 0;
  const normalized = value.replace(/[^\d.-]/g, "");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
};

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[\s_-]+/g, " ");

const getCellText = (cell: GoogleVizCell | null | undefined) => {
  if (!cell) return "";
  if (typeof cell.f === "string") return cell.f.trim();
  if (typeof cell.v === "string") return cell.v.trim();
  if (typeof cell.v === "number") return String(cell.v);
  return "";
};

const parseGoogleViz = (rawText: string) => {
  const prefix = "google.visualization.Query.setResponse(";
  const suffix = ");";
  const start = rawText.indexOf(prefix);
  const end = rawText.lastIndexOf(suffix);
  if (start < 0 || end < 0) return null;
  const jsonText = rawText.slice(start + prefix.length, end);
  return JSON.parse(jsonText) as GoogleVizResponse;
};

const parseActiveDonors = (parsed: GoogleVizResponse): ActiveDonor[] => {
  const columns = parsed.table?.cols ?? [];
  const rows = parsed.table?.rows ?? [];
  const inferredHeaders = columns.map((column, index) => (column.label?.trim() ? column.label.trim() : `Column ${index + 1}`));
  const rawValues = rows.map((row) => row.c.map((cell) => getCellText(cell)));
  const firstRow = rawValues[0] ?? [];

  const firstRowLooksLikeHeader = normalizeHeader(firstRow[0] ?? "") === "name";
  const headers =
    firstRowLooksLikeHeader || inferredHeaders.every((header) => /^column\s+\d+$/i.test(header))
      ? firstRow.map((value, index) => value.trim() || `Column ${index + 1}`)
      : inferredHeaders;
  const values = firstRowLooksLikeHeader ? rawValues.slice(1) : rawValues;

  const normalizedHeaders = headers.map(normalizeHeader);
  const nameIndex = normalizedHeaders.findIndex((header) => header === "name" || header === "display name");
  const monthlyIndex = normalizedHeaders.findIndex(
    (header) =>
      header === "monthly" ||
      header === "monthly amount" ||
      header === "monthly commitment" ||
      header === "monthly amount usd" ||
      header === "monthly amount $" ||
      header === "monthly_amount",
  );
  const startDateIndex = normalizedHeaders.findIndex((header) => header === "start date" || header === "since");
  const statusIndex = normalizedHeaders.findIndex((header) => header === "status");

  if (nameIndex < 0 || monthlyIndex < 0) return [];

  return values
    .reduce<ActiveDonor[]>((donors, row) => {
      const name = (row[nameIndex] ?? "").trim();
      const monthlyCents = parseCurrencyToCents(row[monthlyIndex] ?? "");
      const startDate = startDateIndex >= 0 ? (row[startDateIndex] ?? "").trim() : "";
      const status = statusIndex >= 0 ? (row[statusIndex] ?? "").trim() : "";
      const normalizedStatus = status.toLowerCase();
      const isActive =
        normalizedStatus.length === 0 ||
        normalizedStatus === "active" ||
        normalizedStatus === "current" ||
        normalizedStatus === "yes";

      if (!name || monthlyCents <= 0 || !isActive) return donors;

      donors.push({
        name,
        monthlyCents,
        startDate: startDate || undefined,
        status: status || undefined,
      });
      return donors;
    }, [])
    .sort((a, b) => b.monthlyCents - a.monthlyCents || a.name.localeCompare(b.name));
};

const getActiveDonors = async (): Promise<ActiveDonor[]> => {
  if (!env.googleSheetId) return fallbackActiveDonors;

  try {
    const endpoint = `https://docs.google.com/spreadsheets/d/${env.googleSheetId}/gviz/tq?tqx=out:json&sheet=ActiveDonors`;
    const response = await fetch(endpoint, { next: { revalidate: 60 } });
    if (!response.ok) return fallbackActiveDonors;

    const rawText = await response.text();
    const parsed = parseGoogleViz(rawText);
    if (!parsed) return fallbackActiveDonors;

    const donors = parseActiveDonors(parsed);
    return donors.length > 0 ? donors : fallbackActiveDonors;
  } catch {
    return fallbackActiveDonors;
  }
};

const fallbackDonationSum = (family: FamilyProfile) =>
  family.donations.reduce((sum, donation) => sum + Math.max(0, donation.amountCents), 0);

const getContributionCents = (family: FamilyProfile) => {
  const fromColumnC = parseCurrencyToCents(family.totalDuesPaid);
  if (fromColumnC > 0) return fromColumnC;
  return fallbackDonationSum(family);
};

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

export default async function SponsorsPage({ searchParams }: SponsorsPageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const isBn = lang === "bn";
  const cmsSlug = lang === "bn" ? "sponsors-bn" : "sponsors";
  const query = params.q?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();
  const [families, activeDonors, user, cmsIntro] = await Promise.all([
    dataProvider.getAllFamilies({ query }),
    getActiveDonors(),
    getCurrentUser(),
    getCmsPageContent(cmsSlug),
  ]);
  const sponsorIntroDefaultHtml = isBn
    ? "<p>এই পৃষ্ঠায় দানকারী সদস্যদের মোট অবদান অনুযায়ী বিভিন্ন স্পন্সর স্তরে দেখানো হয়।</p>"
    : "<p>This page shows members who have donated and groups them into sponsor tiers using the total contribution amount from your source data.</p>";

  const members: SponsorMember[] = families
    .map((family) => ({
      id: family.id,
      name: family.familyName.trim() || family.primaryEmail,
      email: family.primaryEmail,
      amountCents: getContributionCents(family),
      foundingFamily: family.foundingFamily,
      promisedFounder: family.foundingFamily && (family.totalDuesPaid ?? "").trim().length === 0,
    }))
    .filter(
      (member) =>
        normalizedQuery.length === 0 ||
        member.name.toLowerCase().includes(normalizedQuery) ||
        member.email.toLowerCase().includes(normalizedQuery),
    )
    .sort((a, b) => b.amountCents - a.amountCents);

  const paidMembers = members.filter((member) => member.amountCents > 0);

  const membersByTier = tiers[lang].map((tier) => ({
    tier,
    members: paidMembers.filter((member) => {
      const inMin = member.amountCents >= tier.minCents;
      const inMax = tier.maxCents === null || member.amountCents <= tier.maxCents;
      return inMin && inMax;
    }),
  }));

  const paidFoundingFamilyMembers = members.filter(
    (member) => member.foundingFamily && !member.promisedFounder,
  );
  const promisedFounders = members.filter((member) => member.promisedFounder);

  return (
    <ContentPageFrame>
      <ContentHero
        title={isBn ? "স্পন্সর ও স্বীকৃতি" : "Sponsors & Recognition"}
        subtitle={
          isBn
            ? "দাতা স্তর, স্বীকৃতি পর্যায় ও প্রতিষ্ঠাতা পরিবারের সম্মান"
            : "Donor tiers, recognition levels, and founding family honors"
        }
        kicker={isBn ? "পাবলিক স্পন্সর তালিকা" : "Public Sponsor Roll"}
      />

      <div className="mt-4 space-y-4">
        <ContentModule title={isBn ? "স্পন্সর স্তর" : "Sponsor Tiers"}>
          <CmsEditableBlock
            slug={cmsSlug}
            initialTitle={isBn ? "স্পন্সর স্তর" : "Sponsor Tiers"}
            initialHtml={cmsIntro?.content_html || sponsorIntroDefaultHtml}
            isAdmin={Boolean(user?.isAdmin)}
          />
          <p className="mt-2 border-l-4 border-[#9b1616] bg-[#fff4e7] px-3 py-2">
            <strong>{isBn ? "দ্রষ্টব্য:" : "Note:"}</strong>{" "}
            {isBn
              ? "দাতা বিভাগগুলো নন-ভোটিং এবং কৃতজ্ঞতা ও স্বীকৃতির জন্য। ভোট/তদারকি সংক্রান্ত অধিকার থাকলে তা উপবিধিতে নির্ধারিত।"
              : "Donor categories are non-voting and intended for recognition and gratitude. Voting/oversight privileges, if any, are defined separately in bylaws."}
          </p>

          <form className="mt-3 flex gap-3" method="get">
            {lang === "bn" ? <input type="hidden" name="lang" value="bn" /> : null}
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder={isBn ? "পরিবার বা ইমেইল দিয়ে খুঁজুন" : "Search by family or email"}
              className="w-full rounded-md border border-[#3d6148] bg-white px-3 py-2"
            />
            <button
              type="submit"
              className="rounded-md bg-[#3d6148] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f4b38]"
            >
              {isBn ? "খুঁজুন" : "Search"}
            </button>
          </form>
        </ContentModule>

        {membersByTier.map(({ tier, members }) => (
          <ContentModule key={tier.id} title={tier.title} tone="red">
            <p>
              <strong>{isBn ? "অবদান:" : "Contribution:"}</strong> {tier.contribution}
            </p>
            <p>
              <strong>{isBn ? "স্বীকৃতি:" : "Recognition:"}</strong> {tier.recognition}
            </p>

            <div className="mt-3 border-[2px] border-[#3d6148] bg-[#eef4ec] p-3">
              <p className="font-bold text-[#173724]">
                {isBn ? "এই স্তরের সদস্য" : "Members in this tier"} ({members.length})
              </p>
              {members.length === 0 ? (
                <p className="mt-1 text-[#35513d]">
                  {isBn ? "এ স্তরে বর্তমানে কোনো সদস্য নেই।" : "No members currently classified in this tier."}
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {members.map((member) => (
                    <li key={`${tier.id}-${member.id}`} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <span className="text-[#9b1616]">▸</span>
                        <span>{member.name}</span>
                      </span>
                      <span className="font-semibold text-[#173724]">{formatCurrency(member.amountCents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ContentModule>
        ))}

        <ContentModule title={isBn ? "বিশেষ: প্রতিষ্ঠাতা পরিবার সার্কেল (প্রথম ২০০ পরিবার)" : "Special: Founding Family Circle (Limited to First 200 Families)"}>
          <p>
            <strong>$100/month for 36 months</strong> (or $3,600 total). {isBn ? "প্রথমে আসলে আগে সুযোগ - অফিসিয়াল প্রতিষ্ঠাতা পরিবার মর্যাদার জন্য।" : "First-come, first-served for official Founding Family status."}
          </p>

          <div className="mt-3 border-[2px] border-[#3d6148] bg-[#dde9de] p-3">
            <p className="font-bold text-[#173724]">
              {isBn ? "প্রতিষ্ঠাতা পরিবার সদস্য" : "Founding Family Members"} ({paidFoundingFamilyMembers.length})
            </p>
            {paidFoundingFamilyMembers.length === 0 ? (
              <p className="mt-1 text-[#35513d]">
                {isBn ? "বর্তমান ডেটায় কোনো প্রতিষ্ঠাতা পরিবার সদস্য পাওয়া যায়নি।" : "No founding family members are available in current data."}
              </p>
            ) : (
              <ul className="mt-2 grid gap-1 md:grid-cols-2">
                {paidFoundingFamilyMembers.map((member) => (
                  <li key={`founding-${member.id}`} className="flex items-center gap-2">
                    <span className="text-[#9b1616]">▸</span>
                    <span>{member.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 border-[2px] border-[#3d6148] bg-[#eef4ec] p-3">
            <p className="font-bold text-[#173724]">
              {isBn ? "প্রতিশ্রুত প্রতিষ্ঠাতা" : "Promised Founders"} ({promisedFounders.length})
            </p>
            <p className="mt-1 text-sm text-[#35513d]">
              {isBn
                ? "যেসব পরিবার সাইন আপ করেছেন কিন্তু এখনও পেমেন্ট করেননি (Column D ফাঁকা)।"
                : "Families who signed up but have not made a payment yet (Column D is blank)."}
            </p>
            {promisedFounders.length === 0 ? (
              <p className="mt-2 text-[#35513d]">
                {isBn ? "বর্তমান ডেটায় কোনো প্রতিশ্রুত প্রতিষ্ঠাতা নেই।" : "No promised founders are available in current data."}
              </p>
            ) : (
              <ul className="mt-2 grid gap-1 md:grid-cols-2">
                {promisedFounders.map((member) => (
                  <li key={`promised-${member.id}`} className="flex items-center gap-2">
                    <span className="text-[#9b1616]">▸</span>
                    <span>{member.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ContentModule>

        <ActiveDonorsSection donors={activeDonors} lang={lang} />

        <ContentPlaceholder
          label={isBn ? "স্পন্সর ওয়াল" : "Sponsor Wall"}
          sublabel={isBn ? "ভবিষ্যৎ ডোনার-ওয়াল ও স্বীকৃতি ফলকের আর্টওয়ার্ক" : "Future donor-wall and recognition plaque artwork"}
        />
      </div>
    </ContentPageFrame>
  );
}
