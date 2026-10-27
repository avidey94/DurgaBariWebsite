import Link from "next/link";
import { redirect } from "next/navigation";

import { AvailabilityCalendar } from "@/components/availability-calendar";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export default async function AdminCalendarPage() {
  const access = await getAdminAccessContext();
  if (!access) redirect("/login");
  if (!hasPortalPermission(access.roles, "events.manage")) redirect("/admin");

  return (
    <section className="db-shell max-w-6xl space-y-6">
      <header className="db-panel p-6">
        <p className="db-kicker">Administration</p>
        <h1 className="db-title mt-2">Central Calendar</h1>
        <p className="mt-2 text-sm text-[var(--db-text-soft)]">Public and private events share this calendar with approved member reservations. Draft events and pending requests do not block space.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/events" className="db-button-secondary px-4 py-2 text-sm no-underline">Manage events</Link>
          <Link href="/admin/reservations" className="db-button-secondary px-4 py-2 text-sm no-underline">Review reservations</Link>
        </div>
      </header>
      <AvailabilityCalendar admin />
    </section>
  );
}
