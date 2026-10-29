"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type RsvpStatus = "going" | "maybe" | "not_going";

interface EventWithMyRsvp {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  is_rsvp_enabled: boolean;
  capacity: number | null;
  myRsvp?: {
    status: RsvpStatus;
    headcount: number;
    answers: Record<string, unknown> | null;
    updated_at: string;
  } | null;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatHeadcount = (count: number) => `${count} ${count === 1 ? "person" : "people"}`;

export function PortalEventsPanel({ elevated = false }: { elevated?: boolean }) {
  const [events, setEvents] = useState<EventWithMyRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingByEventId, setSavingByEventId] = useState<Record<string, boolean>>({});
  const [statusByEventId, setStatusByEventId] = useState<Record<string, RsvpStatus>>({});
  const [headcountByEventId, setHeadcountByEventId] = useState<Record<string, number>>({});
  const [messageByEventId, setMessageByEventId] = useState<Record<string, string>>({});

  const from = useMemo(() => new Date().toISOString(), []);
  const to = useMemo(() => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/events/with-my-rsvp?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as { events?: EventWithMyRsvp[]; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load events.");
      }

      const nextEvents = payload.events ?? [];
      setEvents(nextEvents);

      const nextStatuses: Record<string, RsvpStatus> = {};
      const nextHeadcounts: Record<string, number> = {};

      nextEvents.forEach((event) => {
        nextStatuses[event.id] = event.myRsvp?.status ?? "not_going";
        nextHeadcounts[event.id] = Math.max(1, event.myRsvp?.headcount ?? 1);
      });

      setStatusByEventId(nextStatuses);
      setHeadcountByEventId(nextHeadcounts);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const submitRsvp = async (eventId: string) => {
    const status = statusByEventId[eventId] ?? "not_going";
    const headcount = Math.max(1, Math.floor(headcountByEventId[eventId] ?? 1));

    setSavingByEventId((current) => ({ ...current, [eventId]: true }));
    setMessageByEventId((current) => ({ ...current, [eventId]: "" }));

    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, headcount }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to save RSVP.");
      }

      setMessageByEventId((current) => ({ ...current, [eventId]: "RSVP saved." }));
      await loadEvents();
    } catch (submitError) {
      setMessageByEventId((current) => ({
        ...current,
        [eventId]: submitError instanceof Error ? submitError.message : "Unable to save RSVP.",
      }));
    } finally {
      setSavingByEventId((current) => ({ ...current, [eventId]: false }));
    }
  };

  if (elevated) {
    return (
      <section className="member-home-events" aria-labelledby="member-events-heading">
        <div className="member-home-section-heading member-home-events-heading">
          <div>
            <h2 id="member-events-heading">Upcoming events</h2>
            <Link href="/calendar" className="member-home-calendar-link">
              Calendar <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 9h11M10 4.5 14.5 9 10 13.5" /></svg>
            </Link>
          </div>
        </div>

        {loading ? <p className="member-home-event-note">Loading events…</p> : null}
        {error ? <p className="member-home-event-note" role="alert">{error}</p> : null}
        {!loading && !error && events.length === 0 ? (
          <p className="member-home-event-note">No upcoming events.</p>
        ) : null}

        <div className="member-home-event-list">
          {events.map((event) => {
            const start = new Date(event.start_time);
            const status = statusByEventId[event.id] ?? "not_going";
            const headcount = headcountByEventId[event.id] ?? 1;
            const isSaving = Boolean(savingByEventId[event.id]);
            const message = messageByEventId[event.id];

            return (
              <article key={event.id} className="member-home-event">
                <time dateTime={event.start_time} className="member-home-event-date">
                  <span>{new Intl.DateTimeFormat("en-US", { month: "short" }).format(start)}</span>
                  <strong>{new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(start)}</strong>
                </time>
                <div className="member-home-event-body">
                  <h3>{event.title}</h3>
                  <p className="member-home-event-meta">
                    {new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" }).format(start)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                  {event.description ? <p className="member-home-event-description">{event.description}</p> : null}

                  {event.is_rsvp_enabled ? (
                    <div className="member-home-rsvp">
                      {event.myRsvp ? (
                        <p className="member-home-current-rsvp">Your RSVP: {event.myRsvp.status.replace("_", " ")}{event.myRsvp.status === "going" ? ` · ${formatHeadcount(event.myRsvp.headcount)}` : ""}</p>
                      ) : null}
                      <div className="member-home-rsvp-fields">
                        <label>
                          <span>RSVP</span>
                          <select
                            value={status}
                            onChange={(e) => setStatusByEventId((current) => ({ ...current, [event.id]: e.target.value as RsvpStatus }))}
                          >
                            <option value="going">Going</option>
                            <option value="maybe">Maybe</option>
                            <option value="not_going">Not going</option>
                          </select>
                        </label>
                        {status === "going" ? (
                          <label>
                            <span>Guests</span>
                            <input
                              type="number"
                              min={1}
                              value={headcount}
                              onChange={(e) => setHeadcountByEventId((current) => ({
                                ...current,
                                [event.id]: Math.max(1, Number(e.target.value || "1")),
                              }))}
                            />
                          </label>
                        ) : null}
                        <button type="button" onClick={() => void submitRsvp(event.id)} disabled={isSaving}>
                          {isSaving ? "Saving…" : "Save RSVP"}
                        </button>
                      </div>
                      {message ? <p className="member-home-rsvp-message" role="status">{message}</p> : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="db-card space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-[var(--db-text)]">Upcoming Events</h2>
      </div>

      {loading ? <p className="text-sm text-slate-600">Loading events...</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {!loading && !error && events.length === 0 ? (
        <p className="text-sm text-slate-600">No upcoming events right now.</p>
      ) : null}

      <div className="space-y-3">
        {events.map((event) => {
          const status = statusByEventId[event.id] ?? "not_going";
          const headcount = headcountByEventId[event.id] ?? 1;
          const isSaving = Boolean(savingByEventId[event.id]);
          const message = messageByEventId[event.id];

          return (
            <article key={event.id} className="db-card-muted p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                  <p className="text-sm text-slate-700">{dateTimeFormatter.format(new Date(event.start_time))}</p>
                  {event.location ? <p className="text-sm text-slate-700">{event.location}</p> : null}
                  {event.description ? <p className="mt-1 text-sm text-slate-700">{event.description}</p> : null}
                </div>
                {event.capacity !== null ? (
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Capacity {event.capacity}
                  </p>
                ) : null}
              </div>

              {!event.is_rsvp_enabled ? (
                <p className="mt-3 text-sm text-slate-600">RSVP is not available for this event.</p>
              ) : (
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1 text-sm text-slate-800">
                    <span>Status</span>
                    <select
                      value={status}
                      onChange={(e) => setStatusByEventId((current) => ({ ...current, [event.id]: e.target.value as RsvpStatus }))}
                      className="db-select min-w-[140px] px-2 py-1"
                    >
                      <option value="going">Going</option>
                      <option value="maybe">Maybe</option>
                      <option value="not_going">Not going</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-800">
                    <span>Headcount</span>
                    <input
                      type="number"
                      min={1}
                      value={headcount}
                      onChange={(e) =>
                        setHeadcountByEventId((current) => ({
                          ...current,
                          [event.id]: Math.max(1, Number(e.target.value || "1")),
                        }))
                      }
                      disabled={status !== "going"}
                      className="db-input w-24 px-2 py-1 disabled:bg-slate-100"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void submitRsvp(event.id)}
                    disabled={isSaving}
                    className="db-button-primary px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Save RSVP"}
                  </button>
                </div>
              )}

              {event.myRsvp ? (
                <p className="mt-2 text-xs text-slate-600">
                  Current RSVP: <strong>{event.myRsvp.status.replace("_", " ")}</strong>
                  {event.myRsvp.status === "going" ? ` • ${event.myRsvp.headcount} people` : ""}
                </p>
              ) : null}
              {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
