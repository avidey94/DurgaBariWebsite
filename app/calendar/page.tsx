import Link from "next/link";

import { AvailabilityCalendar } from "@/components/availability-calendar";
import { ContentHero, ContentPageFrame } from "@/components/content-page";

export default function CalendarPage() {
  return (
    <ContentPageFrame>
      <ContentHero
        kicker="Community calendar"
        title="Durga Bari Calendar"
        subtitle="See upcoming events and when the space is already reserved. Private gatherings appear only as busy times."
      />
      <div className="mt-6 space-y-5">
        <AvailabilityCalendar />
        <div className="db-card flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-sm text-[var(--db-text-soft)]">Want to host a private gathering? Members can request a date and time.</p>
          <Link href="/reserve-an-event" className="db-button-primary px-5 py-3 text-sm no-underline">Reserve an Event</Link>
        </div>
      </div>
    </ContentPageFrame>
  );
}
