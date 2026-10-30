"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CalendarIcon as Icon } from "./CalendarIcon";
import styles from "./CalendarHub.module.css";

const subscribeOrigin = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export function CalendarTools({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(subscribeOrigin, getOrigin, getServerOrigin);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const feed = `${origin}/api/calendar/feed`;
  return (
    <dialog
      ref={dialog}
      className={`${styles.dialog} ${styles.toolsDialog}`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
      aria-labelledby="calendar-tools-title"
    >
      <div className={styles.dialogTop}>
        <span className={styles.eyebrow}>Calendar subscription</span>
        <button
          className={styles.iconButton}
          aria-label="Close calendar options"
          onClick={() => dialog.current?.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className={styles.dialogBody}>
        <h2 id="calendar-tools-title">Subscribe to calendar</h2>
        <p className={styles.dialogSummary}>Add public Durga Bari events to your calendar.</p>
        <div className={styles.toolLinks}>
          <a
            href={`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(feed)}`}
            target="_blank"
            rel="noreferrer"
          >
            Google Calendar <Icon name="arrow" />
          </a>
          <a href={feed.replace(/^https?:/, "webcal:")}>
            Apple Calendar / Outlook <Icon name="arrow" />
          </a>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(feed);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Calendar link copied" : "Copy subscription link"}
            <Icon name={copied ? "check" : "share"} />
          </button>
          <a href="/api/calendar/feed">
            Download calendar (.ics)
            <Icon name="download" />
          </a>
        </div>
        <p className={styles.smallNote}>
          Member events and RSVPs are visible only in your Durga Bari calendar.
        </p>
      </div>
    </dialog>
  );
}

export function useCalendarServiceWorker() {
  useEffect(() => {
    // Only a neutral offline page is cached. Event and member data always use the network.
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker
        .register("/calendar-sw.js", { scope: "/calendar" })
        .catch(() => {});
  }, []);
}
