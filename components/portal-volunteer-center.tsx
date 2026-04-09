"use client";

import { useEffect, useMemo, useState } from "react";

interface FamilyMemberOption {
  name: string;
  type: "adult" | "child";
}

interface VolunteerSignup {
  id: string;
  participant_name: string;
  participant_type: "adult" | "child";
}

interface VolunteerSlot {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  capacity: number;
  notes: string | null;
  sort_order: number;
  slot_state: "open" | "closed";
  confirmed_count: number;
  my_signups: VolunteerSignup[];
}

interface VolunteerEvent {
  id: string;
  slug: string | null;
  title: string;
  short_summary: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  event_type: string;
  visibility: "public" | "members" | "private";
  volunteer_slots: VolunteerSlot[];
}

interface Commitment {
  signup_id: string;
  slot_id: string;
  event_id: string;
  event_title: string;
  slot_title: string;
  participant_name: string;
  participant_type: "adult" | "child";
  start_time: string;
  end_time: string | null;
  location: string | null;
}

export function PortalVolunteerCenter() {
  const [events, setEvents] = useState<VolunteerEvent[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [selectedBySlot, setSelectedBySlot] = useState<Record<string, string[]>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/portal/volunteer", { cache: "no-store" });
      const payload = (await response.json()) as {
        events?: VolunteerEvent[];
        myCommitments?: Commitment[];
        familyMembers?: FamilyMemberOption[];
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load volunteer opportunities.");
      }
      setEvents(payload.events ?? []);
      setCommitments(payload.myCommitments ?? []);
      setFamilyMembers(payload.familyMembers ?? []);
      setSelectedBySlot({});
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load volunteer opportunities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleMemberForSlot = (slotId: string, name: string) => {
    setSelectedBySlot((current) => {
      const existing = current[slotId] ?? [];
      const next = existing.includes(name) ? existing.filter((entry) => entry !== name) : [...existing, name];
      return { ...current, [slotId]: next };
    });
  };

  const signup = async (slotId: string) => {
    const participantNames = selectedBySlot[slotId] ?? [];
    if (participantNames.length === 0) {
      setError("Select at least one family member before volunteering.");
      return;
    }

    setSavingSlotId(slotId);
    setError(null);
    try {
      const response = await fetch("/api/portal/volunteer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, participantNames }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to sign up.");
      }
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign up.");
    } finally {
      setSavingSlotId(null);
    }
  };

  const cancelSignup = async (slotId: string, participantName: string) => {
    setSavingSlotId(slotId);
    setError(null);
    try {
      const response = await fetch("/api/portal/volunteer/signup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, participantName }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to cancel.");
      }
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to cancel.");
    } finally {
      setSavingSlotId(null);
    }
  };

  const familyMemberTypeByName = useMemo(() => {
    const map = new Map<string, "adult" | "child">();
    familyMembers.forEach((member) => map.set(member.name, member.type));
    return map;
  }, [familyMembers]);

  return (
    <section className="space-y-6">
      <header className="db-panel p-6 md:p-8">
        <p className="db-kicker">Member Service</p>
        <h1 className="db-title mt-3">Volunteer Action Center</h1>
        <p className="mt-3 text-sm text-[var(--db-text-soft)]">
          Pick event slots and select which family members will volunteer in each service window.
        </p>
      </header>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading volunteer opportunities...</p> : null}

      <section className="db-card p-6">
        <h2 className="text-2xl font-semibold text-[var(--db-text)]">Your upcoming commitments</h2>
        {commitments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No commitments yet. Pick a slot below.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {commitments.map((commitment) => (
              <article key={commitment.signup_id} className="db-card-muted p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {commitment.participant_name} ({commitment.participant_type}) - {commitment.event_title}
                </p>
                <p className="text-xs text-slate-600">
                  {commitment.slot_title} • {new Date(commitment.start_time).toLocaleString("en-US")}
                  {commitment.location ? ` • ${commitment.location}` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => void cancelSignup(commitment.slot_id, commitment.participant_name)}
                  className="db-button-secondary mt-2 px-3 py-1.5 text-xs"
                >
                  Cancel {commitment.participant_name}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Open volunteer opportunities</h2>
        {events.length === 0 && !loading ? <p className="text-sm text-slate-600">No open opportunities right now.</p> : null}

        {events.map((event) => (
          <article key={event.id} className="db-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
              {event.visibility === "members" ? (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                  Members only
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-600">{new Date(event.start_time).toLocaleString("en-US")}</p>
            {event.location ? <p className="text-sm text-slate-600">{event.location}</p> : null}
            {event.short_summary ? <p className="mt-2 text-sm text-slate-700">{event.short_summary}</p> : null}

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {event.volunteer_slots.map((slot) => {
                const full = slot.confirmed_count >= slot.capacity;
                const closed = slot.slot_state === "closed";
                const busy = savingSlotId === slot.id;
                const myNames = new Set(slot.my_signups.map((signup) => signup.participant_name));
                const availableMembers = familyMembers.filter((member) => !myNames.has(member.name));
                const selectedMembers = selectedBySlot[slot.id] ?? [];
                const canSignup = !full && !closed && selectedMembers.length > 0;

                return (
                  <div key={slot.id} className="db-card-muted p-4">
                    <p className="font-medium text-slate-900">{slot.title}</p>
                    {slot.description ? <p className="mt-1 text-sm text-slate-700">{slot.description}</p> : null}
                    <p className="mt-1 text-xs text-slate-600">
                      {new Date(slot.start_time).toLocaleString("en-US")} • {slot.confirmed_count}/{slot.capacity} filled
                    </p>

                    {slot.my_signups.length > 0 ? (
                      <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2">
                        <p className="text-xs font-semibold text-emerald-800">Signed up family members</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {slot.my_signups.map((signup) => (
                            <span
                              key={signup.id}
                              className="inline-flex items-center rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-[11px] text-emerald-800"
                            >
                              {signup.participant_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {availableMembers.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Select family members</p>
                        {availableMembers.map((member) => (
                          <label key={`${slot.id}-${member.name}`} className="flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(member.name)}
                              onChange={() => toggleMemberForSlot(slot.id, member.name)}
                              disabled={busy || closed || full}
                            />
                            <span>
                              {member.name} ({familyMemberTypeByName.get(member.name) ?? member.type})
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-600">All family members are already signed up for this slot.</p>
                    )}

                    <div className="mt-3">
                      <button
                        type="button"
                        disabled={busy || !canSignup}
                        onClick={() => void signup(slot.id)}
                        className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {closed
                          ? "Closed"
                          : full
                            ? "Full"
                            : busy
                              ? "Saving..."
                              : `Volunteer selected (${selectedMembers.length})`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
