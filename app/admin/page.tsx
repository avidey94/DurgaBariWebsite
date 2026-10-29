import Link from "next/link";
import { redirect } from "next/navigation";

import { PortalArrow, PortalMemberPage } from "@/components/portal-member-page";
import { canAccessAdminHome, getAdminAccessContext } from "@/lib/portal/admin-auth";
import { getAdminInboxCounts } from "@/lib/portal/admin-inbox";
import { isNewSitePortal } from "@/lib/portal/is-new-site";
import { hasPortalPermission } from "@/lib/portal/rbac";

interface AdminTile {
  href: string;
  title: string;
  description: string;
}

export default async function AdminPage() {
  const access = await getAdminAccessContext();

  if (!access) {
    redirect("/login");
  }

  if (!canAccessAdminHome(access)) {
    redirect("/portal");
  }

  const notificationCount = await getAdminInboxCounts(access).then((counts) => counts.total).catch(() => 0);
  const tiles: AdminTile[] = [{
    href: "/admin/notifications",
    title: notificationCount > 0 ? `Notifications (${notificationCount})` : "Notifications",
    description: "Review new member accounts, event reservations, and donor tier requests.",
  }];

  if (hasPortalPermission(access.roles, "donations.manage")) {
    tiles.push({
      href: "/admin/donations",
      title: "Donations",
      description: "Reconcile, classify, and edit donation ledger entries.",
    });
  }

  if (hasPortalPermission(access.roles, "expenses.manage")) {
    tiles.push({
      href: "/admin/expenses",
      title: "Expenses",
      description: "Track operating costs, invoices, reimbursements, and finance approvals.",
    });
  }

  if (hasPortalPermission(access.roles, "projects.manage")) {
    tiles.push({
      href: "/admin/projects",
      title: "Projects",
      description: "Create and manage Kickstarter-style funding projects.",
    });
  }

  if (hasPortalPermission(access.roles, "events.manage")) {
    tiles.push({
      href: "/admin/calendar",
      title: "Central Calendar",
      description: "See all public events, private space blocks, and approved reservations together.",
    });
    tiles.push({
      href: "/admin/events",
      title: "Events",
      description: "Manage events, RSVPs, and attendance breakdowns.",
    });
    tiles.push({
      href: "/admin/reservations",
      title: "Event Reservations",
      description: "Review private space requests and verify Zeffy payments before approval.",
    });
  }

  if (hasPortalPermission(access.roles, "roles.read_all") || hasPortalPermission(access.roles, "roles.manage")) {
    tiles.push({
      href: "/admin/roles",
      title: "Roles",
      description: "Manage member profiles and role assignments.",
    });
  }

  if (await isNewSitePortal()) {
    const details: Record<string, string> = {
      "/admin/notifications": "Requests awaiting review",
      "/admin/donations": "Records and reconciliation",
      "/admin/expenses": "Approvals and reimbursements",
      "/admin/projects": "Funding campaigns",
      "/admin/calendar": "Events and space use",
      "/admin/events": "Event details and RSVPs",
      "/admin/reservations": "Private space requests",
      "/admin/roles": "Member access",
    };

    return (
      <PortalMemberPage title="Site administration" eyebrow="Team tools">
        <section className="member-section" aria-labelledby="admin-areas-heading">
          <div className="member-section-heading"><h2 id="admin-areas-heading">Your work areas</h2></div>
          <nav className="member-admin-links" aria-label="Administration areas">
            {tiles.map((tile, index) => (
              <Link href={tile.href} key={tile.href}>
                <span className="member-admin-index">{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{tile.title}</strong><small>{details[tile.href] ?? tile.description}</small></span>
                <PortalArrow />
              </Link>
            ))}
          </nav>
        </section>
      </PortalMemberPage>
    );
  }

  return (
    <section className="db-shell max-w-6xl space-y-6">
      <header className="db-panel p-6 md:p-8">
        <p className="db-kicker">Administration</p>
        <h1 className="db-title mt-3">Admin Console</h1>
        <p className="mt-3 text-sm text-[var(--db-text-soft)]">
          Signed in as <strong>{access.userEmail}</strong>
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-[var(--db-text-soft)]">Roles: {access.roles.join(", ")}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="db-card p-5 no-underline transition hover:-translate-y-px"
          >
            <h2 className="text-lg font-semibold text-[var(--db-text)]">{tile.title}</h2>
            <p className="mt-2 text-sm text-[var(--db-text-soft)]">{tile.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
