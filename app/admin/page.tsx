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

  if (hasPortalPermission(access.roles, "roles.manage")) {
    tiles.push({
      href: "/admin/roles",
      title: "Roles",
      description: "Role administration is planned for the next phase.",
    });
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Admin Console</h1>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as <strong>{access.userEmail}</strong>
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Roles: {access.roles.join(", ")}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <h2 className="text-lg font-semibold text-slate-900">{tile.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{tile.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
