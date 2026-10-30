import type { Metadata, Viewport } from "next";
import { CalendarHub } from "@/components/calendar/CalendarHub";
import { getCalendarMonth } from "@/lib/events/hub-server";
import { eventTypes, pacificDay, shiftMonth, validMonth } from "@/lib/events/hub";

export const metadata: Metadata = {
  title: "Community Calendar",
  description:
    "Worship, festivals, and time together. Explore the Durga Bari calendar, find your next gathering, and RSVP as a member.",
  alternates: { canonical: "/calendar" },
  manifest: "/calendar/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Durga Bari", statusBarStyle: "default" },
  icons: { apple: "/calendar/icon-192.png" },
};
export const viewport: Viewport = {
  themeColor: "#191713",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    monthOffset?: string;
    view?: string;
    event?: string;
    date?: string;
    day?: string;
    eventType?: string;
    q?: string;
    panel?: string;
    scope?: string;
  }>;
}) {
  const params = await searchParams;
  const today = pacificDay(new Date().toISOString());
  const requestedDay = params.date ?? params.day;
  const day =
    requestedDay &&
    /^\d{4}-\d{2}-\d{2}$/.test(requestedDay) &&
    !Number.isNaN(Date.parse(`${requestedDay}T12:00:00Z`)) &&
    new Date(`${requestedDay}T12:00:00Z`).toISOString().slice(0, 10) === requestedDay
      ? requestedDay
      : undefined;
  const offset = Number.parseInt(params.monthOffset ?? "0", 10);
  const month =
    params.month && validMonth(params.month)
      ? params.month
      : day && validMonth(day.slice(0, 7))
        ? day.slice(0, 7)
        : shiftMonth(
            today.slice(0, 7),
            Number.isFinite(offset) && Math.abs(offset) < 1200 ? offset : 0,
          );
  let initialData = null;
  try {
    initialData = await getCalendarMonth(month);
  } catch {
    /* The client offers retry without inventing an empty schedule. */
  }
  return (
    <CalendarHub
      initialData={initialData}
      initialMonth={month}
      today={today}
      initialView={params.view === "agenda" || params.view === "list" ? "agenda" : "month"}
      initialEvent={params.event}
      initialDay={day?.startsWith(month) ? day : undefined}
      initialType={params.eventType && params.eventType in eventTypes ? params.eventType : ""}
      initialQuery={params.q ?? ""}
      initialError={!initialData}
      initialDayOpen={params.panel === "day"}
      initialScope={params.scope === "mine" ? "mine" : "all"}
    />
  );
}
