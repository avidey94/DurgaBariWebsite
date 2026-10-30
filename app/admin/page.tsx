import Link from "next/link";
import { redirect } from "next/navigation";
import {
  WorkspaceIcon,
  WorkspaceNotice,
  WorkspacePageHeader,
} from "@/components/workspace/workspace-ui";
import { canAccessAdminHome, getAdminAccessContext } from "@/lib/portal/admin-auth";
import { getAdminInboxCounts } from "@/lib/portal/admin-inbox";
import { getAdminNavigation, roleNames } from "@/lib/portal/navigation";
import { isNewSitePortal } from "@/lib/portal/is-new-site";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const metadata = { title: "Team overview" };

export default async function AdminPage() {
  const access = await getAdminAccessContext();
  if (!access) redirect("/login");
  if (!canAccessAdminHome(access)) redirect("/portal");
  const counts = await getAdminInboxCounts(access).catch(() => null);
  const areas = getAdminNavigation(access.roles).filter(
    (item) => item.href !== "/admin" && item.href !== "/admin/notifications",
  );
  const staffRoles = access.roles.filter((role) => role !== "member");
  if (!(await isNewSitePortal()))
    return (
      <section className="db-shell space-y-6">
        <header className="db-panel p-6">
          <p className="db-kicker">Administration</p>
          <h1 className="db-title mt-2">Your team workspace</h1>
          <p className="mt-3">Signed in as {access.userEmail}</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              href: "/admin/notifications",
              label: "Review inbox",
              description: "Requests awaiting review",
            },
            ...areas,
          ].map((item) => (
            <Link className="db-card p-5 no-underline" key={item.href} href={item.href}>
              <h2 className="text-lg font-semibold">{item.label}</h2>
              <p className="mt-2 text-sm">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    );

  const reviewAreas = [
    ...(hasPortalPermission(access.roles, "families.manage")
      ? [
          {
            label: "Member accounts",
            count: counts?.members,
            icon: "users" as const,
            href: "/admin/notifications#member-approvals-title",
          },
        ]
      : []),
    ...(hasPortalPermission(access.roles, "events.manage")
      ? [
          {
            label: "Space requests",
            count: counts?.reservations,
            icon: "calendar" as const,
            href: "/admin/reservations",
          },
        ]
      : []),
    ...(hasPortalPermission(access.roles, "families.manage")
      ? [
          {
            label: "Donor requests",
            count: counts?.donorRequests,
            icon: "heart" as const,
            href: "/admin/notifications#donor-title",
          },
        ]
      : []),
  ];
  return (
    <>
      <WorkspacePageHeader
        eyebrow="Team overview"
        title="Your community, in good hands."
        description="Welcome to your team workspace. Keep our gatherings running, support our families, and look after the place we call home."
        action={
          <Link href="/portal" className="db-button-secondary">
            Your member space <WorkspaceIcon name="arrow" size={15} />
          </Link>
        }
      />
      <section className="workspace-overview-hero" aria-labelledby="review-summary">
        <div>
          <p className="workspace-eyebrow">Your next step</p>
          <h2 id="review-summary">
            {counts === null
              ? "Your community, at a glance."
              : counts.total > 0
                ? `${counts.total} ${counts.total === 1 ? "request needs" : "requests need"} a closer look.`
                : "A clear inbox. Room to look ahead."}
          </h2>
          <p>
            {counts === null
              ? "Open the inbox to check membership, booking, and donor requests."
              : counts.total > 0
                ? "A family joining us, a gathering taking shape. Your review helps the next chapter begin."
                : "All assigned requests have been reviewed. Explore your work areas to plan what comes next."}
          </p>
        </div>
        <Link href="/admin/notifications" className="workspace-button">
          Open review inbox <WorkspaceIcon name="arrow" size={16} />
        </Link>
      </section>
      {counts === null ? (
        <div className="mt-4">
          <WorkspaceNotice>
            Review counts are unavailable right now. Open the inbox to try again.
          </WorkspaceNotice>
        </div>
      ) : null}
      {reviewAreas.length > 0 ? (
        <div className={`workspace-inbox-summary workspace-inbox-summary-${reviewAreas.length}`}>
          {reviewAreas.map((item) => (
            <Link href={item.href} key={item.label}>
              <WorkspaceIcon name={item.icon} size={23} />
              <div>
                <strong>{item.count ?? "—"}</strong>
                <small>{item.label}</small>
              </div>
              <WorkspaceIcon name="chevron" size={14} />
            </Link>
          ))}
        </div>
      ) : null}
      <div className="workspace-section-heading">
        <div>
          <h2>Your work areas</h2>
          <p>Tools for the responsibilities entrusted to you.</p>
        </div>
        <span className="workspace-eyebrow">{areas.length} areas</span>
      </div>
      <nav className="workspace-area-grid" aria-label="Administration work areas">
        {areas.map((item) => (
          <Link className="workspace-area-card" href={item.href} key={item.href}>
            <WorkspaceIcon name={item.icon} size={24} />
            <h3>{item.label}</h3>
            <p>{item.description}</p>
            <span>
              Open workspace <WorkspaceIcon name="arrow" size={15} />
            </span>
          </Link>
        ))}
      </nav>
      <div className="workspace-role-note">
        <WorkspaceIcon name="shield" size={17} />
        <p>
          <strong>{staffRoles.map((role) => roleNames[role]).join(" · ")}</strong>
          <br />
          Your work areas reflect your assigned responsibilities. Member information and team access
          remain permission controlled.
        </p>
      </div>
    </>
  );
}
