"use client";

import { useEffect, useRef, useState } from "react";
import { eventTypes } from "@/lib/events/hub";
import { CalendarIcon as Icon } from "./CalendarIcon";
import styles from "./CalendarHub.module.css";

export function EventFilters({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div ref={root} className={styles.filterControl}>
      <button
        ref={trigger}
        className={styles.filterTrigger}
        aria-label={
          value
            ? `Filter events, ${eventTypes[value as keyof typeof eventTypes]} selected`
            : "Filter events"
        }
        aria-expanded={open}
        aria-controls="calendar-event-filters"
        onClick={() => setOpen(!open)}
      >
        <Icon name="filter" />
        {value && <span className={styles.filterIndicator} />}
      </button>
      {open && (
        <div ref={panel} id="calendar-event-filters" className={styles.filterPanel}>
          <fieldset>
            <legend>Event type</legend>
            {[["", "All event types"], ...Object.entries(eventTypes)].map(([key, label]) => (
              <label key={key || "all"}>
                <input
                  type="radio"
                  name="calendar-event-type"
                  value={key}
                  checked={value === key}
                  onChange={() => onChange(key)}
                />
                <span className={styles.filterOption}>
                  {key && <i className={styles.typeDot} data-type={key} />}
                  <span>{label}</span>
                  {value === key && <Icon name="check" />}
                </span>
              </label>
            ))}
          </fieldset>
          <button
            className={styles.filterDone}
            onClick={() => {
              setOpen(false);
              trigger.current?.focus();
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
