"use client";

import { useEffect, useMemo, useState } from "react";

type PublishStatus = "draft" | "published" | "archived";
type Visibility = "public" | "members" | "private";
type EventType = "darshan" | "ritual" | "festival" | "community" | "volunteer" | "special";
type SlotState = "open" | "closed";

interface EventRecord {
  id: string;
  slug: string | null;
  title: string;
  short_summary: string | null;
  full_description: string | null;
  event_type: EventType;
  category: string;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  recurrence: Record<string, unknown> | null;
  recurrence_until: string | null;
  location: string | null;
  publish_status: PublishStatus;
  visibility: Visibility;
  cta_text: string | null;
  max_volunteer_count: number | null;
  volunteer_slot_count: number;
  volunteer_signup_count: number;
}

interface SlotRecord {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  capacity: number;
  notes: string | null;
  sort_order: number;
  slot_state: SlotState;
}

interface SignupRecord {
  id: string;
  slot_id: string;
  email: string;
  family_id: string;
  participant_name: string;
  participant_type: "adult" | "child";
  signup_status: "confirmed" | "cancelled";
  signed_up_at: string;
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toIsoFromLocal = (value: string) => (value ? new Date(value).toISOString() : null);

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-slate-600">
      {children}
    </label>
  );
}

export function AdminEventsManager() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [slots, setSlots] = useState<SlotRecord[]>([]);
  const [signups, setSignups] = useState<SignupRecord[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [eventDraft, setEventDraft] = useState({
    title: "",
    shortSummary: "",
    fullDescription: "",
    eventType: "festival" as EventType,
    location: "",
    startTime: "",
    endTime: "",
    publishStatus: "draft" as PublishStatus,
    visibility: "public" as Visibility,
  });

  const [newEvent, setNewEvent] = useState({
    title: "",
    shortSummary: "",
    fullDescription: "",
    eventType: "festival" as EventType,
    category: "community",
    startTime: toLocalInput(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
    endTime: "",
    allDay: false,
    recurrenceFrequency: "none",
    recurrenceUntil: "",
    location: "",
    publishStatus: "draft" as PublishStatus,
    visibility: "public" as Visibility,
    ctaText: "",
    maxVolunteerCount: "",
  });

  const [newSlot, setNewSlot] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    capacity: "1",
    notes: "",
    sortOrder: "0",
    slotState: "open" as SlotState,
  });

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/events", { cache: "no-store" });
      const payload = (await response.json()) as { events?: EventRecord[]; message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to load events.");
      setEvents(payload.events ?? []);
      setActiveEventId((current) => current ?? payload.events?.[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (eventId: string) => {
    setSlotsLoading(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/slots`, { cache: "no-store" });
      const payload = (await response.json()) as { slots?: SlotRecord[]; signups?: SignupRecord[]; message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to load slots.");
      setSlots(payload.slots ?? []);
      setSignups(payload.signups ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load slots.");
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  useEffect(() => {
    if (activeEventId) {
      void loadSlots(activeEventId);
    } else {
      setSlots([]);
      setSignups([]);
    }
  }, [activeEventId]);

  const recurrencePayload = useMemo(() => {
    if (newEvent.recurrenceFrequency === "none") return null;
    return {
      frequency: newEvent.recurrenceFrequency,
      interval: 1,
    };
  }, [newEvent.recurrenceFrequency]);

  const createEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvent.title,
          shortSummary: newEvent.shortSummary || null,
          fullDescription: newEvent.fullDescription || null,
          eventType: newEvent.eventType,
          category: newEvent.category,
          startTime: toIsoFromLocal(newEvent.startTime),
          endTime: toIsoFromLocal(newEvent.endTime),
          allDay: newEvent.allDay,
          recurrence: recurrencePayload,
          recurrenceUntil: toIsoFromLocal(newEvent.recurrenceUntil),
          location: newEvent.location || null,
          publishStatus: newEvent.publishStatus,
          visibility: newEvent.visibility,
          ctaText: newEvent.ctaText || null,
          maxVolunteerCount: newEvent.maxVolunteerCount ? Number(newEvent.maxVolunteerCount) : null,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to create event.");

      setSuccess("Event created.");
      setShowCreateForm(false);
      setNewEvent((current) => ({
        ...current,
        title: "",
        shortSummary: "",
        fullDescription: "",
      }));
      await loadEvents();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create event.");
    }
  };

  const updateEvent = async (id: string, updates: Record<string, unknown>) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to update event.");
      setSuccess("Event updated.");
      await loadEvents();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update event.");
    }
  };

  const createSlot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeEventId) return;
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/events/${activeEventId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSlot.title,
          description: newSlot.description || null,
          startTime: toIsoFromLocal(newSlot.startTime),
          endTime: toIsoFromLocal(newSlot.endTime),
          capacity: Number(newSlot.capacity),
          notes: newSlot.notes || null,
          sortOrder: Number(newSlot.sortOrder),
          slotState: newSlot.slotState,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to create slot.");
      setSuccess("Volunteer slot created.");
      setNewSlot({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        capacity: "1",
        notes: "",
        sortOrder: "0",
        slotState: "open",
      });
      await loadSlots(activeEventId);
      await loadEvents();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create slot.");
    }
  };

  const activeEvent = events.find((event) => event.id === activeEventId) ?? null;
  useEffect(() => {
    if (!activeEvent) return;
    setEventDraft({
      title: activeEvent.title,
      shortSummary: activeEvent.short_summary ?? "",
      fullDescription: activeEvent.full_description ?? "",
      eventType: activeEvent.event_type,
      location: activeEvent.location ?? "",
      startTime: toLocalInput(activeEvent.start_time),
      endTime: toLocalInput(activeEvent.end_time),
      publishStatus: activeEvent.publish_status,
      visibility: activeEvent.visibility,
    });
  }, [activeEvent?.id]);

  const signupsBySlot = useMemo(() => {
    const map = new Map<string, SignupRecord[]>();
    signups.forEach((signup) => {
      map.set(signup.slot_id, [...(map.get(signup.slot_id) ?? []), signup]);
    });
    return map;
  }, [signups]);

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">Events & Volunteer Management</h2>
        <p className="text-sm text-slate-700">
          Publish temple schedules, recurring rituals, and volunteer opportunities from one control center.
        </p>
      </header>

      <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Create event</h3>
            <p className="text-xs text-slate-600">Start with core details, then add volunteer slots after saving.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showCreateForm ? "Close create event" : "Create event"}
          </button>
        </div>

        {showCreateForm ? (
          <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={createEvent}>
            <div className="space-y-1 md:col-span-2">
              <FieldLabel htmlFor="new-event-title">Event title</FieldLabel>
              <input
                id="new-event-title"
                required
                value={newEvent.title}
                onChange={(event) => setNewEvent((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-event-type">Event type</FieldLabel>
              <select
                id="new-event-type"
                value={newEvent.eventType}
                onChange={(event) => setNewEvent((current) => ({ ...current, eventType: event.target.value as EventType }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="darshan">Darshan</option>
                <option value="ritual">Ritual</option>
                <option value="festival">Festival</option>
                <option value="community">Community</option>
                <option value="volunteer">Volunteer</option>
                <option value="special">Special</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-3">
              <FieldLabel htmlFor="new-event-short-summary">Short summary</FieldLabel>
              <input
                id="new-event-short-summary"
                value={newEvent.shortSummary}
                onChange={(event) => setNewEvent((current) => ({ ...current, shortSummary: event.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <FieldLabel htmlFor="new-event-description">Full description</FieldLabel>
              <textarea
                id="new-event-description"
                value={newEvent.fullDescription}
                onChange={(event) => setNewEvent((current) => ({ ...current, fullDescription: event.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <FieldLabel htmlFor="new-event-start-time">Start date/time</FieldLabel>
              <input
                id="new-event-start-time"
                type="datetime-local"
                required
                value={newEvent.startTime}
                onChange={(event) => setNewEvent((current) => ({ ...current, startTime: event.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-event-end-time">End date/time</FieldLabel>
              <input
                id="new-event-end-time"
                type="datetime-local"
                value={newEvent.endTime}
                onChange={(event) => setNewEvent((current) => ({ ...current, endTime: event.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-event-location">Location</FieldLabel>
              <input
                id="new-event-location"
                value={newEvent.location}
                onChange={(event) => setNewEvent((current) => ({ ...current, location: event.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <FieldLabel htmlFor="new-event-visibility">Visibility</FieldLabel>
              <select
                id="new-event-visibility"
                value={newEvent.visibility}
                onChange={(event) => setNewEvent((current) => ({ ...current, visibility: event.target.value as Visibility }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="public">Public</option>
                <option value="members">Members only</option>
                <option value="private">Private (admin only)</option>
              </select>
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-event-status">Publish status</FieldLabel>
              <select
                id="new-event-status"
                value={newEvent.publishStatus}
                onChange={(event) =>
                  setNewEvent((current) => ({ ...current, publishStatus: event.target.value as PublishStatus }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                </select>
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Create event
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-md border border-slate-200">
          <header className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
            Event dashboard
          </header>
          <div className="max-h-[680px] overflow-y-auto">
            {loading ? (
              <p className="p-3 text-sm text-slate-600">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="p-3 text-sm text-slate-600">No events created yet.</p>
            ) : (
              events.map((event) => (
                <article
                  key={event.id}
                  className={`cursor-pointer border-b border-slate-100 p-3 ${activeEventId === event.id ? "bg-emerald-50" : "bg-white"}`}
                  onClick={() => setActiveEventId(event.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                      <p className="text-xs text-slate-600">{new Date(event.start_time).toLocaleString("en-US")}</p>
                      <p className="text-xs text-slate-600 capitalize">
                        {event.publish_status} • {event.visibility}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <p>{event.volunteer_slot_count} slots</p>
                      <p>{event.volunteer_signup_count} signups</p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(evt) => {
                        evt.stopPropagation();
                        void updateEvent(event.id, { publishStatus: "published" });
                      }}
                      className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs"
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      onClick={(evt) => {
                        evt.stopPropagation();
                        void updateEvent(event.id, { publishStatus: "draft" });
                      }}
                      className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs"
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={(evt) => {
                        evt.stopPropagation();
                        void updateEvent(event.id, { publishStatus: "archived" });
                      }}
                      className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs"
                    >
                      Archive
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3">
          {activeEvent ? (
            <form
              className="rounded-md border border-slate-200 bg-white p-3"
              onSubmit={(event) => {
                event.preventDefault();
                void updateEvent(activeEvent.id, {
                  title: eventDraft.title,
                  shortSummary: eventDraft.shortSummary,
                  fullDescription: eventDraft.fullDescription,
                  eventType: eventDraft.eventType,
                  location: eventDraft.location,
                  startTime: toIsoFromLocal(eventDraft.startTime),
                  endTime: toIsoFromLocal(eventDraft.endTime),
                  publishStatus: eventDraft.publishStatus,
                  visibility: eventDraft.visibility,
                });
              }}
            >
              <h3 className="text-sm font-semibold text-slate-900">Edit selected event</h3>
              <div className="mt-3 grid gap-3">
                <div className="space-y-1">
                  <FieldLabel htmlFor="edit-event-title">Event title</FieldLabel>
                  <input
                    id="edit-event-title"
                    value={eventDraft.title}
                    onChange={(event) => setEventDraft((current) => ({ ...current, title: event.target.value }))}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel htmlFor="edit-event-type">Event type</FieldLabel>
                  <select
                    id="edit-event-type"
                    value={eventDraft.eventType}
                    onChange={(event) => setEventDraft((current) => ({ ...current, eventType: event.target.value as EventType }))}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="darshan">Darshan</option>
                    <option value="ritual">Ritual</option>
                    <option value="festival">Festival</option>
                    <option value="community">Community</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="special">Special</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <FieldLabel htmlFor="edit-event-short-summary">Short summary</FieldLabel>
                  <input
                    id="edit-event-short-summary"
                    value={eventDraft.shortSummary}
                    onChange={(event) => setEventDraft((current) => ({ ...current, shortSummary: event.target.value }))}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel htmlFor="edit-event-full-description">Full description</FieldLabel>
                  <textarea
                    id="edit-event-full-description"
                    value={eventDraft.fullDescription}
                    onChange={(event) => setEventDraft((current) => ({ ...current, fullDescription: event.target.value }))}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel htmlFor="edit-event-location">Location</FieldLabel>
                  <input
                    id="edit-event-location"
                    value={eventDraft.location}
                    onChange={(event) => setEventDraft((current) => ({ ...current, location: event.target.value }))}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <FieldLabel htmlFor="edit-event-start">Start date/time</FieldLabel>
                    <input
                      id="edit-event-start"
                      type="datetime-local"
                      value={eventDraft.startTime}
                      onChange={(event) => setEventDraft((current) => ({ ...current, startTime: event.target.value }))}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel htmlFor="edit-event-end">End date/time</FieldLabel>
                    <input
                      id="edit-event-end"
                      type="datetime-local"
                      value={eventDraft.endTime}
                      onChange={(event) => setEventDraft((current) => ({ ...current, endTime: event.target.value }))}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <FieldLabel htmlFor="edit-event-status">Publish status</FieldLabel>
                    <select
                      id="edit-event-status"
                      value={eventDraft.publishStatus}
                      onChange={(event) =>
                        setEventDraft((current) => ({ ...current, publishStatus: event.target.value as PublishStatus }))
                      }
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel htmlFor="edit-event-visibility">Visibility</FieldLabel>
                    <select
                      id="edit-event-visibility"
                      value={eventDraft.visibility}
                      onChange={(event) =>
                        setEventDraft((current) => ({ ...current, visibility: event.target.value as Visibility }))
                      }
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="public">Public</option>
                      <option value="members">Members only</option>
                      <option value="private">Private (admin only)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Save event changes
                </button>
              </div>
            </form>
          ) : null}

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Volunteer slots {activeEvent ? `for ${activeEvent.title}` : ""}
            </h3>
            {!activeEvent ? (
              <p className="mt-2 text-sm text-slate-600">Select an event to manage volunteer opportunities.</p>
            ) : (
              <>
                <form className="mt-3 grid gap-3" onSubmit={createSlot}>
                  <div className="space-y-1">
                    <FieldLabel htmlFor="new-slot-title">Slot title</FieldLabel>
                    <input
                      id="new-slot-title"
                      required
                      value={newSlot.title}
                      onChange={(event) => setNewSlot((current) => ({ ...current, title: event.target.value }))}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel htmlFor="new-slot-description">Slot description</FieldLabel>
                    <textarea
                      id="new-slot-description"
                      value={newSlot.description}
                      onChange={(event) => setNewSlot((current) => ({ ...current, description: event.target.value }))}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <FieldLabel htmlFor="new-slot-start">Start date/time</FieldLabel>
                      <input
                        id="new-slot-start"
                        type="datetime-local"
                        required
                        value={newSlot.startTime}
                        onChange={(event) => setNewSlot((current) => ({ ...current, startTime: event.target.value }))}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel htmlFor="new-slot-end">End date/time</FieldLabel>
                      <input
                        id="new-slot-end"
                        type="datetime-local"
                        value={newSlot.endTime}
                        onChange={(event) => setNewSlot((current) => ({ ...current, endTime: event.target.value }))}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <FieldLabel htmlFor="new-slot-capacity">Number of volunteers needed</FieldLabel>
                      <input
                        id="new-slot-capacity"
                        type="number"
                        min={1}
                        value={newSlot.capacity}
                        onChange={(event) => setNewSlot((current) => ({ ...current, capacity: event.target.value }))}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel htmlFor="new-slot-state">State</FieldLabel>
                      <select
                        id="new-slot-state"
                        value={newSlot.slotState}
                        onChange={(event) => setNewSlot((current) => ({ ...current, slotState: event.target.value as SlotState }))}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel htmlFor="new-slot-notes">Admin notes (optional)</FieldLabel>
                    <textarea
                      id="new-slot-notes"
                      value={newSlot.notes}
                      onChange={(event) => setNewSlot((current) => ({ ...current, notes: event.target.value }))}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      rows={2}
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Add volunteer slot
                  </button>
                </form>

                <div className="mt-3 space-y-2">
                  {slotsLoading ? <p className="text-xs text-slate-600">Loading slots...</p> : null}
                  {slots.map((slot) => {
                    const confirmed = (signupsBySlot.get(slot.id) ?? []).filter((entry) => entry.signup_status === "confirmed");
                    return (
                      <article key={slot.id} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{slot.title}</p>
                            <p className="text-xs text-slate-600">
                              {new Date(slot.start_time).toLocaleString("en-US")} • {confirmed.length}/{slot.capacity}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void fetch(`/api/admin/events/slots/${slot.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ slotState: slot.slot_state === "open" ? "closed" : "open" }),
                              }).then(() => loadSlots(activeEvent.id))
                            }
                            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs"
                          >
                            {slot.slot_state === "open" ? "Close" : "Reopen"}
                          </button>
                        </div>

                        {confirmed.length > 0 ? (
                          <div className="mt-2 rounded border border-slate-200 bg-white p-2">
                            <p className="text-xs font-medium text-slate-700">Confirmed volunteers</p>
                            <ul className="mt-1 space-y-1 text-xs text-slate-600">
                              {confirmed.map((signup) => (
                                <li key={signup.id}>
                                  {signup.participant_name} ({signup.participant_type}) - {signup.email}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
