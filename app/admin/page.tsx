import Link from "next/link";
import { redirect } from "next/navigation";

import { canAccessAdminHome, getAdminAccessContext } from "@/lib/portal/admin-auth";
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

  const tiles: AdminTile[] = [];

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
      href: "/admin/events",
      title: "Events",
      description: "Manage events, RSVPs, and attendance breakdowns.",
    });
  }

  if (hasPortalPermission(access.roles, "roles.read_all") || hasPortalPermission(access.roles, "roles.manage")) {
    tiles.push({
      href: "/admin/roles",
      title: "Roles",
      description: "Manage member profiles and role assignments.",
    });
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
