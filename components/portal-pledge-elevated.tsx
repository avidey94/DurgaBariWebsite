import Image from "next/image";

import { PortalActiveDonorRequest } from "@/components/portal-active-donor-request";
import { PortalMemberPage } from "@/components/portal-member-page";
import type { ActiveDonorStatus, DonationLedgerEntry, RequestedActiveDonorStatus } from "@/lib/portal/types";

interface Tier {
  id: RequestedActiveDonorStatus;
  title: string;
  contribution: string;
}

const benefits: Record<RequestedActiveDonorStatus, readonly string[]> = {
  bronze: ["Donor roster recognition", "Quarterly updates", "Priority volunteer signup"],
  silver: ["Expanded recognition", "Donor appreciation gatherings", "Early campaign updates"],
  gold: ["Top-tier recognition", "Flagship campaign acknowledgment", "Priority funding outreach"],
};

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);

const formatMonth = (monthKey: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(`${monthKey}-01T00:00:00.000Z`));

const tierFromDonation = (type: DonationLedgerEntry["donationType"]) =>
  type === "active_donor_bronze" ? "Bronze" : type === "active_donor_silver" ? "Silver" : "Gold";

export function PortalPledgeElevated({
  approvedTier,
  requestedStatus,
  requestedAt,
  allowedStatuses,
  tiers,
  activeDonorDonations,
  activeDonorTotalCents,
  monthTotals,
  monthRange,
}: {
  approvedTier: ActiveDonorStatus | null;
  requestedStatus: RequestedActiveDonorStatus | null;
  requestedAt: string | null;
  allowedStatuses: RequestedActiveDonorStatus[];
  tiers: readonly Tier[];
  activeDonorDonations: DonationLedgerEntry[];
  activeDonorTotalCents: number;
  monthTotals: Map<string, number>;
  monthRange: string[];
}) {
  const currentTier = tiers.find((tier) => tier.id === approvedTier);

  return (
    <PortalMemberPage
      title={approvedTier ? "Your donor commitment" : "Active giving"}
      eyebrow="Active donor program"
      description="Choose a monthly level of support for Durga Bari."
    >
      {approvedTier ? (
        <dl className="member-metrics member-metrics-two">
          <div><dt>Current level</dt><dd>{currentTier?.title.replace(" Active Donor", "") ?? approvedTier}</dd><small>{currentTier?.contribution}</small></div>
          <div><dt>Payments recorded</dt><dd>{formatCurrency(activeDonorTotalCents)}</dd></div>
        </dl>
      ) : null}

      <section className="member-section" aria-labelledby="donor-levels-heading">
        <div className="member-section-heading">
          <div><h2 id="donor-levels-heading">Monthly levels</h2><p className="member-section-lede">Each level is a monthly commitment.</p></div>
        </div>
        <div className="member-tier-list">
          {tiers.map((tier) => (
            <article key={tier.id} className={approvedTier === tier.id ? "is-current" : ""}>
              <div className="member-tier-top">
                <h3>{tier.title.replace(" Active Donor", "")}</h3>
                <strong>{tier.contribution}</strong>
              </div>
              {approvedTier === tier.id ? <p className="member-tier-current">Your current level</p> : null}
              <ul>{benefits[tier.id].map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <PortalActiveDonorRequest
        currentStatus={approvedTier ?? "none"}
        requestedStatus={requestedStatus}
        requestedAt={requestedAt}
        allowedStatuses={allowedStatuses}
        elevated
      />

      <section className="member-section member-donor-payment" aria-labelledby="donor-payment-heading">
        <div>
          <h2 id="donor-payment-heading">Make a payment</h2>
          <p className="member-section-lede">Scan the QR code to make your monthly contribution.</p>
        </div>
        <Image
          src="https://thedurgacenter.org/wp-content/uploads/2026/02/QR-Code-768x755.jpg"
          alt="Durga Bari donation QR code"
          width={320}
          height={315}
          unoptimized
        />
      </section>

      {approvedTier ? (
        <section className="member-section" aria-labelledby="donor-payments-heading">
          <div className="member-section-heading"><h2 id="donor-payments-heading">Payment record</h2></div>
          {activeDonorDonations.length === 0 ? (
            <p className="member-empty">No active donor payments have been recorded yet.</p>
          ) : (
            <div className="member-ledger">
              {activeDonorDonations.slice(0, 12).map((donation) => (
                <article key={donation.id} className="member-ledger-row">
                  <div><strong>{tierFromDonation(donation.donationType)} donor</strong><p>{new Date(donation.occurredAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</p></div>
                  <span>{formatCurrency(donation.amountCents)}</span>
                </article>
              ))}
            </div>
          )}
          <div className="member-month-record">
            <h3>Monthly record</h3>
            <p>Recorded payments, 2026–2028</p>
            {["2026", "2027", "2028"].map((year) => (
              <details className="member-year" key={year}>
                <summary>{year}</summary>
                <ul className="member-month-list">
                  {monthRange.filter((month) => month.startsWith(year)).map((month) => (
                    <li key={month}><span>{formatMonth(month)}</span><strong>{formatCurrency(monthTotals.get(month) ?? 0)}</strong></li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </PortalMemberPage>
  );
}
