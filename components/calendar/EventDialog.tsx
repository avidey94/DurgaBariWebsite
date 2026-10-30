"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  dateLabel,
  eventTypes,
  pacificDay,
  timeLabel,
  type HubEvent,
  type CalendarRsvp,
  type RsvpStatus,
} from "@/lib/events/hub";
import { CalendarIcon as Icon } from "./CalendarIcon";
import styles from "./CalendarHub.module.css";

export function EventDialog({
  event,
  canRsvp,
  signedIn,
  rsvpUnavailable,
  onClose,
  onRsvp,
}: {
  event: HubEvent;
  canRsvp: boolean;
  signedIn: boolean;
  rsvpUnavailable: boolean;
  onClose: () => void;
  onRsvp: (id: string, rsvp: CalendarRsvp) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<RsvpStatus>(event.rsvp?.status ?? "going");
  const [headcount, setHeadcount] = useState(event.rsvp?.headcount || 1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);
  const ended = new Date(event.end ?? event.start).getTime() < Date.now();
  const href = `/calendar?month=${pacificDay(event.start).slice(0, 7)}&event=${encodeURIComponent(event.slug)}&date=${pacificDay(event.start)}`;
  const ics = `/api/calendar/events/${encodeURIComponent(event.slug)}/ics?occurrenceStart=${encodeURIComponent(event.start)}`;

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  async function save(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/events/${event.eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, headcount }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message ?? "Your RSVP couldn’t be saved. Please try again.");
      onRsvp(event.eventId, { status: result.rsvp.status, headcount: result.rsvp.headcount });
      setMessage(result.rsvp.status === "going" ? "RSVP saved." : "RSVP updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your RSVP couldn’t be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function share() {
    const url = new URL(href, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
      }
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError"))
        setError("The link couldn’t be copied. You can copy it from your address bar.");
    }
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialog.current?.close();
      }}
      aria-labelledby="event-title"
    >
      <div className={styles.dialogTop}>
        <span className={styles.eyebrow}>Event details</span>
        <button
          className={styles.iconButton}
          aria-label="Close event details"
          onClick={() => dialog.current?.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      {event.image && (
        <div className={styles.eventCover}>
          <Image src={event.image} alt={event.title} fill unoptimized sizes="600px" />
        </div>
      )}
      <div className={styles.dialogBody}>
        <div className={styles.badges}>
          <span className={styles.typeBadge} data-type={event.type}>
            {eventTypes[event.type]}
          </span>
          {event.visibility !== "public" && (
            <span>
              <Icon name="lock" />
              {event.visibility === "members" ? "Members only" : "Private event"}
            </span>
          )}
        </div>
        <h2 id="event-title">{event.title}</h2>
        {event.summary && <p className={styles.dialogSummary}>{event.summary}</p>}
        <div className={styles.eventFacts}>
          <div>
            <Icon name="calendar" />
            <p>
              <strong>
                {dateLabel(pacificDay(event.start), {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {event.end &&
                  pacificDay(event.end) !== pacificDay(event.start) &&
                  ` – ${dateLabel(pacificDay(event.end), { month: "long", day: "numeric" })}`}
              </strong>
              <span>{timeLabel(event)} · Pacific time</span>
            </p>
          </div>
          <div>
            <Icon name="pin" />
            <p>
              <strong>{event.location || "Durga Bari"}</strong>
              {(!event.location || event.location.trim().toLowerCase() === "durga bari") && (
                <span>2350 Paragon Dr, San Jose, CA</span>
              )}
            </p>
          </div>
        </div>
        {event.description && <p className={styles.description}>{event.description}</p>}
        <section className={styles.rsvpSection} aria-labelledby="rsvp-heading">
          <div className={styles.rsvpHeading}>
            <h3 id="rsvp-heading">
              {ended ? "Past event" : event.rsvp?.status === "going" ? "You’re going" : "RSVP"}
            </h3>
            {event.rsvp?.status === "going" && (
              <span className={styles.goingBadge}>
                <Icon name="check" />
                {event.rsvp.headcount} {event.rsvp.headcount === 1 ? "person" : "people"}
              </span>
            )}
          </div>
          {ended ? (
            <p>RSVPs are closed.</p>
          ) : !event.isRsvpEnabled ? (
            <p>
              {event.visibility === "private"
                ? "This gathering is by invitation."
                : "RSVP isn’t open for this gathering."}
            </p>
          ) : !canRsvp ? (
            <>
              <p>
                {signedIn
                  ? "Complete your member sign-in to save your RSVP."
                  : "Sign in as a member to RSVP and keep track of your plans."}
              </p>
              <Link
                className={styles.primaryButton}
                href={`/login?next=${encodeURIComponent(href)}`}
              >
                Member sign-in <Icon name="arrow" />
              </Link>
            </>
          ) : rsvpUnavailable ? (
            <p role="alert">
              We couldn’t check your existing RSVP. Close this event and refresh the calendar before
              making changes.
            </p>
          ) : (
            <form onSubmit={save}>
              <fieldset className={styles.rsvpChoices} disabled={saving}>
                <legend className={styles.srOnly}>Your response</legend>
                {(
                  [
                    ["going", "Going"],
                    ["maybe", "Maybe"],
                    ["not_going", "Can’t make it"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="response"
                      value={value}
                      checked={status === value}
                      onChange={() => {
                        setStatus(value);
                        setMessage("");
                      }}
                    />
                    <span>
                      {status === value && <Icon name="check" />}
                      {label}
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className={styles.rsvpBottom}>
                {status === "going" && (
                  <label className={styles.headcount}>
                    Number attending{" "}
                    <input
                      type="number"
                      min="1"
                      max={event.capacity ?? 1000}
                      value={headcount}
                      onChange={(e) => setHeadcount(Number(e.target.value))}
                      required
                      disabled={saving}
                    />
                  </label>
                )}
                <button type="submit" className={styles.primaryButton} disabled={saving}>
                  {saving ? "Saving…" : event.rsvp ? "Update RSVP" : "Save my RSVP"}
                  <Icon name="arrow" />
                </button>
              </div>
              {event.recurring && (
                <p className={styles.smallNote}>
                  <Icon name="repeat" />
                  Your RSVP applies to this recurring event.
                </p>
              )}
            </form>
          )}
          {message && (
            <p className={styles.success} role="status">
              <Icon name="check" />
              {message}
            </p>
          )}
          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}
        </section>
        <div className={styles.dialogActions}>
          <a href={ics}>
            <Icon name="plus" />
            Add to calendar
          </a>
          <button onClick={() => void share()}>
            <Icon name="share" />
            {shared ? "Link copied" : "Share event"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
