import { toPacificLocal } from "./timezone";
import type { EventType, EventVisibility } from "./calendar";

export type RsvpStatus = "going" | "maybe" | "not_going";
export interface CalendarRsvp {
  status: RsvpStatus;
  headcount: number;
}
export interface HubEvent {
  key: string;
  eventId: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  type: EventType;
  start: string;
  end: string | null;
  allDay: boolean;
  visibility: EventVisibility;
  location: string | null;
  image: string | null;
  recurring: boolean;
  blocksSpace: boolean;
  isRsvpEnabled: boolean;
  capacity: number | null;
  rsvp: CalendarRsvp | null;
}
export interface HubReservation {
  key: string;
  start: string;
  end: string;
}
export interface CalendarMonthData {
  month: string;
  events: HubEvent[];
  reservations: HubReservation[];
  signedIn: boolean;
  canRsvp: boolean;
  isMember: boolean;
  availabilityUnavailable: boolean;
  rsvpUnavailable: boolean;
}
export const eventTypes: Record<EventType, string> = {
  festival: "Festivals",
  ritual: "Puja & rituals",
  darshan: "Darshan",
  community: "Community",
  volunteer: "Seva & volunteering",
  special: "Special events",
};
export const pacificDay = (iso: string) => toPacificLocal(iso).slice(0, 10);
export const validMonth = (month: string) => /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(month);
export const shiftMonth = (month: string, offset: number) => {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7);
};
export const shiftDay = (day: string, offset: number) => {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
export const dateLabel = (day: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(
    new Date(`${day}T12:00:00Z`),
  );
export const monthLabel = (month: string) =>
  dateLabel(`${month}-01`, { month: "long", year: "numeric" });
export const monthDays = (month: string) => {
  const first = `${month}-01`;
  const weekday = new Date(`${first}T12:00:00Z`).getUTCDay();
  const last = shiftDay(`${shiftMonth(month, 1)}-01`, -1);
  const length = Math.ceil((weekday + Number(last.slice(-2))) / 7) * 7;
  return Array.from({ length }, (_, index) => shiftDay(first, index - weekday));
};
export const occursOnDay = (event: HubEvent, day: string) => {
  const start = toPacificLocal(event.start);
  const end = event.end ? toPacificLocal(event.end) : start;
  return (
    start.slice(0, 10) === day || (start < `${shiftDay(day, 1)}T00:00` && end > `${day}T00:00`)
  );
};
export const timeLabel = (event: Pick<HubEvent, "start" | "end" | "allDay">) => {
  if (event.allDay) return "All day";
  const format = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  return `${format(event.start)}${event.end ? ` – ${format(event.end)}` : ""}`;
};
