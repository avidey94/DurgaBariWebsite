"use client";

import { useCallback, useEffect, useState } from "react";

import { reservationPackage, type Reservation } from "@/lib/reservations";

export function AdminReservationsManager() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState("");
  const [paymentReferences, setPaymentReferences] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/reservations");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Could not load reservations.");
      setReservations(data.reservations ?? []);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load reservations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (loading || !window.location.hash.startsWith("#reservation-")) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({
      block: "center",
    });
  }, [loading, reservations]);

  const review = async (id: string, action: "approve" | "decline") => {
    setWorkingId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          paymentReference: paymentReferences[id] ?? "",
          paymentChecked: checked[id] === true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Could not update reservation.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update reservation.");
    } finally {
      setWorkingId("");
    }
  };

  if (loading) return <div className="db-card p-6">Loading reservations…</div>;

  return (
    <div className="space-y-4">
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p> : null}
      {!reservations.length ? <div className="db-card p-6">No reservation requests yet.</div> : null}
      {reservations.map((reservation) => (
        <article id={`reservation-${reservation.id}`} key={reservation.id} className="db-card scroll-mt-28 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--db-text-soft)]">{reservation.booking_reference}</p>
              <h2 className="mt-1 font-serif text-xl font-bold">{reservation.event_title}</h2>
            </div>
            <span className="rounded-full border border-[var(--db-border)] px-3 py-1 text-sm font-semibold capitalize">{reservation.status}</span>
          </div>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold">Date and time</dt><dd>{reservation.event_date}, {reservation.start_time.slice(0, 5)}–{reservation.end_time.slice(0, 5)} Pacific</dd></div>
            <div><dt className="font-semibold">Member</dt><dd>{reservation.email}</dd></div>
            <div><dt className="font-semibold">Package</dt><dd>{reservationPackage(reservation.include_priest, reservation.include_havan)}</dd></div>
            <div><dt className="font-semibold">Package price before any Zeffy discount</dt><dd>${reservation.price_usd}</dd></div>
            {reservation.contact_phone ? <div><dt className="font-semibold">Phone</dt><dd>{reservation.contact_phone}</dd></div> : null}
            {reservation.payment_reference ? <div><dt className="font-semibold">Zeffy transaction</dt><dd>{reservation.payment_reference}</dd></div> : null}
          </dl>
          {reservation.notes ? <p className="mt-4 whitespace-pre-wrap rounded-lg bg-white/70 p-3 text-sm">{reservation.notes}</p> : null}
          {reservation.status === "requested" ? (
            <div className="mt-5 space-y-3 border-t border-[var(--db-border)] pt-4">
              <p className="text-sm font-semibold">Verify the completed Zeffy order, booking reference, ${reservation.price_usd} package, and final amount after any discount before approval. A 100% discounted order may total $0.</p>
              <label className="block text-sm font-medium">Zeffy transaction reference
                <input value={paymentReferences[reservation.id] ?? ""} onChange={(event) => setPaymentReferences((old) => ({ ...old, [reservation.id]: event.target.value }))} maxLength={120} className="mt-1 w-full rounded-lg border border-[var(--db-border)] bg-white px-3 py-2" />
              </label>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={checked[reservation.id] ?? false} onChange={(event) => setChecked((old) => ({ ...old, [reservation.id]: event.target.checked }))} className="mt-1" /> I verified the Zeffy order, booking reference, selected package, and any discount.</label>
              <div className="flex flex-wrap gap-3">
                <button type="button" disabled={workingId === reservation.id || !checked[reservation.id] || (paymentReferences[reservation.id] ?? "").trim().length < 4} onClick={() => void review(reservation.id, "approve")} className="rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-50">Approve reservation</button>
                <button type="button" disabled={workingId === reservation.id} onClick={() => void review(reservation.id, "decline")} className="rounded-lg border border-red-700 px-4 py-2 font-semibold text-red-800 disabled:opacity-50">Decline</button>
              </div>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
