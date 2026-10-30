"use client";

import { useEffect, useRef } from "react";
import { dateLabel, type HubEvent } from "@/lib/events/hub";
import { CalendarIcon as Icon } from "./CalendarIcon";
import { CalendarEventRow } from "./CalendarEventRow";
import styles from "./CalendarHub.module.css";

export function DayDialog({
  day,
  events,
  loading,
  error,
  onClose,
  onDayChange,
  onOpenEvent,
}: {
  day: string;
  events: HubEvent[];
  loading: boolean;
  error: boolean;
  onClose: () => void;
  onDayChange: (offset: number) => void;
  onOpenEvent: (event: HubEvent) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`${styles.dialog} ${styles.dayDialog}`}
      aria-labelledby="day-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
    >
      <div className={styles.sheetHandle} aria-hidden="true" />
      <div className={styles.dayDialogHeader}>
        <div>
          <p>{dateLabel(day, { weekday: "long" })}</p>
          <h2
            id="day-title"
            aria-label={dateLabel(day, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          >
            {dateLabel(day, { month: "long", day: "numeric" })}{" "}
            <span>{dateLabel(day, { year: "numeric" })}</span>
          </h2>
        </div>
        <button
          className={styles.iconButton}
          aria-label="Close day view"
          onClick={() => dialog.current?.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className={styles.dayDialogNav}>
        <span aria-live="polite">
          {loading ? "Loading…" : `${events.length} ${events.length === 1 ? "event" : "events"}`}
        </span>
        <div>
          <button
            className={styles.iconButton}
            aria-label="Previous day"
            onClick={() => onDayChange(-1)}
          >
            <Icon name="left" />
          </button>
          <button
            className={styles.iconButton}
            aria-label="Next day"
            onClick={() => onDayChange(1)}
          >
            <Icon name="right" />
          </button>
        </div>
      </div>
      <div className={styles.dayDialogEvents} aria-busy={loading}>
        {loading ? (
          <p className={styles.sheetEmpty}>Loading events…</p>
        ) : error ? (
          <p className={styles.sheetEmpty} role="alert">
            Events couldn’t be loaded. Close this view and try again.
          </p>
        ) : events.length ? (
          events.map((event) => (
            <CalendarEventRow key={event.key} event={event} onOpen={onOpenEvent} />
          ))
        ) : (
          <p className={styles.sheetEmpty}>No events for this date.</p>
        )}
      </div>
      <div className={styles.dayDialogFooter}>Pacific time</div>
    </dialog>
  );
}
