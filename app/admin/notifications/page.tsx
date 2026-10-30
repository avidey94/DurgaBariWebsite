import Link from "next/link";
import { redirect } from "next/navigation";
import {
  WorkspaceEmpty,
  WorkspaceIcon,
  WorkspaceNotice,
  WorkspacePageHeader,
} from "@/components/workspace/workspace-ui";
import { getAdminAccessContext, canAccessAdminHome } from "@/lib/portal/admin-auth";
import { getAdminInboxCounts, getAdminInboxItems } from "@/lib/portal/admin-inbox";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const dynamic = "force-dynamic";
interface Props {
  searchParams: Promise<{ review?: string }>;
}
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
const formatDay = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );

export const metadata = { title: "Review inbox" };

export default async function AdminNotificationsPage({ searchParams }: Props) {
  const access = await getAdminAccessContext();
  if (!access) redirect("/login");
  if (!canAccessAdminHome(access)) redirect("/portal");
  const { review } = await searchParams;
  const canMembers = hasPortalPermission(access.roles, "families.manage");
  const canEvents = hasPortalPermission(access.roles, "events.manage");
  const canDelegate = hasPortalPermission(access.roles, "roles.manage");
  const result = await Promise.all([getAdminInboxItems(access), getAdminInboxCounts(access)]).catch(
    () => null,
  );
  const header = (
    <WorkspacePageHeader
      eyebrow="Community care"
      title="Review inbox"
      description="New families, private gatherings, and donor requests come here for a thoughtful review. Each request stays until it’s resolved."
      action={
        <a href="/admin/notifications" className="db-button-secondary">
          Refresh inbox <WorkspaceIcon name="inbox" size={16} />
        </a>
      }
    />
  );
  if (!result)
    return (
      <section className="workspace-domain-page db-shell">
        {header}
        <WorkspaceEmpty
          icon="inbox"
          eyebrow="Please try again"
          title="We couldn’t open your inbox."
          description="Your requests are safe. Refresh this page to reconnect and continue your review."
          action={
            <a href="/admin/notifications" className="db-button-primary">
              Try again <WorkspaceIcon name="arrow" size={16} />
            </a>
          }
        />
      </section>
    );
  const [inbox, counts] = result;
  return (
    <section className="workspace-domain-page db-shell">
      {header}
      {review === "approved" ? (
        <WorkspaceNotice tone="success">
          Member access approved. The family can refresh their portal to get started.
        </WorkspaceNotice>
      ) : review === "stale" ? (
        <WorkspaceNotice>
          This account was already reviewed or needs a completed profile. Your inbox is up to date.
        </WorkspaceNotice>
      ) : review === "error" ? (
        <WorkspaceNotice tone="error">
          Approval couldn’t be saved. Please try again.
        </WorkspaceNotice>
      ) : null}
      <div className="workspace-workflow" aria-label="Review process">
        <div>
          <b>1</b> Review the request
        </div>
        <div>
          <b>2</b> Check the details
        </div>
        <div>
          <b>3</b> Approve or follow up
        </div>
      </div>
      {counts.total === 0 ? (
        <WorkspaceEmpty
          icon="check"
          eyebrow="You’re all caught up"
          title="You’re all caught up."
          description={
            canMembers || canEvents
              ? "New requests will appear here when a family joins, a gathering is requested, or someone asks to join a donor circle. In the meantime, there’s room to plan ahead."
              : "You don’t have approval queues assigned to your role. Your other tools are ready in the team workspace."
          }
          action={
            <Link href="/admin" className="db-button-primary">
              Explore your work areas <WorkspaceIcon name="arrow" size={16} />
            </Link>
          }
        />
      ) : (
        <>
          <p className="workspace-eyebrow" aria-live="polite">
            {counts.total} {counts.total === 1 ? "request" : "requests"} awaiting review
          </p>
          {canMembers && inbox.members.length > 0 ? (
            <section aria-labelledby="member-approvals-title">
              <div className="workspace-section-heading">
                <div>
                  <h2 id="member-approvals-title">
                    Welcome a new family <span className="workspace-status">{counts.members}</span>
                  </h2>
                  <p>Confirm their profile before opening member access.</p>
                </div>
                {canDelegate ? (
                  <Link href="/admin/roles" className="workspace-text-link">
                    Manage approvers <WorkspaceIcon name="arrow" size={14} />
                  </Link>
                ) : null}
              </div>
              <div className="workspace-review-list">
                {inbox.members.map((member) => (
                  <article className="workspace-review-card" key={member.id}>
                    <div className="workspace-review-card-top">
                      <div>
                        <h3>{member.family_display_name}</h3>
                        <p>{member.primary_email}</p>
                        <p>Joined {formatDate(member.created_at)} Pacific</p>
                      </div>
                      <span className="workspace-status">New member</span>
                    </div>
                    <dl>
                      <div>
                        <dt>Adults</dt>
                        <dd>{member.adult_names?.join(", ") || member.adults_count}</dd>
                      </div>
                      <div>
                        <dt>Children</dt>
                        <dd>{member.child_names?.join(", ") || member.children_count}</dd>
                      </div>
                      <div>
                        <dt>Phone</dt>
                        <dd>{member.phone_number || "Not provided"}</dd>
                      </div>
                    </dl>
                    <div className="workspace-review-card-actions">
                      <form action="/api/admin/member-approvals" method="post">
                        <input type="hidden" name="familyId" value={member.id} />
                        <button type="submit" className="db-button-primary">
                          <WorkspaceIcon name="check" size={15} />
                          Approve membership
                        </button>
                      </form>
                      <Link
                        href={`/admin/roles#family-${member.id}`}
                        className="workspace-text-link"
                      >
                        Review family profile <WorkspaceIcon name="arrow" size={14} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          {canEvents && inbox.reservations.length > 0 ? (
            <section aria-labelledby="reservation-title">
              <div className="workspace-section-heading">
                <div>
                  <h2 id="reservation-title">
                    Make room for a gathering{" "}
                    <span className="workspace-status">{counts.reservations}</span>
                  </h2>
                  <p>Verify the payment and booking details before confirming the space.</p>
                </div>
              </div>
              <div className="workspace-review-list">
                {inbox.reservations.map((item) => (
                  <article className="workspace-review-card" key={item.id}>
                    <div className="workspace-review-card-top">
                      <div>
                        <p className="workspace-eyebrow">{item.booking_reference}</p>
                        <h3>{item.event_title}</h3>
                        <p>
                          {formatDay(item.event_date)} · {item.start_time.slice(0, 5)}–
                          {item.end_time.slice(0, 5)} Pacific
                        </p>
                        <p>{item.email}</p>
                      </div>
                      <span className="workspace-status">Payment review</span>
                    </div>
                    <div className="workspace-review-card-actions">
                      <Link
                        href={`/admin/reservations#reservation-${item.id}`}
                        className="db-button-primary"
                      >
                        Review reservation <WorkspaceIcon name="arrow" size={15} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          {canMembers && inbox.donorRequests.length > 0 ? (
            <section aria-labelledby="donor-title">
              <div className="workspace-section-heading">
                <div>
                  <h2 id="donor-title">
                    Grow our donor circle{" "}
                    <span className="workspace-status">{counts.donorRequests}</span>
                  </h2>
                  <p>Check the requested level against the family’s giving records.</p>
                </div>
              </div>
              <div className="workspace-review-list">
                {inbox.donorRequests.map((item) => (
                  <article className="workspace-review-card" key={item.id}>
                    <div className="workspace-review-card-top">
                      <div>
                        <h3>{item.family_display_name}</h3>
                        <p>{item.primary_email}</p>
                        <p>
                          Requested{" "}
                          <strong className="capitalize">
                            {item.requested_active_donor_status}
                          </strong>{" "}
                          donor status
                        </p>
                      </div>
                      <WorkspaceIcon name="heart" size={22} />
                    </div>
                    <div className="workspace-review-card-actions">
                      <Link href={`/admin/roles#family-${item.id}`} className="db-button-primary">
                        Review donor request <WorkspaceIcon name="arrow" size={15} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
      <div className="workspace-role-note">
        <WorkspaceIcon name="shield" size={17} />
        <p>
          Only requests assigned to your role appear here. This inbox refreshes when you open or
          reload the page.
          {counts.total > 100
            ? " Each category shows up to 100 requests at a time; reviewing them brings more into view."
            : ""}
        </p>
      </div>
    </section>
  );
}
