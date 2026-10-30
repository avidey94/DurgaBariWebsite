"use client";

import { useEffect, useMemo, useState } from "react";
import {
  WorkspaceEmpty,
  WorkspaceIcon,
  WorkspaceNotice,
} from "@/components/workspace/workspace-ui";
import { pacificLocalToIso, toPacificLocal } from "@/lib/events/timezone";

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
  blocks_reservations: boolean;
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

const toLocalInput = (iso: string | null) => (iso ? toPacificLocal(iso) : "");
const toIsoFromLocal = (value: string) => (value ? pacificLocalToIso(value) : null);

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold uppercase tracking-wide text-slate-600"
    >
      {children}
    </label>
  );
}

export function AdminEventsManager() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PublishStatus>("all");
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [slotSaving, setSlotSaving] = useState(false);
  const [slotsError, setSlotsError] = useState("");
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
    blocksReservations: true,
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
    blocksReservations: true,
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
      const now = Date.now();
      const ordered = [...(payload.events ?? [])].sort((left, right) => {
        const time = (event: EventRecord) => new Date(event.end_time ?? event.start_time).getTime();
        const upcoming = (event: EventRecord) =>
          event.publish_status !== "archived" &&
          (time(event) >= now ||
            (!!event.recurrence &&
              (!event.recurrence_until || new Date(event.recurrence_until).getTime() >= now)));
        const leftUpcoming = upcoming(left);
        const rightUpcoming = upcoming(right);
        if (leftUpcoming !== rightUpcoming) return leftUpcoming ? -1 : 1;
        return leftUpcoming ? time(left) - time(right) : time(right) - time(left);
      });
      setEvents(ordered);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (eventId: string) => {
    setSlotsLoading(true);
    setSlotsError("");
    setSlots([]);
    setSignups([]);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/slots`, { cache: "no-store" });
      const payload = (await response.json()) as {
        slots?: SlotRecord[];
        signups?: SignupRecord[];
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message ?? "Unable to load slots.");
      setSlots(payload.slots ?? []);
      setSignups(payload.signups ?? []);
    } catch (loadError) {
      setSlotsError(loadError instanceof Error ? loadError.message : "Unable to load slots.");
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
    setEventSaving(true);
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
          blocksReservations: newEvent.blocksReservations,
          ctaText: newEvent.ctaText || null,
          maxVolunteerCount: newEvent.maxVolunteerCount ? Number(newEvent.maxVolunteerCount) : null,
        }),
      });
      const payload = (await response.json()) as { event?: EventRecord; message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to create event.");
      if (payload.event?.id) setActiveEventId(payload.event.id);

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
    } finally {
      setEventSaving(false);
    }
  };

  const updateEvent = async (id: string, updates: Record<string, unknown>) => {
    setEventSaving(true);
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
    } finally {
      setEventSaving(false);
    }
  };

  const createSlot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeEventId) return;
    setSlotSaving(true);
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
      setSuccess("Volunteer opportunity created. Families can sign up while it is open.");
      setShowSlotForm(false);
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
    } finally {
      setSlotSaving(false);
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
      blocksReservations: activeEvent.blocks_reservations,
    });
  }, [activeEvent]);

  const signupsBySlot = useMemo(() => {
    const map = new Map<string, SignupRecord[]>();
    signups.forEach((signup) => {
      map.set(signup.slot_id, [...(map.get(signup.slot_id) ?? []), signup]);
    });
    return map;
  }, [signups]);

  const visibleEvents = events.filter(
    (event) =>
      (statusFilter === "all" || event.publish_status === statusFilter) &&
      `${event.title} ${event.location ?? ""} ${event.event_type}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const toggleSlotState = async (slot: SlotRecord) => {
    if (!activeEventId) return;
    setSlotSaving(true);
    setSlotsError("");
    try {
      const response = await fetch(`/api/admin/events/slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotState: slot.slot_state === "open" ? "closed" : "open" }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.message ?? "Unable to update volunteer opportunity.");
      await loadSlots(activeEventId);
    } catch (caught) {
      setSlotsError(
        caught instanceof Error ? caught.message : "Unable to update volunteer opportunity.",
      );
    } finally {
      setSlotSaving(false);
    }
  };

  return (
    <section className="admin-workflow events-workflow">
      <div className="workflow-context">
        <div className="workflow-context-icon">
          <WorkspaceIcon name="calendar" size={22} />
        </div>
        <div>
          <p className="workflow-eyebrow">Calendar & seva</p>
          <h2>Bring the community together</h2>
          <p>
            Plan an occasion, make space for it in the calendar and invite families to lend a hand.
          </p>
        </div>
      </div>
      <div className="workflow-stats">
        <div>
          <span>
            {loading ? "—" : events.filter((event) => event.publish_status === "published").length}
          </span>
          <p>Published occasions</p>
        </div>
        <div>
          <span>
            {loading ? "—" : events.filter((event) => event.publish_status === "draft").length}
          </span>
          <p>Drafts in progress</p>
        </div>
        <div>
          <span>
            {loading
              ? "—"
              : events.reduce((total, event) => total + event.volunteer_signup_count, 0)}
          </span>
          <p>Confirmed volunteer signups</p>
        </div>
      </div>

      <section className="workflow-event-create">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Make room for the next gathering
            </h3>
            <p className="text-xs text-slate-600">
              Begin with the occasion and timing. Add seva opportunities once the event is created.
            </p>
          </div>
          <button
            type="button"
            aria-expanded={showCreateForm}
            aria-controls="create-event-form"
            onClick={() => setShowCreateForm((current) => !current)}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showCreateForm ? "Close create event" : "Create event"}
          </button>
        </div>

        {showCreateForm ? (
          <form
            id="create-event-form"
            className="mt-5 grid gap-4 md:grid-cols-2"
            onSubmit={createEvent}
          >
            <div className="space-y-1 md:col-span-2">
              <FieldLabel htmlFor="new-event-title">Event title</FieldLabel>
              <input
                id="new-event-title"
                required
                value={newEvent.title}
                onChange={(event) =>
                  setNewEvent((current) => ({ ...current, title: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-event-type">Event type</FieldLabel>
              <select
                id="new-event-type"
                value={newEvent.eventType}
                onChange={(event) =>
                  setNewEvent((current) => ({
                    ...current,
                    eventType: event.target.value as EventType,
                  }))
                }
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

            <div className="space-y-1 md:col-span-2">
              <FieldLabel htmlFor="new-event-short-summary">Short summary</FieldLabel>
              <input
                id="new-event-short-summary"
                value={newEvent.shortSummary}
                onChange={(event) =>
                  setNewEvent((current) => ({ ...current, shortSummary: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <FieldLabel htmlFor="new-event-description">Full description</FieldLabel>
              <textarea
                id="new-event-description"
                value={newEvent.fullDescription}
                onChange={(event) =>
                  setNewEvent((current) => ({ ...current, fullDescription: event.target.value }))
                }
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
                onChange={(event) =>
                  setNewEvent((current) => ({ ...current, startTime: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-event-end-time">End date/time</FieldLabel>
              <input
                id="new-event-end-time"
                type="datetime-local"
                required={newEvent.blocksReservations}
                value={newEvent.endTime}
                onChange={(event) =>
                  setNewEvent((current) => ({ ...current, endTime: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-event-location">Location</FieldLabel>
              <input
                id="new-event-location"
                value={newEvent.location}
                onChange={(event) =>
                  setNewEvent((current) => ({ ...current, location: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <FieldLabel htmlFor="new-event-visibility">Visibility</FieldLabel>
              <select
                id="new-event-visibility"
                value={newEvent.visibility}
                onChange={(event) =>
                  setNewEvent((current) => ({
                    ...current,
                    visibility: event.target.value as Visibility,
                  }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="public">Public</option>
                <option value="members">Members only</option>
                <option value="private">Private (admin only)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 md:col-span-2">
              <input
                type="checkbox"
                checked={newEvent.blocksReservations}
                onChange={(event) =>
                  setNewEvent((current) => ({
                    ...current,
                    blocksReservations: event.target.checked,
                  }))
                }
              />
              Block space reservations during this event
            </label>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-event-status">Publish status</FieldLabel>
              <select
                id="new-event-status"
                value={newEvent.publishStatus}
                onChange={(event) =>
                  setNewEvent((current) => ({
                    ...current,
                    publishStatus: event.target.value as PublishStatus,
                  }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={eventSaving}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                {eventSaving ? "Creating…" : "Create event"}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {error ? (
        <WorkspaceNotice tone="error">
          {error}{" "}
          <button type="button" onClick={() => void loadEvents()}>
            Try again
          </button>
        </WorkspaceNotice>
      ) : null}
      {success ? <WorkspaceNotice tone="success">{success}</WorkspaceNotice> : null}

      <div className="workflow-toolbar">
        <div className="workflow-tabs" aria-label="Event publishing status">
          {(["all", "draft", "published", "archived"] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={statusFilter === value}
              onClick={() => setStatusFilter(value)}
            >
              {value === "all"
                ? "All occasions"
                : value === "draft"
                  ? "Drafts"
                  : value === "published"
                    ? "Published"
                    : "Archive"}
            </button>
          ))}
        </div>
        <label className="workflow-search">
          <WorkspaceIcon name="search" size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find an occasion or location"
            aria-label="Search events"
          />
        </label>
      </div>
      <div className="workflow-events-grid">
        <section className="workflow-event-list">
          <header className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
            The temple calendar
          </header>
          <div className="max-h-[680px] overflow-y-auto">
            {loading ? (
              <div className="workflow-loading" role="status">
                <span className="workflow-loading-dot" /> Gathering the calendar…
              </div>
            ) : visibleEvents.length === 0 ? (
              error ? (
                <WorkspaceEmpty
                  compact
                  icon="calendar"
                  title="The calendar is unavailable"
                  description="Try loading the calendar again using the message above."
                />
              ) : (
                <WorkspaceEmpty
                  compact
                  icon="calendar"
                  eyebrow={
                    search || statusFilter !== "all" ? "Calendar results" : "A space to gather"
                  }
                  title={
                    search || statusFilter !== "all"
                      ? "No occasions in this view"
                      : "The next gathering starts here"
                  }
                  description={
                    search || statusFilter !== "all"
                      ? "Try another search or return to all occasions."
                      : "Create a ritual, festival or community event. Save a draft first, then publish when the details are ready."
                  }
                  action={
                    search || statusFilter !== "all" ? (
                      <button
                        type="button"
                        className="workflow-button"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("all");
                        }}
                      >
                        Clear filters
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="workflow-button workflow-button-primary"
                        onClick={() => setShowCreateForm(true)}
                      >
                        Create the first occasion
                        <WorkspaceIcon name="plus" size={16} />
                      </button>
                    )
                  }
                />
              )
            ) : (
              visibleEvents.map((event) => (
                <article
                  key={event.id}
                  className={`workflow-event-item ${activeEventId === event.id ? "is-selected" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        className="workflow-event-title"
                        aria-pressed={activeEventId === event.id}
                        onClick={() => {
                          setActiveEventId(event.id);
                          setShowSlotForm(false);
                        }}
                      >
                        {event.title}
                        <WorkspaceIcon name="arrow" size={15} />
                      </button>
                      <p className="text-xs text-slate-600">
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "America/Los_Angeles",
                        }).format(new Date(event.start_time)) + " Pacific"}
                      </p>
                      <p className="text-xs text-slate-600 capitalize">
                        {event.publish_status} • {event.visibility} •{" "}
                        {event.blocks_reservations ? "Reserves temple space" : "Calendar only"}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <p>{event.volunteer_slot_count} opportunities</p>
                      <p>{event.volunteer_signup_count} volunteers</p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {event.publish_status !== "published" ? (
                      <button
                        type="button"
                        disabled={eventSaving}
                        onClick={(evt) => {
                          evt.stopPropagation();
                          void updateEvent(event.id, { publishStatus: "published" });
                        }}
                        className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs"
                      >
                        Publish
                      </button>
                    ) : null}
                    {event.publish_status !== "draft" ? (
                      <button
                        type="button"
                        disabled={eventSaving}
                        onClick={(evt) => {
                          evt.stopPropagation();
                          void updateEvent(event.id, { publishStatus: "draft" });
                        }}
                        className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs"
                      >
                        Draft
                      </button>
                    ) : null}
                    {event.publish_status !== "archived" ? (
                      <button
                        type="button"
                        disabled={eventSaving}
                        onClick={(evt) => {
                          evt.stopPropagation();
                          void updateEvent(event.id, { publishStatus: "archived" });
                        }}
                        className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs"
                      >
                        Archive
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3">
          {activeEvent ? (
            <form
              className="workflow-event-editor"
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
                  blocksReservations: eventDraft.blocksReservations,
                });
              }}
            >
              <h3 className="text-sm font-semibold text-slate-900">Occasion details</h3>
              <div className="mt-3 grid gap-3">
                <div className="space-y-1">
                  <FieldLabel htmlFor="edit-event-title">Event title</FieldLabel>
                  <input
                    id="edit-event-title"
                    value={eventDraft.title}
                    onChange={(event) =>
                      setEventDraft((current) => ({ ...current, title: event.target.value }))
                    }
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel htmlFor="edit-event-type">Event type</FieldLabel>
                  <select
                    id="edit-event-type"
                    value={eventDraft.eventType}
                    onChange={(event) =>
                      setEventDraft((current) => ({
                        ...current,
                        eventType: event.target.value as EventType,
                      }))
                    }
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
                    onChange={(event) =>
                      setEventDraft((current) => ({ ...current, shortSummary: event.target.value }))
                    }
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel htmlFor="edit-event-full-description">Full description</FieldLabel>
                  <textarea
                    id="edit-event-full-description"
                    value={eventDraft.fullDescription}
                    onChange={(event) =>
                      setEventDraft((current) => ({
                        ...current,
                        fullDescription: event.target.value,
                      }))
                    }
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel htmlFor="edit-event-location">Location</FieldLabel>
                  <input
                    id="edit-event-location"
                    value={eventDraft.location}
                    onChange={(event) =>
                      setEventDraft((current) => ({ ...current, location: event.target.value }))
                    }
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
                      onChange={(event) =>
                        setEventDraft((current) => ({ ...current, startTime: event.target.value }))
                      }
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel htmlFor="edit-event-end">End date/time</FieldLabel>
                    <input
                      id="edit-event-end"
                      type="datetime-local"
                      required={eventDraft.blocksReservations}
                      value={eventDraft.endTime}
                      onChange={(event) =>
                        setEventDraft((current) => ({ ...current, endTime: event.target.value }))
                      }
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
                        setEventDraft((current) => ({
                          ...current,
                          publishStatus: event.target.value as PublishStatus,
                        }))
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
                        setEventDraft((current) => ({
                          ...current,
                          visibility: event.target.value as Visibility,
                        }))
                      }
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="public">Public</option>
                      <option value="members">Members only</option>
                      <option value="private">Private (admin only)</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={eventDraft.blocksReservations}
                    onChange={(event) =>
                      setEventDraft((current) => ({
                        ...current,
                        blocksReservations: event.target.checked,
                      }))
                    }
                  />
                  Block space reservations during this event
                </label>

                <button
                  type="submit"
                  disabled={eventSaving}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  {eventSaving ? "Saving…" : "Save event changes"}
                </button>
              </div>
            </form>
          ) : null}

          <div className="workflow-volunteer-panel">
            <h3 className="text-sm font-semibold text-slate-900">Seva & volunteer opportunities</h3>
            {!activeEvent ? (
              <WorkspaceEmpty
                compact
                icon="volunteer"
                title="Every occasion has a place for seva"
                description="Select an occasion to plan volunteer roles, set capacity and see the families who have signed up."
              />
            ) : (
              <>
                <div className="workflow-volunteer-heading">
                  <p className="workflow-helper">
                    For {activeEvent.title}. Set a role, time and capacity so families know how they
                    can help.
                  </p>
                  <button
                    type="button"
                    className="workflow-button"
                    aria-expanded={showSlotForm}
                    aria-controls="create-volunteer-form"
                    onClick={() => setShowSlotForm((value) => !value)}
                  >
                    <WorkspaceIcon name={showSlotForm ? "close" : "plus"} size={16} />
                    {showSlotForm ? "Close form" : "Add opportunity"}
                  </button>
                </div>
                {showSlotForm ? (
                  <form
                    id="create-volunteer-form"
                    className="workflow-slot-form"
                    onSubmit={createSlot}
                  >
                    <div className="space-y-1">
                      <FieldLabel htmlFor="new-slot-title">Slot title</FieldLabel>
                      <input
                        id="new-slot-title"
                        required
                        value={newSlot.title}
                        onChange={(event) =>
                          setNewSlot((current) => ({ ...current, title: event.target.value }))
                        }
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel htmlFor="new-slot-description">Slot description</FieldLabel>
                      <textarea
                        id="new-slot-description"
                        value={newSlot.description}
                        onChange={(event) =>
                          setNewSlot((current) => ({ ...current, description: event.target.value }))
                        }
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
                          onChange={(event) =>
                            setNewSlot((current) => ({ ...current, startTime: event.target.value }))
                          }
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel htmlFor="new-slot-end">End date/time</FieldLabel>
                        <input
                          id="new-slot-end"
                          type="datetime-local"
                          value={newSlot.endTime}
                          onChange={(event) =>
                            setNewSlot((current) => ({ ...current, endTime: event.target.value }))
                          }
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <FieldLabel htmlFor="new-slot-capacity">
                          Number of volunteers needed
                        </FieldLabel>
                        <input
                          id="new-slot-capacity"
                          type="number"
                          min={1}
                          value={newSlot.capacity}
                          onChange={(event) =>
                            setNewSlot((current) => ({ ...current, capacity: event.target.value }))
                          }
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel htmlFor="new-slot-state">State</FieldLabel>
                        <select
                          id="new-slot-state"
                          value={newSlot.slotState}
                          onChange={(event) =>
                            setNewSlot((current) => ({
                              ...current,
                              slotState: event.target.value as SlotState,
                            }))
                          }
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
                        onChange={(event) =>
                          setNewSlot((current) => ({ ...current, notes: event.target.value }))
                        }
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                        rows={2}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={slotSaving}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      {slotSaving ? "Adding…" : "Create volunteer opportunity"}
                    </button>
                  </form>
                ) : null}

                <div className="mt-3 space-y-3">
                  {slotsError ? (
                    <WorkspaceNotice tone="error">
                      {slotsError}{" "}
                      <button type="button" onClick={() => void loadSlots(activeEvent.id)}>
                        Try again
                      </button>
                    </WorkspaceNotice>
                  ) : null}
                  {slotsLoading ? (
                    <div className="workflow-loading" role="status">
                      <span className="workflow-loading-dot" /> Gathering volunteer opportunities…
                    </div>
                  ) : null}
                  {!slotsLoading && !slotsError && !slots.length && !showSlotForm ? (
                    <WorkspaceEmpty
                      compact
                      icon="volunteer"
                      title="Invite the first helping hand"
                      description="Create a seva opportunity with a clear role, time and capacity. Confirmed volunteers will appear alongside it."
                    />
                  ) : null}
                  {slots.map((slot) => {
                    const confirmed = (signupsBySlot.get(slot.id) ?? []).filter(
                      (entry) => entry.signup_status === "confirmed",
                    );
                    return (
                      <article
                        key={slot.id}
                        className="rounded-md border border-slate-200 bg-slate-50 p-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{slot.title}</p>
                            <p className="text-xs text-slate-600">
                              {new Intl.DateTimeFormat("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                                timeZone: "America/Los_Angeles",
                              }).format(new Date(slot.start_time)) + " Pacific"}{" "}
                              • {confirmed.length}/{slot.capacity}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={slotSaving}
                            onClick={() => void toggleSlotState(slot)}
                            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs"
                          >
                            {slot.slot_state === "open" ? "Close" : "Reopen"}
                          </button>
                        </div>

                        {confirmed.length > 0 ? (
                          <div className="mt-2 rounded border border-slate-200 bg-white p-2">
                            <p className="text-xs font-medium text-slate-700">
                              Confirmed volunteers
                            </p>
                            <ul className="mt-1 space-y-1 text-xs text-slate-600">
                              {confirmed.map((signup) => (
                                <li key={signup.id}>
                                  {signup.participant_name} ({signup.participant_type}) -{" "}
                                  {signup.email}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="workflow-helper mt-3">
                            No volunteers confirmed yet.{" "}
                            {slot.slot_state === "open"
                              ? "This opportunity is open for families to join."
                              : "Reopen this opportunity to welcome signups."}
                          </p>
                        )}
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
