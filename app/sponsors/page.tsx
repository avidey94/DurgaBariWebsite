import { ContentHero, ContentModule, ContentPageFrame, ContentPlaceholder } from "@/components/content-page";
import { dataProvider } from "@/lib/data";
import type { FamilyProfile } from "@/lib/types";

interface SponsorTier {
  id: string;
  title: string;
  contribution: string;
  recognition: string;
  minCents: number;
  maxCents: number | null;
}

const tiers: SponsorTier[] = [
  {
    id: "grand-benefactor",
    title: "Grand Benefactor Member",
    contribution: "$25,000+ (one-time or cumulative)",
    recognition:
      "Top placement on the Founder & Benefactor Plaque; lifetime listing on website and annual report; VIP acknowledgment at inaugurations and major festivals; invitation to ground-blessing/stone-laying pujas.",
    minCents: 2_500_000,
    maxCents: null,
  },
  {
    id: "benefactor",
    title: "Benefactor Member",
    contribution: "$15,000 to $24,999",
    recognition:
      "Benefactors section on donor wall; acknowledgment in annual communications; reserved seating at select events; invitation to Patron & Benefactor appreciation.",
    minCents: 1_500_000,
    maxCents: 2_499_999,
  },
  {
    id: "grand-patron",
    title: "Grand Patron Member",
    contribution: "$10,000 to $14,999",
    recognition:
      "Patron plaque listing; acknowledgement during annual Durga Puja; invitations to cultural appreciation events.",
    minCents: 1_000_000,
    maxCents: 1_499_999,
  },
  {
    id: "patron",
    title: "Patron Member",
    contribution: "$5,000 to $9,999",
    recognition:
      "Patron roll at temple/website; priority invitations to programs. Reserve Seat at Front Row in all programs.",
    minCents: 500_000,
    maxCents: 999_999,
  },
];

interface SponsorMember {
  id: string;
  name: string;
  email: string;
  amountCents: number;
  foundingFamily: boolean;
  promisedFounder: boolean;
}

interface SponsorsPageProps {
  searchParams: Promise<{ q?: string }>;
}

const parseCurrencyToCents = (value?: string) => {
  if (!value) return 0;
  const normalized = value.replace(/[^\d.-]/g, "");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
};

const fallbackDonationSum = (family: FamilyProfile) =>
  family.donations.reduce((sum, donation) => sum + Math.max(0, donation.amountCents), 0);

const getContributionCents = (family: FamilyProfile) => {
  // Source of truth for sponsor totals: Google Sheet Column C (mapped to totalDuesPaid).
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
  const query = (await searchParams).q?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();
  const families = await dataProvider.getAllFamilies({ query });

  const members: SponsorMember[] = families
    .map((family) => ({
      id: family.id,
      // Display name source of truth: Google Sheet Column B (mapped to familyName).
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

  const membersByTier = tiers.map((tier) => ({
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
        title="Sponsors & Recognition"
        subtitle="Donor tiers, recognition levels, and founding family honors"
        kicker="Public Sponsor Roll"
      />

      <div className="mt-4 space-y-4">
        <ContentModule title="Sponsor Tiers">
          <p>
            This page shows members who have donated and groups them into sponsor tiers using the
            total contribution amount from your source data.
          </p>
          <p className="mt-2 border-l-4 border-[#9b1616] bg-[#fff4e7] px-3 py-2">
            <strong>Note:</strong> Donor categories are non-voting and intended for recognition and
            gratitude. Voting/oversight privileges, if any, are defined separately in bylaws.
          </p>

          <form className="mt-3 flex gap-3" method="get">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by family or email"
              className="w-full rounded-md border border-[#3d6148] bg-white px-3 py-2"
            />
            <button
              type="submit"
              className="rounded-md bg-[#3d6148] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f4b38]"
            >
              Search
            </button>
          </form>
        </ContentModule>

        {membersByTier.map(({ tier, members }) => (
          <ContentModule key={tier.id} title={tier.title} tone="red">
            <p>
              <strong>Contribution:</strong> {tier.contribution}
            </p>
            <p>
              <strong>Recognition:</strong> {tier.recognition}
            </p>

            <div className="mt-3 border-[2px] border-[#3d6148] bg-[#eef4ec] p-3">
              <p className="font-bold text-[#173724]">Members in this tier ({members.length})</p>
              {members.length === 0 ? (
                <p className="mt-1 text-[#35513d]">No members currently classified in this tier.</p>
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

        <ContentModule title="Special: Founding Family Circle (Limited to First 200 Families)">
          <p>
            <strong>$100/month for 36 months</strong> (or $3,600 total). First-come, first-served
            for official Founding Family status.
          </p>

          <div className="mt-3 border-[2px] border-[#3d6148] bg-[#dde9de] p-3">
            <p className="font-bold text-[#173724]">
              Founding Family Members ({paidFoundingFamilyMembers.length})
            </p>
            {paidFoundingFamilyMembers.length === 0 ? (
              <p className="mt-1 text-[#35513d]">No founding family members are available in current data.</p>
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
            <p className="font-bold text-[#173724]">Promised Founders ({promisedFounders.length})</p>
            <p className="mt-1 text-sm text-[#35513d]">
              Families who signed up but have not made a payment yet (Column C is blank).
            </p>
            {promisedFounders.length === 0 ? (
              <p className="mt-2 text-[#35513d]">No promised founders are available in current data.</p>
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

        <ContentPlaceholder
          label="Sponsor Wall"
          sublabel="Future donor-wall and recognition plaque artwork"
        />
      </div>
    </ContentPageFrame>
  );
}
