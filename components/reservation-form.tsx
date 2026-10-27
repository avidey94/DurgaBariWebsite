"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  HAVAN_ADDON_USD,
  MAX_RESERVATION_MINUTES,
  PRIEST_ADDON_USD,
  RESERVATION_BASE_USD,
  reservationMinutes,
  reservationPackage,
  reservationPrice,
} from "@/lib/reservations";

interface MemberReservation {
  id: string;
  booking_reference: string;
  event_title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  include_priest: boolean;
  include_havan: boolean;
  price_usd: number;
  status: "requested" | "approved" | "declined";
}

export function ReservationForm({ zeffyUrl, selectedDate }: { zeffyUrl: string; selectedDate?: string }) {
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [includePriest, setIncludePriest] = useState(false);
  const [includeHavan, setIncludeHavan] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [reservations, setReservations] = useState<MemberReservation[]>([]);

  useEffect(() => {
    if (selectedDate) setEventDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    void fetch("/api/reservations")
      .then((response) => response.ok ? response.json() : null)
      .then((data: { reservations?: MemberReservation[] } | null) => setReservations(data?.reservations ?? []))
      .catch(() => setReservations([]));
  }, []);

  const minutes = reservationMinutes(startTime, endTime);
  const validDuration = minutes !== null && minutes > 0 && minutes <= MAX_RESERVATION_MINUTES;
  const price = reservationPrice(includePriest, includeHavan);
  const packageName = reservationPackage(includePriest, includeHavan);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!validDuration) {
      setError("Choose an end time after the start time, within 6 hours.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventTitle, eventDate, startTime, endTime, contactPhone, notes, includePriest, includeHavan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Could not save the request.");
      setBookingReference(data.bookingReference);
      const listResponse = await fetch("/api/reservations");
      if (listResponse.ok) {
        const listData = await listResponse.json();
        setReservations(listData.reservations ?? []);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {bookingReference ? (
        <section aria-live="polite" className="rounded-xl border-2 border-emerald-700 bg-emerald-50 p-5 text-emerald-950">
          <h2 className="font-serif text-2xl font-bold">Your request was saved</h2>
          <p className="mt-2">Booking reference: <strong className="select-all">{bookingReference}</strong></p>
          <p className="mt-2">Your package is <strong>{packageName}</strong> for <strong>${price}</strong>. On Zeffy, select exactly this one package and enter your booking reference in the required field.</p>
          <p className="mt-2 text-sm">Have a discount code? Enter it in Zeffy&apos;s payment section and click Check. Confirm the adjusted total before completing the order.</p>
          <p className="mt-2 text-sm">Zeffy may suggest an optional contribution to support its platform. You can change that amount at checkout.</p>
          <p className="mt-2 font-semibold">Your time is pending review. Payment does not confirm the booking.</p>
          {zeffyUrl ? (
            <a href={zeffyUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900">
              Continue to Zeffy payment
            </a>
          ) : (
            <p className="mt-4 rounded-lg bg-white p-3">The Zeffy payment link is being connected. Please keep this booking reference and check back soon.</p>
          )}
        </section>
      ) : null}

      {bookingReference ? (
        <button type="button" onClick={() => {
          setBookingReference("");
          setEventTitle(""); setEventDate(""); setStartTime(""); setEndTime("");
          setContactPhone(""); setNotes(""); setIncludePriest(false); setIncludeHavan(false);
        }} className="rounded-lg border border-[var(--db-border)] bg-white px-4 py-2 font-semibold">Make another request</button>
      ) : <form onSubmit={submit} className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[var(--db-text)]">Build your event</h2>
          <p className="mt-1 text-sm text-[var(--db-text-soft)]">The reservation fee is the same for any duration up to 6 hours.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 block text-sm font-semibold">Event name
            <input value={eventTitle} onInput={(event) => setEventTitle(event.currentTarget.value)} onChange={(event) => setEventTitle(event.target.value)} required maxLength={120} placeholder="Family puja, celebration, gathering…" className="mt-1 w-full rounded-lg border border-[var(--db-border)] bg-white px-3 py-2" />
          </label>
          <label className="block text-sm font-semibold">Date
            <input type="date" value={eventDate} onInput={(event) => setEventDate(event.currentTarget.value)} onChange={(event) => setEventDate(event.target.value)} required className="mt-1 w-full rounded-lg border border-[var(--db-border)] bg-white px-3 py-2" />
          </label>
          <div className="hidden sm:block" />
          <label className="block text-sm font-semibold">Start time
            <input type="time" value={startTime} onInput={(event) => setStartTime(event.currentTarget.value)} onChange={(event) => setStartTime(event.target.value)} required className="mt-1 w-full rounded-lg border border-[var(--db-border)] bg-white px-3 py-2" />
          </label>
          <label className="block text-sm font-semibold">End time
            <input type="time" value={endTime} onInput={(event) => setEndTime(event.currentTarget.value)} onChange={(event) => setEndTime(event.target.value)} required className="mt-1 w-full rounded-lg border border-[var(--db-border)] bg-white px-3 py-2" />
          </label>
          <p className={`sm:col-span-2 text-sm ${startTime && endTime && !validDuration ? "text-red-700" : "text-[var(--db-text-soft)]"}`}>
            {validDuration ? `${(minutes ?? 0) / 60} hours selected. Maximum: 6 hours.` : "Choose a time window of no more than 6 hours. Times are Pacific."}
          </p>
          <label className="sm:col-span-2 block text-sm font-semibold">Contact phone (optional)
            <input type="tel" value={contactPhone} onInput={(event) => setContactPhone(event.currentTarget.value)} onChange={(event) => setContactPhone(event.target.value)} maxLength={40} className="mt-1 w-full rounded-lg border border-[var(--db-border)] bg-white px-3 py-2" />
          </label>
          <label className="sm:col-span-2 block text-sm font-semibold">Tell us about your event (optional)
            <textarea value={notes} onInput={(event) => setNotes(event.currentTarget.value)} onChange={(event) => setNotes(event.target.value)} maxLength={1500} rows={4} className="mt-1 w-full rounded-lg border border-[var(--db-border)] bg-white px-3 py-2" />
          </label>
        </div>
        <fieldset className="space-y-3">
          <legend className="font-serif text-xl font-bold text-[var(--db-text)]">Add services</legend>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[var(--db-border)] bg-white p-4">
            <span className="flex items-center gap-3"><input type="checkbox" checked={includePriest} onChange={(event) => setIncludePriest(event.target.checked)} className="h-5 w-5" /> Priest</span>
            <strong>+${PRIEST_ADDON_USD}</strong>
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[var(--db-border)] bg-white p-4">
            <span className="flex items-center gap-3"><input type="checkbox" checked={includeHavan} onChange={(event) => setIncludeHavan(event.target.checked)} className="h-5 w-5" /> Havan</span>
            <strong>+${HAVAN_ADDON_USD}</strong>
          </label>
        </fieldset>
        <div className="rounded-xl border border-[var(--db-border)] bg-amber-50 p-5">
          <div className="flex justify-between text-sm"><span>Event reservation</span><span>${RESERVATION_BASE_USD}</span></div>
          {includePriest ? <div className="mt-2 flex justify-between text-sm"><span>Priest</span><span>${PRIEST_ADDON_USD}</span></div> : null}
          {includeHavan ? <div className="mt-2 flex justify-between text-sm"><span>Havan</span><span>${HAVAN_ADDON_USD}</span></div> : null}
          <div className="mt-4 flex justify-between border-t border-amber-300 pt-3 text-lg font-bold"><span>Package price</span><span>${price}</span></div>
          <p className="mt-2 text-xs text-[var(--db-text-soft)]">Zeffy may suggest an optional contribution at checkout.</p>
          <p className="mt-1 text-xs text-[var(--db-text-soft)]">Any discount code is applied on Zeffy after you save this request.</p>
        </div>
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
        <button type="submit" disabled={submitting || !validDuration} className="rounded-lg bg-[#9d3b1a] px-6 py-3 font-bold text-white hover:bg-[#7c2c13] disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? "Saving request…" : "Save request and continue to payment"}
        </button>
      </form>}

      {reservations.length ? (
        <section className="border-t border-[var(--db-border)] pt-6">
          <h2 className="font-serif text-xl font-bold">Your recent requests</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {reservations.map((reservation) => (
              <li key={reservation.id} className="rounded-lg border border-[var(--db-border)] bg-white p-3">
                <strong>{reservation.event_title}</strong> · {reservation.event_date} · {reservation.start_time.slice(0, 5)}–{reservation.end_time.slice(0, 5)} · <span className="capitalize">{reservation.status}</span>
                <div className="text-[var(--db-text-soft)]">Reference {reservation.booking_reference} · ${reservation.price_usd}</div>
                {reservation.status === "requested" && zeffyUrl ? <a href={zeffyUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-emerald-800 underline">Pay through Zeffy</a> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
