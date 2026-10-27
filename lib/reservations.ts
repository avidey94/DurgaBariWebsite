export const RESERVATION_BASE_USD = 101;
export const PRIEST_ADDON_USD = 201;
export const HAVAN_ADDON_USD = 50;
export const MAX_RESERVATION_MINUTES = 360;

export type ReservationStatus = "requested" | "approved" | "declined";

export interface Reservation {
  id: string;
  booking_reference: string;
  auth_user_id: string;
  email: string;
  event_title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  contact_phone: string | null;
  notes: string | null;
  include_priest: boolean;
  include_havan: boolean;
  price_usd: number;
  status: ReservationStatus;
  payment_reference: string | null;
  payment_verified_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const reservationPrice = (priest: boolean, havan: boolean) =>
  RESERVATION_BASE_USD + (priest ? PRIEST_ADDON_USD : 0) + (havan ? HAVAN_ADDON_USD : 0);

export const reservationPackage = (priest: boolean, havan: boolean) =>
  `Event reservation${priest ? " + Priest" : ""}${havan ? " + Havan" : ""}`;

export const reservationMinutes = (start: string, end: string): number | null => {
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return null;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  if (startHour > 23 || endHour > 23 || startMinute > 59 || endMinute > 59) return null;
  return endHour * 60 + endMinute - startHour * 60 - startMinute;
};

export const isValidEventDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
  new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

export const pacificNow = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
};
