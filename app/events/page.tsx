import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DurgacenterEventListPage } from "@/components/DurgacenterEventListPage";
import type { DurgacenterEventSummary } from "@/components/DurgacenterEventListPage";
import { resolveSiteTheme, SITE_VIEW_COOKIE } from "@/lib/site-theme";

interface SourceEvent {
  title: string;
  start_date: string;
  end_date: string;
  url: string;
  featured: boolean;
}

const fallbackEvents: SourceEvent[] = [{
  title: "Laxmi Puja",
  start_date: "2026-10-24 19:30:00",
  end_date: "2026-10-24 22:00:00",
  url: "https://thedurgacenter.org/event/laxmi-puja/",
  featured: true,
}];

function eventDate(dateTime: string) {
  const [date, time] = dateTime.split(" ");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return { year, month, day, hour, minute };
}

function formatTime(hour: number, minute: number) {
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "am" : "pm"}`;
}

function summarizeEvent(event: SourceEvent): DurgacenterEventSummary {
  const start = eventDate(event.start_date);
  const end = eventDate(event.end_date);
  const date = new Date(Date.UTC(start.year, start.month - 1, start.day));
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date);
  return {
    title: event.title.replace(/&#038;|&amp;/g, "&").replace(/&#8217;/g, "’"),
    date: `${monthName} ${start.year}`,
    day: String(start.day),
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(date).toUpperCase(),
    time: `${monthName} ${start.day} @ ${formatTime(start.hour, start.minute)} - ${formatTime(end.hour, end.minute)}`,
    url: event.url,
    featured: event.featured,
  };
}

async function getSourceEvents(): Promise<DurgacenterEventSummary[]> {
  try {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 31);
    const end = new Date();
    end.setUTCFullYear(end.getUTCFullYear() + 1);
    const params = new URLSearchParams({
      per_page: "100",
      start_date: `${start.toISOString().slice(0, 10)} 00:00:00`,
      end_date: `${end.toISOString().slice(0, 10)} 23:59:59`,
    });
    const response = await fetch(`https://thedurgacenter.org/wp-json/tribe/events/v1/events?${params}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Event feed unavailable");
    const data = (await response.json()) as { events?: SourceEvent[] };
    const sourceEvents = (data.events ?? [])
      .filter((event) => event.title && event.start_date && event.end_date && event.url)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    if (sourceEvents.length === 0) return [];
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = sourceEvents.filter((event) => event.start_date.slice(0, 10) >= today);
    const selected = upcoming.length > 0 ? upcoming : [sourceEvents[sourceEvents.length - 1]];
    return selected.map(summarizeEvent);
  } catch {
    return fallbackEvents.map(summarizeEvent);
  }
}

export default async function EventsPage() {
  const theme = resolveSiteTheme((await cookies()).get(SITE_VIEW_COOKIE)?.value);
  if (theme !== "durgacenter") redirect("/events-festivals");
  const events = await getSourceEvents();
  return <DurgacenterEventListPage events={events} />;
}

export const metadata = { title: "Events" };
