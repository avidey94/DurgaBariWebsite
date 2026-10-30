import Link from "next/link";

import { PortalEventsPanel } from "@/components/portal-events-panel";
import { MemberIcon, PortalArrow, type MemberIconName } from "@/components/portal-member-page";
import type { FamilyPortalContext } from "@/lib/portal/server";

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

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
  const hasTeamAccess = roles.some((role) => role !== "member");
  const membershipLabel =
    donorTier !== "none"
      ? `${donorTier[0].toUpperCase()}${donorTier.slice(1)} active donor`
      : "Community member";
  const initials = family.familyDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("");
  const tasks: {
    href: string;
    icon: MemberIconName;
    title: string;
    detail: string;
    label: string;
  }[] = [
    {
      href: "/portal/donations",
      icon: "giving",
      title: "Your giving",
      detail: "A clear record of your family’s contributions to Durga Bari.",
      label: "View history",
    },
    {
      href: "/portal/pledge",
      icon: "heart",
      title: donorTier === "none" ? "Give with intention" : "Active donor program",
      detail:
        donorTier === "none"
          ? "Make lasting support part of your monthly rhythm."
          : "Manage your donor level and follow your monthly giving.",
      label: donorTier === "none" ? "Explore active giving" : "View commitment",
    },
    {
      href: "/portal/volunteer",
      icon: "volunteer",
      title: "A place to serve",
      detail: "Find an opportunity and volunteer together as a family.",
      label: "Find opportunities",
    },
    {
      href: "/portal/expense",
      icon: "receipt",
      title: "Reimbursements",
      detail: "Submit a project expense and follow its review.",
      label: "Manage expenses",
    },
  ];

  return (
    <div className="member-home">
      <div className="member-home-inner">
        <header className="member-home-hero">
          <div>
            <p className="member-home-eyebrow">Your community, closer</p>
            <h1>A little more connected.</h1>
            <p className="member-home-intro">
              Welcome to your member space. Come together, give back, and stay part of what’s next.
            </p>
          </div>
          <Link href="/calendar" className="member-primary-action">
            <MemberIcon name="calendar" size={18} /> Explore the calendar <PortalArrow />
          </Link>
        </header>

        <section className="member-family-card" aria-label="Your family account">
          <div className="member-family-identity">
            <span className="member-family-avatar" aria-hidden="true">
              {initials || "DB"}
            </span>
            <div>
              <p className="member-home-eyebrow">Family account</p>
              <h2>{family.familyDisplayName}</h2>
              <p>{email}</p>
            </div>
          </div>
          <div className="member-family-membership">
            <span className="member-badge">
              <span aria-hidden="true" />
              {membershipLabel}
            </span>
            {isFoundingFamily ? (
              <span className="member-family-founding">Founding family</span>
            ) : null}
          </div>
          <details className="member-family-details">
            <summary>
              Household details <span aria-hidden="true">+</span>
            </summary>
            <div>
              <p>
                <strong>
                  {family.adultsCount} {family.adultsCount === 1 ? "adult" : "adults"}
                </strong>
                {family.adultNames.length > 0 ? family.adultNames.join(", ") : "No names on file"}
              </p>
              <p>
                <strong>
                  {family.childrenCount} {family.childrenCount === 1 ? "child" : "children"}
                </strong>
                {family.childNames.length > 0 ? family.childNames.join(", ") : "No children listed"}
              </p>
              <p>
                <strong>Contact</strong>
                {family.phoneNumber || family.primaryEmail}
              </p>
            </div>
          </details>
        </section>

        <div className="member-home-overview" aria-label="Your account at a glance">
          <div>
            <span className="member-overview-icon">
              <MemberIcon name="giving" size={20} />
            </span>
            <div>
              <p>Giving to date</p>
              <strong>{formatCurrency(totalDonationsCents)}</strong>
              <small>Recorded for your family</small>
            </div>
          </div>
          <div>
            <span className="member-overview-icon">
              <MemberIcon name="people" size={20} />
            </span>
            <div>
              <p>Your household</p>
              <strong>
                {family.adultsCount + family.childrenCount} <em>members</em>
              </strong>
              <small>
                {family.adultsCount} {family.adultsCount === 1 ? "adult" : "adults"} ·{" "}
                {family.childrenCount} {family.childrenCount === 1 ? "child" : "children"}
              </small>
            </div>
          </div>
          <div>
            <span className="member-overview-icon">
              <MemberIcon name="heart" size={20} />
            </span>
            <div>
              <p>Active giving</p>
              <strong>
                {donorTier === "none"
                  ? "Open to everyone"
                  : `${donorTier[0].toUpperCase()}${donorTier.slice(1)} level`}
              </strong>
              <small>
                {family.requestedActiveDonorStatus
                  ? "Tier request under review"
                  : donorTier === "none"
                    ? "Find a level that feels right"
                    : "Thank you for your ongoing support"}
              </small>
            </div>
          </div>
        </div>

        <div className="member-home-main">
          <section className="member-home-tools" aria-labelledby="member-tools-heading">
            <div className="member-home-section-heading">
              <p className="member-home-eyebrow">Make yourself at home</p>
              <h2 id="member-tools-heading">Your next connection</h2>
            </div>
            <nav className="member-task-grid" aria-label="Member activities">
              {tasks.map((task) => (
                <Link href={task.href} key={task.href} className="member-task-card">
                  <span className="member-task-icon">
                    <MemberIcon name={task.icon} />
                  </span>
                  <h3>{task.title}</h3>
                  <p>{task.detail}</p>
                  <span className="member-task-link">
                    {task.label}
                    <PortalArrow />
                  </span>
                </Link>
              ))}
            </nav>
            {isFoundingFamily ? (
              <Link href="/portal/foundingfamily" className="member-foundation-banner">
                <span className="member-task-icon">
                  <MemberIcon name="home" />
                </span>
                <div>
                  <strong>Building our home, together.</strong>
                  <p>Follow your founding family pledge and monthly progress.</p>
                </div>
                <PortalArrow />
              </Link>
            ) : null}
            {hasTeamAccess ? (
              <Link href="/admin" className="member-team-banner">
                <MemberIcon name="settings" size={20} />
                <span>
                  <strong>Serving on the team?</strong> Open your administration workspace.
                </span>
                <PortalArrow />
              </Link>
            ) : null}
          </section>
          <PortalEventsPanel elevated />
        </div>
        <aside className="member-help-note">
          <MemberIcon name="people" size={20} />
          <p>
            Need a hand with your account or a giving record?{" "}
            <Link href="/contact">
              Get in touch with Durga Bari <PortalArrow diagonal />
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
