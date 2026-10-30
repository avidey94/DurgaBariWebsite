"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  dateLabel,
  eventTypes,
  monthDays,
  monthLabel,
  occursOnDay,
  pacificDay,
  shiftDay,
  shiftMonth,
  validMonth,
  type CalendarMonthData,
  type CalendarRsvp,
  type HubEvent,
} from "@/lib/events/hub";
import { CalendarIcon as Icon } from "./CalendarIcon";
import { CalendarEventRow } from "./CalendarEventRow";
import { DayDialog } from "./DayDialog";
import { EventDialog } from "./EventDialog";
import { EventFilters } from "./EventFilters";
import { CalendarTools, useCalendarServiceWorker } from "./CalendarTools";
import styles from "./CalendarHub.module.css";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const emptyData = (month: string): CalendarMonthData => ({
  month,
  events: [],
  reservations: [],
  signedIn: false,
  canRsvp: false,
  isMember: false,
  availabilityUnavailable: true,
  rsvpUnavailable: true,
});

export function CalendarHub({
  initialData,
  initialMonth,
  today,
  initialView = "month",
  initialEvent,
  initialDay,
  initialType = "",
  initialQuery = "",
  initialError = false,
  initialDayOpen = false,
  initialScope = "all",
}: {
  initialData: CalendarMonthData | null;
  initialMonth: string;
  today: string;
  initialView?: "month" | "agenda";
  initialEvent?: string;
  initialDay?: string;
  initialType?: string;
  initialQuery?: string;
  initialError?: boolean;
  initialDayOpen?: boolean;
  initialScope?: "all" | "mine";
}) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [data, setData] = useState(initialData ?? emptyData(initialMonth));
  const [view, setView] = useState(initialView);
  const [requestedScope, setScope] = useState(initialScope);
  const scope = data.signedIn ? requestedScope : "all";
  const [type, setType] = useState(initialType);
  const [query, setQuery] = useState(initialQuery);
  const [selectedDay, setSelectedDay] = useState(
    initialDay ?? (initialMonth === today.slice(0, 7) ? today : `${initialMonth}-01`),
  );
  const [dayOpen, setDayOpen] = useState(initialDayOpen);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    () =>
      initialData?.events.find(
        (event) => event.slug === initialEvent && (!initialDay || occursOnDay(event, initialDay)),
      )?.key ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [refresh, setRefresh] = useState(0);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const initialLoad = useRef(true);
  const pendingMonth = loading || data.month !== month;
  const missingEvent =
    initialEvent &&
    !selectedKey &&
    !initialData?.events.some((event) => event.slug === initialEvent);
  useCalendarServiceWorker();

  const updateUrl = useCallback((changes: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, []);

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    const controller = new AbortController();
    void fetch(`/api/calendar/hub?month=${month}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Calendar unavailable");
        const next = (await response.json()) as CalendarMonthData;
        if (!controller.signal.aborted) setData(next);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [month, refresh]);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const events = useMemo(
    () =>
      pendingMonth || error
        ? []
        : data.events.filter((event) => {
            if (type && event.type !== type) return false;
            if (scope === "mine" && (!event.rsvp || event.rsvp.status === "not_going"))
              return false;
            return (
              !query.trim() ||
              [event.title, event.summary, event.location, eventTypes[event.type]]
                .join(" ")
                .toLowerCase()
                .includes(query.trim().toLowerCase())
            );
          }),
    [data.events, type, scope, query, pendingMonth, error],
  );
  const days = useMemo(() => monthDays(month), [month]);
  const eventsByDay = useMemo(
    () => new Map(days.map((day) => [day, events.filter((event) => occursOnDay(event, day))])),
    [days, events],
  );
  const selectedEvent = data.events.find((event) => event.key === selectedKey);
  const selectedEvents = eventsByDay.get(selectedDay) ?? [];
  const monthEvents = events.filter((event) =>
    days.some((day) => day.startsWith(month) && occursOnDay(event, day)),
  );
  const myCount = data.events.filter(
    (event) =>
      event.rsvp && event.rsvp.status !== "not_going" && pacificDay(event.start).startsWith(month),
  ).length;
  const agendaDays = days.filter(
    (day) => day.startsWith(month) && (eventsByDay.get(day)?.length ?? 0) > 0,
  );

  const navigateMonth = (next: string) => {
    if (!validMonth(next)) return;
    if (next !== month) {
      setLoading(true);
      setError(false);
    }
    setMonth(next);
    setSelectedDay(next === today.slice(0, 7) ? today : `${next}-01`);
    setDayOpen(false);
    setSelectedKey(null);
    updateUrl({ month: next, event: null, date: null, panel: null });
  };
  const openDay = (day: string) => {
    if (!day.startsWith(month)) {
      if (!validMonth(day.slice(0, 7))) return;
      setLoading(true);
      setError(false);
      setMonth(day.slice(0, 7));
    }
    setSelectedDay(day);
    setDayOpen(true);
    updateUrl({ date: day, month: day.slice(0, 7), panel: "day", event: null });
  };
  const closeDay = () => {
    setDayOpen(false);
    updateUrl({ panel: null, event: null });
  };
  const openEvent = (event: HubEvent) => {
    setSelectedKey(event.key);
    updateUrl({ event: event.slug, date: pacificDay(event.start), month });
  };
  const closeEvent = () => {
    setSelectedKey(null);
    updateUrl({ event: null, date: dayOpen ? selectedDay : null });
  };
  const changeView = (next: "month" | "agenda") => {
    setView(next);
    updateUrl({ view: next });
  };
  const changeType = (next: string) => {
    setType(next);
    updateUrl({ eventType: next || null });
  };
  const clearFilters = () => {
    setType("");
    setQuery("");
    updateUrl({ eventType: null, q: null });
  };
  const refreshCalendar = () => {
    setLoading(true);
    setError(false);
    setRefresh((value) => value + 1);
  };
  const saveRsvp = (id: string, rsvp: CalendarRsvp) => {
    setData((current) => ({
      ...current,
      events: current.events.map((event) => (event.eventId === id ? { ...event, rsvp } : event)),
    }));
    router.refresh();
  };

  return (
    <div className={styles.page} id="calendar-content">
      <div className={styles.wrap}>
        <header className={styles.hero}>
          <Image
            src="/durgacenter/maa-durga-inauguration.jpg"
            alt="Worship at Durga Bari"
            fill
            sizes="(max-width: 1300px) 100vw, 1280px"
            priority
          />
          <h1>
            <span>The Durga Bari</span> <span>Calendar</span>
          </h1>
        </header>
        {offline && (
          <p className={styles.notice} role="status">
            You’re offline. Reconnect to refresh events or save an RSVP.
          </p>
        )}
        <section
          className={styles.calendarApp}
          aria-label="Community calendar"
          aria-busy={pendingMonth}
        >
          <div className={styles.appHeader}>
            <nav className={styles.scopeNav} aria-label="Calendar selection">
              <button
                aria-pressed={scope === "all"}
                onClick={() => {
                  setScope("all");
                  updateUrl({ scope: null });
                }}
              >
                All events
              </button>
              {data.signedIn && (
                <button
                  aria-pressed={scope === "mine"}
                  onClick={() => {
                    setScope("mine");
                    updateUrl({ scope: "mine" });
                  }}
                >
                  My RSVPs{data.canRsvp && myCount > 0 && <span>{myCount}</span>}
                </button>
              )}
            </nav>
            <button className={styles.subscribeButton} onClick={() => setToolsOpen(true)}>
              <Icon name="plus" />
              <span>Subscribe</span>
            </button>
          </div>
          <div className={styles.calendarToolbar}>
            <div className={styles.monthNav}>
              <div>
                <button
                  className={styles.iconButton}
                  aria-label="Previous month"
                  onClick={() => navigateMonth(shiftMonth(month, -1))}
                >
                  <Icon name="left" />
                </button>
                <button
                  className={styles.iconButton}
                  aria-label="Next month"
                  onClick={() => navigateMonth(shiftMonth(month, 1))}
                >
                  <Icon name="right" />
                </button>
              </div>
              <h2 aria-live="polite">{monthLabel(month)}</h2>
              <button
                className={styles.todayButton}
                onClick={() => navigateMonth(today.slice(0, 7))}
              >
                Today
              </button>
            </div>
            <div className={styles.viewToggle} role="group" aria-label="Calendar view">
              <button
                aria-label="Month"
                aria-pressed={view === "month"}
                onClick={() => changeView("month")}
              >
                <Icon />
                <span>Month</span>
              </button>
              <button
                aria-label="Agenda"
                aria-pressed={view === "agenda"}
                onClick={() => changeView("agenda")}
              >
                <Icon name="list" />
                <span>Agenda</span>
              </button>
            </div>
          </div>
          <div className={styles.searchRow}>
            <div className={styles.searchBar}>
              <Icon name="search" />
              <label className={styles.srOnly} htmlFor="calendar-search">
                Search events
              </label>
              <input
                id="calendar-search"
                type="search"
                value={query}
                placeholder="Search events"
                onChange={(event) => {
                  setQuery(event.target.value);
                  updateUrl({ q: event.target.value || null });
                }}
              />
              {query && (
                <button
                  className={styles.clearSearch}
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    updateUrl({ q: null });
                  }}
                >
                  <Icon name="close" />
                </button>
              )}
              <EventFilters value={type} onChange={changeType} />
            </div>
            {type && (
              <button
                className={styles.filterChip}
                onClick={() => changeType("")}
                aria-label={`Remove ${eventTypes[type as keyof typeof eventTypes]} filter`}
              >
                <span className={styles.typeDot} data-type={type} />
                {eventTypes[type as keyof typeof eventTypes]}
                <Icon name="close" />
              </button>
            )}
          </div>
          {missingEvent && !selectedEvent && (
            <p className={styles.notice}>This event is unavailable or restricted to members.</p>
          )}
          {data.rsvpUnavailable && scope === "mine" && (
            <p className={styles.notice} role="alert">
              Your RSVPs couldn’t be loaded. Refresh to try again.
            </p>
          )}
          {error ? (
            <div className={styles.emptyState} role="alert">
              <Icon />
              <h3>Couldn’t load the calendar</h3>
              <button
                className={styles.primaryButton}
                onClick={refreshCalendar}
              >
                Try again
              </button>
            </div>
          ) : scope === "mine" && !data.canRsvp && !pendingMonth ? (
            <div className={styles.emptyState}>
              <Icon name="users" />
              <h3>Your RSVPs</h3>
              <p>Sign in to see your events.</p>
              <Link
                className={styles.primaryButton}
                href={`/login?next=${encodeURIComponent(`/calendar?month=${month}&scope=mine`)}`}
              >
                Member sign-in
              </Link>
            </div>
          ) : view === "month" ? (
            <div
              className={styles.monthGrid}
              role="group"
              aria-label={`${monthLabel(month)} dates`}
            >
              <div className={styles.weekdays}>
                {weekdays.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className={styles.days}>
                {days.map((day) => {
                  const entries = eventsByDay.get(day) ?? [];
                  return (
                    <button
                      key={day}
                      className={styles.dayCell}
                      data-outside={!day.startsWith(month)}
                      data-today={day === today}
                      data-selected={selectedDay === day && dayOpen}
                      aria-label={`${dateLabel(day, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${day === today ? ", today" : ""}, ${entries.length} ${entries.length === 1 ? "event" : "events"}`}
                      aria-haspopup="dialog"
                      onClick={() => openDay(day)}
                    >
                      <span className={styles.dayNumber}>{Number(day.slice(-2))}</span>
                      <span className={styles.dayPreviews}>
                        {entries.slice(0, 2).map((event) => (
                          <span
                            key={event.key}
                            className={styles.eventPreview}
                            data-type={event.type}
                          >
                            <i className={styles.typeDot} data-type={event.type} />
                            <span>{event.title}</span>
                            {event.rsvp?.status === "going" && <Icon name="check" />}
                          </span>
                        ))}
                        {entries.length > 2 && (
                          <span className={styles.moreEvents}>+{entries.length - 2} more</span>
                        )}
                      </span>
                      <span className={styles.mobileDayEvents} aria-hidden="true">
                        {entries.length > 0 && (
                          <>
                            <span className={styles.dayDots}>
                              {Array.from(new Set(entries.map((event) => event.type)))
                                .slice(0, 3)
                                .map((kind) => (
                                  <i key={kind} className={styles.typeDot} data-type={kind} />
                                ))}
                            </span>
                            <span>
                              {entries.length} {entries.length === 1 ? "event" : "events"}
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.agenda} aria-live="polite">
              {pendingMonth ? (
                <div className={styles.emptyState}>
                  <p>Loading events…</p>
                </div>
              ) : agendaDays.length ? (
                agendaDays.map((day) => (
                  <section className={styles.agendaDay} key={day}>
                    <button
                      className={styles.agendaDate}
                      aria-label={`View ${dateLabel(day, { month: "long", day: "numeric" })}`}
                      onClick={() => openDay(day)}
                    >
                      <span>{dateLabel(day, { weekday: "short" })}</span>
                      <strong>{Number(day.slice(-2))}</strong>
                    </button>
                    <div>
                      {(eventsByDay.get(day) ?? []).map((event) => (
                        <CalendarEventRow key={event.key} event={event} onOpen={openEvent} />
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <Icon />
                  <h3>{scope === "mine" ? "No RSVPs this month" : "No events found"}</h3>
                  {type || query ? (
                    <button className={styles.textButton} onClick={clearFilters}>
                      Clear filters
                    </button>
                  ) : (
                    <p>Try another month.</p>
                  )}
                </div>
              )}
            </div>
          )}
          <footer className={styles.calendarFooter}>
            <span>Pacific time</span>
            <span role="status">
              {pendingMonth
                ? "Loading…"
                : error
                  ? "Unavailable"
                  : `${monthEvents.length} ${monthEvents.length === 1 ? "event" : "events"}`}
            </span>
            <button
              aria-label="Refresh calendar"
              title="Refresh calendar"
              onClick={() => {
                refreshCalendar();
                router.refresh();
              }}
              disabled={loading}
            >
              <Icon name="repeat" />
            </button>
          </footer>
        </section>
        <footer className={styles.pageFooter}>
          <Link href="/">Durga Bari</Link>
          <Link href="/contact">Contact</Link>
        </footer>
      </div>
      {dayOpen && (
        <DayDialog
          day={selectedDay}
          events={selectedEvents}
          loading={pendingMonth}
          error={error}
          onClose={closeDay}
          onDayChange={(offset) => openDay(shiftDay(selectedDay, offset))}
          onOpenEvent={openEvent}
        />
      )}
      {selectedEvent && (
        <EventDialog
          key={selectedEvent.key}
          event={selectedEvent}
          canRsvp={data.canRsvp}
          signedIn={data.signedIn}
          rsvpUnavailable={data.rsvpUnavailable}
          onClose={closeEvent}
          onRsvp={saveRsvp}
        />
      )}
      {toolsOpen && <CalendarTools onClose={() => setToolsOpen(false)} />}
    </div>
  );
}
