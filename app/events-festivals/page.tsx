import Link from "next/link";

import { ContentHero, ContentPageFrame } from "@/components/content-page";
import { computeVisibilityForUser, listCalendarEvents } from "@/lib/events/server";

const eventTypeLabel: Record<string, string> = {
  darshan: "Darshan",
  ritual: "Ritual",
  festival: "Festival",
  community: "Community",
  volunteer: "Volunteer",
  special: "Special",
};

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const dayFormatter = new Intl.DateTimeFormat("en-US", { day: "2-digit" });
const dateLineFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

interface EventsFestivalsPageProps {
  searchParams: Promise<{
    eventType?: string;
    q?: string;
    view?: "list" | "day";
    monthOffset?: string;
    day?: string;
  }>;
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const dayKey = (value: string) => new Date(value).toISOString().slice(0, 10);

const formatTimeRange = (startIso: string, endIso: string | null, allDay: boolean) => {
  if (allDay) return "All day";
  const start = new Date(startIso);
  if (!endIso) return `${dateLineFormatter.format(start)}`;
  const end = new Date(endIso);
  return `${dateLineFormatter.format(start)} - ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
};

export default async function EventsFestivalsPage({ searchParams }: EventsFestivalsPageProps) {
  const params = await searchParams;
  const selectedType = (params.eventType ?? "").trim().toLowerCase();
  const query = (params.q ?? "").trim().toLowerCase();
  const view = params.view === "day" ? "day" : "list";
  const monthOffset = Number.parseInt(params.monthOffset ?? "0", 10) || 0;

  const now = new Date();
  const anchorMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const from = startOfMonth(new Date(anchorMonth.getFullYear(), anchorMonth.getMonth(), 1));
  const to = endOfMonth(new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + 4, 1));
  const visibility = await computeVisibilityForUser();

  const allOccurrences = await listCalendarEvents({
    includeDraft: false,
    includePrivate: visibility.includePrivate,
    includeMembers: visibility.includeMembers,
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
  });

  const occurrences = allOccurrences
    .filter((entry) => {
      if (entry.event.visibility === "private" && !visibility.includePrivate) return false;
      if (entry.event.visibility === "members" && !visibility.includeMembers) return false;
      if (selectedType && entry.event.event_type !== selectedType) return false;
      if (!query) return true;

      const haystack = [
        entry.event.title,
        entry.event.short_summary ?? "",
        entry.event.full_description ?? "",
        entry.event.location ?? "",
        eventTypeLabel[entry.event.event_type] ?? entry.event.event_type,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    })
    .sort((a, b) => new Date(a.occurrenceStart).getTime() - new Date(b.occurrenceStart).getTime());

  const availableTypes = Array.from(new Set(allOccurrences.map((entry) => entry.event.event_type))).sort();

  const groupedByMonth = occurrences.reduce<Map<string, typeof occurrences>>((map, entry) => {
    const monthKey = monthFormatter.format(new Date(entry.occurrenceStart));
    map.set(monthKey, [...(map.get(monthKey) ?? []), entry]);
    return map;
  }, new Map());

  const dayParam = params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) ? params.day : null;
  const selectedDay = dayParam ?? dayKey(occurrences[0]?.occurrenceStart ?? now.toISOString());
  const dayOccurrences = occurrences.filter((entry) => dayKey(entry.occurrenceStart) === selectedDay);

  const urlFor = (overrides: Record<string, string | number | null>) => {
    const search = new URLSearchParams();

    const next: Record<string, string | number | null> = {
      eventType: selectedType || null,
      q: query || null,
      view,
      monthOffset,
      day: dayParam,
      ...overrides,
    };

    Object.entries(next).forEach(([key, value]) => {
      if (value === null || value === "") return;
      search.set(key, String(value));
    });

    return `/events-festivals?${search.toString()}`;
  };

  const monthEntries = Array.from(groupedByMonth.entries());

  return (
    <ContentPageFrame>
      <ContentHero
        title="Events & Festivals"
        subtitle="Temple calendar, recurring rituals, and special celebrations"
        kicker="Community Calendar"
      />

      <div className="db-card mt-5 space-y-5 p-5 md:p-7">
        <form className="db-card-muted grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto_auto]" method="get">
          <input type="hidden" name="monthOffset" value={String(monthOffset)} />
          <input type="hidden" name="view" value={view} />
          <div className="md:col-span-1">
            <label htmlFor="events-q" className="sr-only">
              Search for events
            </label>
            <input
              id="events-q"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search for events"
              className="db-input text-sm"
            />
          </div>
          <select
            name="eventType"
            defaultValue={selectedType}
            className="db-select text-sm"
          >
            <option value="">All types</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {eventTypeLabel[type] ?? type}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="db-button-primary text-sm"
          >
            Find Events
          </button>
          <Link
            href={urlFor({ view: "list", day: null })}
            className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold no-underline ${
              view === "list"
                ? "border border-[#6b2a00] bg-[#f3b53a] text-[#132a1f]"
                : "border border-[var(--db-border-soft)] bg-white text-[var(--db-text)] hover:bg-[var(--db-surface-soft)]"
            }`}
          >
            List
          </Link>
          <Link
            href={urlFor({ view: "day", day: selectedDay })}
            className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold no-underline ${
              view === "day"
                ? "border border-[#6b2a00] bg-[#f3b53a] text-[#132a1f]"
                : "border border-[var(--db-border-soft)] bg-white text-[var(--db-text)] hover:bg-[var(--db-surface-soft)]"
            }`}
          >
            Day
          </Link>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href={urlFor({ monthOffset: monthOffset - 1, day: null })} className="db-button-secondary px-3 py-1.5 text-sm no-underline">
              Prev
            </Link>
            <Link href={urlFor({ monthOffset: monthOffset + 1, day: null })} className="db-button-secondary px-3 py-1.5 text-sm no-underline">
              Next
            </Link>
            <Link href={urlFor({ monthOffset: 0, day: dayKey(now.toISOString()) })} className="db-button-secondary px-3 py-1.5 text-sm no-underline">
              Today
            </Link>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--db-text-soft)]">
            <span className="font-semibold">{view === "day" ? "Day view" : "Upcoming"}</span>
            <span>•</span>
            <span>{monthFormatter.format(anchorMonth)}</span>
          </div>

          <Link
            href="/api/calendar/feed"
            className="db-button-secondary px-4 py-1.5 text-xs no-underline"
          >
            Subscribe to Calendar
          </Link>
        </div>

        {view === "day" ? (
          <section className="space-y-3">
            <h3 className="border-b border-[var(--db-border-soft)] pb-3 text-xl font-semibold text-[var(--db-text)]">
              {new Date(`${selectedDay}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h3>
            {dayOccurrences.length === 0 ? (
              <p className="text-sm text-[var(--db-text-soft)]">No events for this day.</p>
            ) : (
              <div className="space-y-4">
                {dayOccurrences.map((entry) => (
                  <article key={entry.occurrenceKey} className="db-card-muted p-5">
                    <p className="db-kicker text-[0.7rem]">
                      {eventTypeLabel[entry.event.event_type] ?? entry.event.event_type}
                    </p>
                    <h4 className="mt-2 text-2xl font-semibold text-[var(--db-text)]">{entry.event.title}</h4>
                    <p className="mt-2 text-sm text-[var(--db-text-soft)]">
                      {formatTimeRange(entry.occurrenceStart, entry.occurrenceEnd, entry.event.all_day)}
                    </p>
                    {entry.event.short_summary ? <p className="mt-3 text-sm text-[var(--db-text-soft)]">{entry.event.short_summary}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/events-festivals/${entry.event.slug}?occurrenceStart=${encodeURIComponent(entry.occurrenceStart)}`}
                        className="db-button-secondary px-4 py-2 text-xs no-underline"
                      >
                        View details
                      </Link>
                      <a
                        href={`/api/calendar/events/${entry.event.slug ?? entry.event.id}/ics?occurrenceStart=${encodeURIComponent(entry.occurrenceStart)}`}
                        className="db-button-primary px-4 py-2 text-xs no-underline"
                      >
                        Add to Calendar
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : monthEntries.length === 0 ? (
          <section className="db-card p-6 text-sm text-[var(--db-text-soft)]">
            No events found for the selected filters.
          </section>
        ) : (
          <section className="space-y-8">
            {monthEntries.map(([monthLabel, entries]) => (
              <div key={monthLabel} className="space-y-3">
                <h3 className="border-b border-slate-200 pb-2 text-xl font-semibold text-slate-900">{monthLabel}</h3>
                <div className="space-y-6">
                  {entries.map((entry) => (
                    <article key={entry.occurrenceKey} className="grid gap-4 border-b border-slate-200 pb-6 md:grid-cols-[120px_1fr]">
                      <div className="text-slate-700">
                        <p className="text-xs uppercase tracking-wide">{weekdayFormatter.format(new Date(entry.occurrenceStart))}</p>
                        <p className="text-4xl font-semibold leading-none text-slate-900">
                          {dayFormatter.format(new Date(entry.occurrenceStart))}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-700">
                          {formatTimeRange(entry.occurrenceStart, entry.occurrenceEnd, entry.event.all_day)}
                        </p>
                        <h4 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{entry.event.title}</h4>
                        {entry.event.short_summary ? <p className="mt-2 max-w-3xl text-base text-slate-700">{entry.event.short_summary}</p> : null}

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                            {eventTypeLabel[entry.event.event_type] ?? entry.event.event_type}
                          </span>
                          {entry.event.recurrence ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">Recurring schedule</span>
                          ) : null}
                          {entry.event.visibility === "members" ? (
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">Members only</span>
                          ) : null}
                          {entry.event.location ? <span className="text-slate-600">{entry.event.location}</span> : null}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/events-festivals/${entry.event.slug}?occurrenceStart=${encodeURIComponent(entry.occurrenceStart)}`}
                            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                          >
                            View details
                          </Link>
                          <a
                            href={`/api/calendar/events/${entry.event.slug ?? entry.event.id}/ics?occurrenceStart=${encodeURIComponent(entry.occurrenceStart)}`}
                            className="rounded-md border border-[#6b2a00] bg-[#f3b53a] px-3 py-1.5 text-xs font-semibold text-[#132a1f] hover:bg-[#f1c15d]"
                          >
                            Add to Calendar
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </ContentPageFrame>
  );
}
