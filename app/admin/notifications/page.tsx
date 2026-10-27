import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminAccessContext, canAccessAdminHome } from "@/lib/portal/admin-auth";
import { getAdminInboxCounts, getAdminInboxItems } from "@/lib/portal/admin-inbox";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const dynamic = "force-dynamic";

interface NotificationsPageProps {
  searchParams: Promise<{ review?: string }>;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));

export default async function AdminNotificationsPage({ searchParams }: NotificationsPageProps) {
  const access = await getAdminAccessContext();
  if (!access) redirect("/login");
  if (!canAccessAdminHome(access)) redirect("/portal");

  const { review } = await searchParams;
  const canManageMembers = hasPortalPermission(access.roles, "families.manage");
  const canManageEvents = hasPortalPermission(access.roles, "events.manage");
  const canDelegate = hasPortalPermission(access.roles, "roles.manage");

  let inbox;
  let counts;
  try {
    [inbox, counts] = await Promise.all([getAdminInboxItems(access), getAdminInboxCounts(access)]);
  } catch {
    return (
      <section className="db-shell max-w-5xl">
        <div className="db-panel p-6">
          <h1 className="db-title">Admin Notifications</h1>
          <p role="alert" className="mt-4 text-red-700">
            Notifications could not load. Please refresh this page.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="db-shell max-w-5xl space-y-6">
      <header className="db-panel p-6 md:p-8">
        <p className="db-kicker">Administration</p>
        <h1 className="db-title mt-2">Notifications</h1>
        <p className="mt-3 text-sm text-[var(--db-text-soft)]">
          Requests stay here until someone reviews them. This list updates when you open or refresh
          the page.
        </p>
        <p className="mt-4 text-lg font-semibold text-[var(--db-text)]" aria-live="polite">
          {counts.total === 0
            ? "All caught up"
            : `${counts.total} ${counts.total === 1 ? "item needs" : "items need"} review`}
        </p>
      </header>

      {review === "approved" ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm font-medium text-emerald-900"
        >
          Member access approved. They can refresh the portal to use member features.
        </p>
      ) : null}
      {review === "stale" ? (
        <p
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          This account was already reviewed or its profile is incomplete. The list has been
          refreshed.
        </p>
      ) : null}
      {review === "error" ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900"
        >
          Approval could not be saved. Please try again.
        </p>
      ) : null}

      {canManageMembers ? (
        <section className="space-y-3" aria-labelledby="member-approvals-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="member-approvals-title"
              className="text-2xl font-semibold text-[var(--db-text)]"
            >
              New member accounts{" "}
              <span className="text-base text-[var(--db-text-soft)]">({counts.members})</span>
            </h2>
            {canDelegate ? (
              <Link href="/admin/roles" className="text-sm font-semibold underline">
                Manage approvers
              </Link>
            ) : null}
          </div>
          {inbox.members.length === 0 ? (
            <p className="db-card p-5 text-sm">No member accounts are waiting for approval.</p>
          ) : null}
          {inbox.members.map((member) => (
            <article key={member.id} className="db-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--db-text)]">
                    {member.family_display_name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--db-text-soft)]">{member.primary_email}</p>
                  <p className="mt-1 text-xs text-[var(--db-text-soft)]">
                    Account created {formatDate(member.created_at)} Pacific
                  </p>
                </div>
                <span className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                  Pending
                </span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold">Adults</dt>
                  <dd>{member.adult_names.join(", ") || member.adults_count}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Children</dt>
                  <dd>{member.child_names.join(", ") || member.children_count}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Phone</dt>
                  <dd>{member.phone_number || "Not provided"}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <form action="/api/admin/member-approvals" method="post">
                  <input type="hidden" name="familyId" value={member.id} />
                  <button type="submit" className="db-button-primary text-sm">
                    Approve member
                  </button>
                </form>
                <Link
                  href={`/admin/roles#family-${member.id}`}
                  className="text-sm font-semibold underline"
                >
                  Review full profile
                </Link>
              </div>
            </article>
          ))}
          {canDelegate ? (
            <p className="text-sm text-[var(--db-text-soft)]">
              A super admin can give a trusted person the Membership Manager role in Roles. That
              role can approve members and manage family profiles and donor tier requests, but
              cannot assign roles.
            </p>
          ) : null}
        </section>
      ) : null}

      {canManageEvents ? (
        <section className="space-y-3" aria-labelledby="reservation-title">
          <h2 id="reservation-title" className="text-2xl font-semibold text-[var(--db-text)]">
            Event reservations{" "}
            <span className="text-base text-[var(--db-text-soft)]">({counts.reservations})</span>
          </h2>
          {inbox.reservations.length === 0 ? (
            <p className="db-card p-5 text-sm">No event reservations are waiting for review.</p>
          ) : null}
          {inbox.reservations.map((reservation) => (
            <article key={reservation.id} className="db-card p-5">
              <h3 className="text-lg font-semibold">{reservation.event_title}</h3>
              <p className="mt-1 text-sm text-[var(--db-text-soft)]">
                {reservation.email} · {reservation.booking_reference}
              </p>
              <p className="mt-1 text-sm">
                {reservation.event_date}, {reservation.start_time.slice(0, 5)}–
                {reservation.end_time.slice(0, 5)} Pacific
              </p>
              <Link
                href={`/admin/reservations#reservation-${reservation.id}`}
                className="mt-3 inline-block text-sm font-semibold underline"
              >
                Review payment and reservation
              </Link>
            </article>
          ))}
        </section>
      ) : null}

      {canManageMembers ? (
        <section className="space-y-3" aria-labelledby="donor-title">
          <h2 id="donor-title" className="text-2xl font-semibold text-[var(--db-text)]">
            Donor tier requests{" "}
            <span className="text-base text-[var(--db-text-soft)]">({counts.donorRequests})</span>
          </h2>
          {inbox.donorRequests.length === 0 ? (
            <p className="db-card p-5 text-sm">No donor tier requests are waiting for review.</p>
          ) : null}
          {inbox.donorRequests.map((donor) => (
            <article key={donor.id} className="db-card p-5">
              <h3 className="text-lg font-semibold">{donor.family_display_name}</h3>
              <p className="mt-1 text-sm text-[var(--db-text-soft)]">{donor.primary_email}</p>
              <p className="mt-1 text-sm">Requested {donor.requested_active_donor_status} status</p>
              <Link
                href={`/admin/roles#family-${donor.id}`}
                className="mt-3 inline-block text-sm font-semibold underline"
              >
                Review tier request
              </Link>
            </article>
          ))}
        </section>
      ) : null}

      {!canManageMembers && !canManageEvents ? (
        <p className="db-card p-5 text-sm">No approval queues are assigned to your admin role.</p>
      ) : null}
    </section>
  );
}
