import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

import { AvailabilityCalendar } from "@/components/availability-calendar";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const metadata = { title: "Shared calendar" };

export default async function AdminCalendarPage() {
  const access = await getAdminAccessContext();
  if (!access) redirect("/login");
  if (!hasPortalPermission(access.roles, "events.manage")) redirect("/admin");

  return (
    <section className="workspace-domain-page db-shell space-y-6">
      <WorkspacePageHeader
        eyebrow="Gatherings"
        title="Shared calendar"
        description="See public events, private gatherings, and approved reservations together. Pending requests do not reserve space."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/events" className="db-button-secondary">
              Manage events
            </Link>
            <Link href="/admin/reservations" className="db-button-primary">
              Review reservations
            </Link>
          </div>
        }
      />
      <AvailabilityCalendar admin />
    </section>
  );
}
