import { eventTypes, timeLabel, type HubEvent } from "@/lib/events/hub";
import { CalendarIcon as Icon } from "./CalendarIcon";
import styles from "./CalendarHub.module.css";

export function CalendarEventRow({
  event,
  onOpen,
}: {
  event: HubEvent;
  onOpen: (event: HubEvent) => void;
}) {
  const start = event.allDay
    ? "All day"
    : new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(event.start));
  return (
    <button className={styles.eventRow} onClick={() => onOpen(event)}>
      <time className={styles.rowTime} dateTime={event.start}>
        {start}
      </time>
      <span className={styles.eventColor} data-type={event.type} />
      <span className={styles.rowBody}>
        <strong>{event.title}</strong>
        <span className={styles.rowMeta}>
          <span data-type={event.type}>{eventTypes[event.type]}</span>
          {event.end && <span>{timeLabel(event)}</span>}
          {event.visibility !== "public" && (
            <span>
              <Icon name="lock" />
              {event.visibility === "members" ? "Members" : "Private"}
            </span>
          )}
        </span>
      </span>
      {event.rsvp?.status === "going" && (
        <span className={styles.goingBadge}>
          <Icon name="check" />
          Going
        </span>
      )}
      {event.rsvp?.status === "maybe" && <span className={styles.maybeBadge}>Maybe</span>}
      <Icon name="right" className={styles.rowChevron} />
    </button>
  );
}
