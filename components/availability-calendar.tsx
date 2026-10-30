"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { pacificNow } from "@/lib/reservations";
import type { SpaceCalendarEntry } from "@/lib/events/availability";
import { WorkspaceIcon } from "@/components/workspace/workspace-ui";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const monthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
};

const shiftMonth = (month: string, offset: number) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
};

const dayEntries = (entries: SpaceCalendarEntry[], day: string) => {
  const start = `${day}T00:00`;
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  const end = `${date.toISOString().slice(0, 10)}T00:00`;
  return entries.filter(
    (entry) => entry.start < end && (entry.end > start || entry.start >= start),
  );
};

const timeLabel = (entry: SpaceCalendarEntry, day: string) => {
  const start = entry.start.slice(0, 10) < day ? "Earlier" : entry.start.slice(11);
  const end = entry.end.slice(0, 10) > day ? "Later" : entry.end.slice(11);
  return `${start}–${end}`;
};

export function AvailabilityCalendar({
  onSelectDate,
  admin = false,
}: {
  onSelectDate?: (date: string) => void;
  admin?: boolean;
}) {
  const today = pacificNow().date;
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(today);
  const [entries, setEntries] = useState<SpaceCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void fetch(`/api/calendar/availability?month=${month}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message ?? "Could not load the calendar.");
        setEntries(result.entries ?? []);
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Could not load the calendar.");
        setEntries([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [month]);

  const days = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const weekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
    return [
      ...Array.from({ length: weekday }, () => null),
      ...Array.from(
        { length: count },
        (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`,
      ),
    ];
  }, [month]);

  const selectedEntries = selectedDay.startsWith(month) ? dayEntries(entries, selectedDay) : [];
  const selectedLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${selectedDay}T12:00:00Z`));

  return (
    <section
      className={`db-card p-4 sm:p-6${admin ? " workspace-space-calendar" : ""}`}
      aria-label="Durga Bari space calendar"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="db-kicker">{admin ? "Temple space" : "Durga Bari calendar"}</p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[var(--db-text)]">
            {admin ? "Space availability" : "Check space availability"}
          </h2>
          <p className="mt-1 text-sm text-[var(--db-text-soft)]">
            Approved bookings and space blocking events appear here. All times are Pacific.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => {
              const next = shiftMonth(month, -1);
              setMonth(next);
              setSelectedDay(`${next}-01`);
            }}
            className="db-button-secondary px-3 py-2 text-sm"
          >
            Previous
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => {
              const next = shiftMonth(month, 1);
              setMonth(next);
              setSelectedDay(`${next}-01`);
            }}
            className="db-button-secondary px-3 py-2 text-sm"
          >
            Next
          </button>
        </div>
      </div>

      <h3 className="mt-5 text-center text-lg font-bold text-[var(--db-text)]">
        {monthLabel(month)}
      </h3>
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--db-text-soft)]">
        {weekdayLabels.map((label) => (
          <span key={label} className="py-2">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} />;
          const count = dayEntries(entries, day).filter((entry) => entry.blocksSpace).length;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              aria-pressed={selectedDay === day}
              aria-current={day === today ? "date" : undefined}
              aria-label={`${day}${loading ? ", checking availability" : error ? ", availability unavailable" : count ? `, ${count} space blocks` : ", no space blocks"}`}
              className={`min-h-16 rounded-lg border p-1 text-left transition sm:min-h-20 sm:p-2 ${selectedDay === day ? "border-emerald-800 bg-emerald-50" : "border-[var(--db-border-soft)] bg-white hover:bg-[var(--db-surface-soft)]"}`}
            >
              <span
                className={`block text-xs font-bold sm:text-sm ${day === today ? "text-[#9d3b1a]" : "text-[var(--db-text)]"}`}
              >
                {Number(day.slice(-2))}
              </span>
              {loading || error ? null : count > 0 ? (
                <span className="mt-1 block rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold leading-tight text-amber-900 sm:text-xs">
                  {count} busy
                </span>
              ) : day >= today ? (
                <span className="mt-1 block text-[10px] leading-tight text-emerald-800 sm:text-xs">
                  No blocks
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-[var(--db-border-soft)] bg-[var(--db-surface-soft)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif text-lg font-bold text-[var(--db-text)]">{selectedLabel}</h3>
          {onSelectDate && !error && selectedDay >= today ? (
            <button
              type="button"
              onClick={() => onSelectDate(selectedDay)}
              className="db-button-primary px-4 py-2 text-xs"
            >
              Use this date
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="mt-2 text-sm text-red-700">
            Availability could not be checked. Please try again later.
          </p>
        ) : loading ? (
          <p className="mt-2 text-sm text-[var(--db-text-soft)]">Loading times…</p>
        ) : selectedEntries.length ? (
          <ul className="mt-3 space-y-2">
            {selectedEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-[var(--db-text)]">{entry.title}</p>
                  <p className="text-xs text-[var(--db-text-soft)]">
                    {timeLabel(entry, selectedDay)} ·{" "}
                    {entry.blocksSpace ? "Space unavailable" : "Does not block reservations"}
                  </p>
                </div>
                {entry.href && (admin || entry.visibility !== "private") ? (
                  <Link
                    href={entry.href}
                    className="text-xs font-semibold text-emerald-800 underline"
                  >
                    Details
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        ) : admin ? (
          <div className="workspace-calendar-empty">
            <WorkspaceIcon name="check" size={22} />
            <div>
              <strong>The space is clear on this date.</strong>
              <p>
                No approved bookings or space blocks are listed. Check pending requests before
                confirming a new gathering.
              </p>
              <Link href="/admin/reservations" className="workspace-text-link">
                Review reservations <WorkspaceIcon name="arrow" size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--db-text-soft)]">
            No blocked times are listed for this day. Choose your preferred time when requesting a
            reservation.
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-[var(--db-text-soft)]">
        A request stays pending until Durga Bari verifies payment and approves it. Pending requests
        do not block the calendar.
      </p>
    </section>
  );
}
