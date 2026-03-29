export type EventPublishStatus = "draft" | "published" | "archived";
export type EventVisibility = "public" | "members" | "private";
export type EventType = "darshan" | "ritual" | "festival" | "community" | "volunteer" | "special";

export interface EventRecurrenceRule {
  frequency: "daily" | "weekly" | "monthly";
  interval?: number;
  byWeekdays?: number[]; // 0=Sun .. 6=Sat
}

export interface CalendarEvent {
  id: string;
  slug: string;
  title: string;
  short_summary: string | null;
  full_description: string | null;
  event_type: EventType;
  category: string;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  recurrence: EventRecurrenceRule | null;
  recurrence_until: string | null;
  location: string | null;
  cover_image_url: string | null;
  publish_status: EventPublishStatus;
  visibility: EventVisibility;
  cta_text: string | null;
  volunteer_notes: string | null;
  max_volunteer_count: number | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface EventOccurrence {
  event: CalendarEvent;
  occurrenceStart: string;
  occurrenceEnd: string | null;
  occurrenceKey: string;
}

export const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 80);

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const addMonths = (date: Date, months: number) => {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
};

const weekdayFromDate = (date: Date) => date.getUTCDay();

const inRange = (start: Date, rangeStart: Date, rangeEnd: Date) =>
  start.getTime() >= rangeStart.getTime() && start.getTime() <= rangeEnd.getTime();

export const expandOccurrences = (
  event: CalendarEvent,
  rangeStartIso: string,
  rangeEndIso: string,
  maxOccurrences = 300,
): EventOccurrence[] => {
  const rangeStart = new Date(rangeStartIso);
  const rangeEnd = new Date(rangeEndIso);
  const baseStart = new Date(event.start_time);
  const baseEnd = event.end_time ? new Date(event.end_time) : null;
  const durationMs = baseEnd ? Math.max(0, baseEnd.getTime() - baseStart.getTime()) : 0;
  const recurrenceUntil = event.recurrence_until ? new Date(event.recurrence_until) : null;

  if (!event.recurrence) {
    if (!inRange(baseStart, rangeStart, rangeEnd)) {
      return [];
    }
    return [
      {
        event,
        occurrenceStart: baseStart.toISOString(),
        occurrenceEnd: baseEnd ? baseEnd.toISOString() : null,
        occurrenceKey: `${event.id}:${baseStart.toISOString()}`,
      },
    ];
  }

  const interval = Math.max(1, Math.floor(event.recurrence.interval ?? 1));
  const occurrences: EventOccurrence[] = [];

  if (event.recurrence.frequency === "daily") {
    let cursor = new Date(baseStart.getTime());
    let iterations = 0;
    while (cursor <= rangeEnd && occurrences.length < maxOccurrences && iterations < 4000) {
      if (!recurrenceUntil || cursor <= recurrenceUntil) {
        if (inRange(cursor, rangeStart, rangeEnd)) {
          occurrences.push({
            event,
            occurrenceStart: cursor.toISOString(),
            occurrenceEnd: durationMs > 0 ? new Date(cursor.getTime() + durationMs).toISOString() : null,
            occurrenceKey: `${event.id}:${cursor.toISOString()}`,
          });
        }
      }
      cursor = addDays(cursor, interval);
      iterations += 1;
    }
    return occurrences;
  }

  if (event.recurrence.frequency === "monthly") {
    let cursor = new Date(baseStart.getTime());
    let iterations = 0;
    while (cursor <= rangeEnd && occurrences.length < maxOccurrences && iterations < 1000) {
      if (!recurrenceUntil || cursor <= recurrenceUntil) {
        if (inRange(cursor, rangeStart, rangeEnd)) {
          occurrences.push({
            event,
            occurrenceStart: cursor.toISOString(),
            occurrenceEnd: durationMs > 0 ? new Date(cursor.getTime() + durationMs).toISOString() : null,
            occurrenceKey: `${event.id}:${cursor.toISOString()}`,
          });
        }
      }
      cursor = addMonths(cursor, interval);
      iterations += 1;
    }
    return occurrences;
  }

  const weekdays = (event.recurrence.byWeekdays ?? [weekdayFromDate(baseStart)])
    .map((entry) => Math.max(0, Math.min(6, Math.floor(entry))))
    .sort((a, b) => a - b);

  const anchorWeekStart = addDays(baseStart, -weekdayFromDate(baseStart));
  let weekStart = new Date(anchorWeekStart.getTime());
  let weekIterations = 0;

  while (weekStart <= rangeEnd && occurrences.length < maxOccurrences && weekIterations < 1000) {
    weekdays.forEach((weekday) => {
      if (occurrences.length >= maxOccurrences) return;
      const occurrenceStart = addDays(weekStart, weekday);
      occurrenceStart.setUTCHours(
        baseStart.getUTCHours(),
        baseStart.getUTCMinutes(),
        baseStart.getUTCSeconds(),
        baseStart.getUTCMilliseconds(),
      );

      if (occurrenceStart < baseStart) return;
      if (recurrenceUntil && occurrenceStart > recurrenceUntil) return;
      if (!inRange(occurrenceStart, rangeStart, rangeEnd)) return;

      occurrences.push({
        event,
        occurrenceStart: occurrenceStart.toISOString(),
        occurrenceEnd: durationMs > 0 ? new Date(occurrenceStart.getTime() + durationMs).toISOString() : null,
        occurrenceKey: `${event.id}:${occurrenceStart.toISOString()}`,
      });
    });

    weekStart = addDays(weekStart, 7 * interval);
    weekIterations += 1;
  }

  return occurrences.sort(
    (a, b) => new Date(a.occurrenceStart).getTime() - new Date(b.occurrenceStart).getTime(),
  );
};

const escapeIcsText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

const toIcsDateTime = (iso: string) => {
  const d = new Date(iso);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hour = String(d.getUTCHours()).padStart(2, "0");
  const minute = String(d.getUTCMinutes()).padStart(2, "0");
  const second = String(d.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
};

const toIcsDate = (iso: string) => {
  const d = new Date(iso);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

export const buildEventIcs = (occurrence: EventOccurrence) => {
  const dtStamp = toIcsDateTime(new Date().toISOString());
  const start = occurrence.occurrenceStart;
  const end = occurrence.occurrenceEnd ?? occurrence.occurrenceStart;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Durga Bari//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${occurrence.event.id}-${escapeIcsText(occurrence.occurrenceStart)}@durgabari`,
    `DTSTAMP:${dtStamp}`,
    occurrence.event.all_day ? `DTSTART;VALUE=DATE:${toIcsDate(start)}` : `DTSTART:${toIcsDateTime(start)}`,
    occurrence.event.all_day ? `DTEND;VALUE=DATE:${toIcsDate(end)}` : `DTEND:${toIcsDateTime(end)}`,
    `SUMMARY:${escapeIcsText(occurrence.event.title)}`,
    occurrence.event.location ? `LOCATION:${escapeIcsText(occurrence.event.location)}` : "",
    occurrence.event.full_description
      ? `DESCRIPTION:${escapeIcsText(occurrence.event.full_description)}`
      : occurrence.event.short_summary
        ? `DESCRIPTION:${escapeIcsText(occurrence.event.short_summary)}`
        : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return `${lines.join("\r\n")}\r\n`;
};

export const buildCalendarFeedIcs = (occurrences: EventOccurrence[]) => {
  const dtStamp = toIcsDateTime(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Durga Bari//Public Calendar Feed//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Durga Bari Events",
    `X-WR-TIMEZONE:UTC`,
  ];

  occurrences.forEach((occurrence) => {
    const start = occurrence.occurrenceStart;
    const end = occurrence.occurrenceEnd ?? occurrence.occurrenceStart;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${occurrence.event.id}-${escapeIcsText(occurrence.occurrenceStart)}@durgabari`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(
      occurrence.event.all_day ? `DTSTART;VALUE=DATE:${toIcsDate(start)}` : `DTSTART:${toIcsDateTime(start)}`,
    );
    lines.push(
      occurrence.event.all_day ? `DTEND;VALUE=DATE:${toIcsDate(end)}` : `DTEND:${toIcsDateTime(end)}`,
    );
    lines.push(`SUMMARY:${escapeIcsText(occurrence.event.title)}`);
    if (occurrence.event.location) lines.push(`LOCATION:${escapeIcsText(occurrence.event.location)}`);
    if (occurrence.event.short_summary) {
      lines.push(`DESCRIPTION:${escapeIcsText(occurrence.event.short_summary)}`);
    }
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
};
