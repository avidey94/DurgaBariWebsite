import Link from "next/link";

import { PortalEventsPanel } from "@/components/portal-events-panel";
import type { FamilyPortalContext } from "@/lib/portal/server";

type PortalIconName = "giving" | "pledge" | "volunteer" | "expense" | "founding" | "admin";

function PortalIcon({ name }: { name: PortalIconName }) {
  const shared = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.45,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (name === "giving") {
    return <svg {...shared}><path d="M5 3.75h14v16.5H5zM8 8h8M8 12h8M8 16h5" /></svg>;
  }
  if (name === "pledge") {
    return <svg {...shared}><path d="M12 20.2s-7.5-4.6-7.5-10.1a4.1 4.1 0 0 1 7.5-2.2 4.1 4.1 0 0 1 7.5 2.2c0 5.5-7.5 10.1-7.5 10.1Z" /></svg>;
  }
  if (name === "volunteer") {
    return <svg {...shared}><path d="M12 20v-8M12 12C7 12 5 9.5 5 5c4.5 0 7 2 7 7ZM12 15c0-4.4 2.5-6.5 7-6.5 0 4.4-2.5 6.5-7 6.5ZM8 20h8" /></svg>;
  }
  if (name === "expense") {
    return <svg {...shared}><path d="M6 3.75h9l3 3v13.5H6zM15 3.75v3h3M9 11h6M9 14.5h6M9 18h3" /></svg>;
  }
  if (name === "founding") {
    return <svg {...shared}><path d="M3.5 20h17M5.5 20V9.5L12 4l6.5 5.5V20M9.5 20v-7h5v7M4 9.5h16" /></svg>;
  }
  return <svg {...shared}><path d="M4 6h16M4 12h16M4 18h16M8 4v4M15 10v4M11 16v4" /></svg>;
}

function ArrowIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 9h11M10 4.5 14.5 9 10 13.5" /></svg>;
}

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

const formatCount = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

export function PortalMemberDashboard({
  context,
  email,
  totalDonationsCents,
}: {
  context: FamilyPortalContext;
  email: string;
  totalDonationsCents: number;
}) {
  const { family, roles } = context;
  const isFoundingFamily = family.foundingFamilyStatus !== "not_founding";
  const donorTier = family.activeDonorStatus;
  const membershipLabel = donorTier !== "none"
    ? `${donorTier[0].toUpperCase()}${donorTier.slice(1)} donor`
    : isFoundingFamily ? "Founding family" : "Member";
  const householdCount = family.adultsCount + family.childrenCount;
  const hasTeamAccess = roles.some((role) => role !== "member");

  const destinations: { href: string; icon: PortalIconName; title: string; detail: string }[] = [
    { href: "/portal/donations", icon: "giving", title: "Giving history", detail: "Recorded contributions" },
    {
      href: "/portal/pledge",
      icon: "pledge",
      title: donorTier === "none" ? "Active giving" : "Your donor commitment",
      detail: donorTier === "none" ? "Explore membership giving" : "Status and progress",
    },
    ...(isFoundingFamily
      ? [{ href: "/portal/foundingfamily", icon: "founding" as const, title: "Founding family", detail: "Pledge progress" }]
      : []),
    { href: "/portal/volunteer", icon: "volunteer", title: "Volunteer", detail: "Opportunities and signups" },
    { href: "/portal/expense", icon: "expense", title: "Expenses", detail: "Submit a reimbursement" },
    ...(hasTeamAccess
      ? [{ href: "/admin", icon: "admin" as const, title: "Site administration", detail: "Manage your areas" }]
      : []),
  ];

  return (
    <div className="member-home">
      <div className="member-home-inner">
        <header className="member-home-hero">
          <div>
            <p className="member-home-eyebrow">Durga Bari <span aria-hidden="true">/</span> Member space</p>
            <h1>Welcome back.</h1>
          </div>
          <div className="member-home-identity">
            <span>Family account</span>
            <strong>{family.familyDisplayName}</strong>
            <small>{email}</small>
          </div>
        </header>

        <section className="member-home-overview" aria-label="Account overview">
          <div>
            <p>Membership</p>
            <strong>{membershipLabel}</strong>
            {isFoundingFamily && donorTier !== "none" ? <small>Founding family</small> : null}
          </div>
          <div>
            <p>Household</p>
            <strong>{formatCount(householdCount, "person", "people")}</strong>
            <small>{formatCount(family.adultsCount, "adult", "adults")} <span aria-hidden="true">·</span> {formatCount(family.childrenCount, "child", "children")}</small>
          </div>
          <div>
            <p>Giving to date</p>
            <strong>{formatCurrency(totalDonationsCents)}</strong>
            <small>Recorded contributions</small>
          </div>
        </section>

        <div className="member-home-main">
          <section className="member-home-tools" aria-labelledby="member-tools-heading">
            <div className="member-home-section-heading">
              <h2 id="member-tools-heading">Your account</h2>
            </div>
            <nav className="member-home-links" aria-label="Member tools">
              {destinations.map((destination) => (
                <Link href={destination.href} key={destination.href}>
                  <span className="member-home-link-icon"><PortalIcon name={destination.icon} /></span>
                  <span className="member-home-link-copy">
                    <strong>{destination.title}</strong>
                    <small>{destination.detail}</small>
                  </span>
                  <ArrowIcon />
                </Link>
              ))}
            </nav>
          </section>

          <PortalEventsPanel elevated />
        </div>
      </div>
    </div>
  );
}
