"use client";

import { useEffect, useMemo, useState } from "react";

interface EventRecord {
  id: string;
  title: string;
  location: string | null;
  start_time: string;
  is_public: boolean;
  is_rsvp_enabled: boolean;
  capacity: number | null;
  rsvp_count_going?: number;
  rsvp_headcount_going?: number;
}

interface GoingBreakdownItem {
  user_id: string;
  email: string;
  family_name: string | null;
  headcount: number;
}

const toLocalInputValue = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toIsoFromLocalInput = (value: string) => {
  if (!value) return "";
  return new Date(value).toISOString();
};

export function AdminEventsManager() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeBreakdownEvent, setActiveBreakdownEvent] = useState<EventRecord | null>(null);
  const [breakdownRows, setBreakdownRows] = useState<GoingBreakdownItem[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState(() => toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [isPublic, setIsPublic] = useState(true);
  const [isRsvpEnabled, setIsRsvpEnabled] = useState(true);
  const [capacity, setCapacity] = useState("");

  const from = useMemo(() => new Date().toISOString(), []);
  const to = useMemo(() => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), []);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&includePrivate=1`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as { events?: EventRecord[]; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load events.");
      }

      setEvents(payload.events ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const handleOpenGoingBreakdown = async (record: EventRecord) => {
    setActiveBreakdownEvent(record);
    setBreakdownRows([]);
    setBreakdownError(null);
    setBreakdownLoading(true);

    try {
      const response = await fetch(`/api/admin/events/${record.id}/going`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as { breakdown?: GoingBreakdownItem[]; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load RSVP breakdown.");
      }

      setBreakdownRows(payload.breakdown ?? []);
    } catch (loadError) {
      setBreakdownError(loadError instanceof Error ? loadError.message : "Unable to load RSVP breakdown.");
    } finally {
      setBreakdownLoading(false);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          location: location.trim() || null,
          startTime: toIsoFromLocalInput(startTime),
          isPublic,
          isRsvpEnabled,
          capacity: capacity.trim() ? Number(capacity) : null,
        }),
      });

      const payload = (await response.json()) as { event?: EventRecord; message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to create event.");
      }

      setSuccess("Event created.");
      setTitle("");
      setLocation("");
      setCapacity("");
      await loadEvents();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">Events</h2>
        <p className="text-sm text-slate-700">Create and review upcoming events.</p>
      </header>

      <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreate}>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-800">Title</span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-800">Location</span>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-800">Start time</span>
          <input
            type="datetime-local"
            required
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-800">Capacity (optional)</span>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
          Public event
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={isRsvpEnabled}
            onChange={(event) => setIsRsvpEnabled(event.target.checked)}
          />
          RSVP enabled
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create event"}
          </button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-3 py-2 font-semibold">Title</th>
              <th className="px-3 py-2 font-semibold">Start</th>
              <th className="px-3 py-2 font-semibold">Location</th>
              <th className="px-3 py-2 font-semibold">RSVP</th>
              <th className="px-3 py-2 font-semibold">Going</th>
              <th className="px-3 py-2 font-semibold">Visibility</th>
              <th className="px-3 py-2 font-semibold">Capacity</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-slate-600" colSpan={7}>
                  Loading events...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-600" colSpan={7}>
                  No upcoming events.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{event.title}</td>
                  <td className="px-3 py-2 text-slate-700">{new Date(event.start_time).toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-700">{event.location ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-700">{event.is_rsvp_enabled ? "Enabled" : "Off"}</td>
                  <td className="px-3 py-2 text-slate-700">
                    <button
                      type="button"
                      onClick={() => void handleOpenGoingBreakdown(event)}
                      className="rounded-sm underline decoration-slate-400 underline-offset-2 transition hover:text-slate-900"
                    >
                      {(event.rsvp_count_going ?? 0).toString()} RSVP
                      {(event.rsvp_headcount_going ?? 0) > 0 ? ` (${event.rsvp_headcount_going} seats)` : ""}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{event.is_public ? "Public" : "Private"}</td>
                  <td className="px-3 py-2 text-slate-700">{event.capacity ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeBreakdownEvent ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setActiveBreakdownEvent(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Going breakdown</h3>
                <p className="text-sm text-slate-600">{activeBreakdownEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveBreakdownEvent(null)}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </header>

            <div className="max-h-[60vh] overflow-auto px-4 py-3">
              {breakdownLoading ? <p className="text-sm text-slate-600">Loading RSVP breakdown...</p> : null}
              {breakdownError ? <p className="text-sm text-red-700">{breakdownError}</p> : null}
              {!breakdownLoading && !breakdownError && breakdownRows.length === 0 ? (
                <p className="text-sm text-slate-600">No going RSVPs yet.</p>
              ) : null}
              {!breakdownLoading && !breakdownError && breakdownRows.length > 0 ? (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-700">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Family</th>
                      <th className="px-3 py-2 font-semibold">Account</th>
                      <th className="px-3 py-2 font-semibold">Seats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownRows.map((row) => (
                      <tr key={row.user_id} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-800">{row.family_name ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-700">{row.email}</td>
                        <td className="px-3 py-2 text-slate-800">{row.headcount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
