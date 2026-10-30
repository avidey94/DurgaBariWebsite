"use client";

import { useRouter } from "next/navigation";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  WorkspaceEmpty,
  WorkspaceIcon,
  WorkspaceNotice,
} from "@/components/workspace/workspace-ui";
import { reservationPackage, type Reservation, type ReservationStatus } from "@/lib/reservations";

const statusLabels: Record<ReservationStatus, string> = {
  requested: "Needs review",
  approved: "Approved",
  declined: "Declined",
};
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
const formatTime = (value: string) => {
  const [hour, minute] = value.split(":");
  return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) < 12 ? "am" : "pm"}`;
};

export function AdminReservationsManager() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [workingId, setWorkingId] = useState("");
  const [paymentReferences, setPaymentReferences] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"all" | ReservationStatus>("requested");
  const [search, setSearch] = useState("");
  const [decliningId, setDecliningId] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/reservations", { cache: "no-store" });
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

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (loading || !window.location.hash.startsWith("#reservation-")) return;
    const id = window.location.hash.slice("#reservation-".length);
    const target = reservations.find((reservation) => reservation.id === id);
    if (target && status !== "all" && status !== target.status) {
      setStatus("all");
      return;
    }
    document.getElementById(`reservation-${id}`)?.scrollIntoView({ block: "center" });
  }, [loading, reservations, status]);

  const visibleReservations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reservations.filter(
      (reservation) =>
        (status === "all" || reservation.status === status) &&
        (!query ||
          `${reservation.booking_reference} ${reservation.event_title} ${reservation.email} ${reservation.event_date}`
            .toLowerCase()
            .includes(query)),
    );
  }, [reservations, search, status]);
  const requested = reservations.filter((reservation) => reservation.status === "requested").length;

  const review = async (id: string, action: "approve" | "decline") => {
    setWorkingId(id);
    setError("");
    setSuccess("");
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
      setSuccess(
        action === "approve"
          ? "Reservation approved. It is now in the approved queue."
          : "Reservation declined. It is now in the declined queue.",
      );
      setDecliningId("");
      await load();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update reservation.");
    } finally {
      setWorkingId("");
    }
  };

  return (
    <section className="admin-workflow reservation-workflow">
      <div className="workflow-context">
        <div className="workflow-context-icon">
          <WorkspaceIcon name="calendar" size={22} />
        </div>
        <div>
          <p className="workflow-eyebrow">Space & ritual bookings</p>
          <h2>
            {loading
              ? "Preparing your queue"
              : requested
                ? `${requested} ${requested === 1 ? "request needs" : "requests need"} your review`
                : "A place for every gathering"}
          </h2>
          <p>Review the occasion, verify the Zeffy order, then confirm the family’s booking.</p>
        </div>
      </div>
      <div className="workflow-toolbar">
        <div className="workflow-tabs" aria-label="Reservation status">
          {(["requested", "approved", "declined", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {value === "all" ? "All requests" : statusLabels[value]}
              <span>
                {value === "all"
                  ? reservations.length
                  : reservations.filter((item) => item.status === value).length}
              </span>
            </button>
          ))}
        </div>
        <label className="workflow-search">
          <WorkspaceIcon name="search" size={17} />
          <input
            aria-label="Search reservations"
            placeholder="Reference, family email or occasion"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      {error ? (
        <WorkspaceNotice tone="error">
          {error}{" "}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            Try again
          </button>
        </WorkspaceNotice>
      ) : null}
      {success ? <WorkspaceNotice tone="success">{success}</WorkspaceNotice> : null}
      {loading ? (
        <div className="workflow-loading" role="status">
          <span className="workflow-loading-dot" /> Gathering reservation requests…
        </div>
      ) : null}
      {!loading && !error && !visibleReservations.length ? (
        <WorkspaceEmpty
          icon={status === "requested" && !search ? "check" : "calendar"}
          eyebrow={
            search
              ? "Search results"
              : status === "requested"
                ? "You’re up to date"
                : "Reservation queue"
          }
          title={
            search
              ? "No matching reservations"
              : status === "requested"
                ? "No requests waiting for review"
                : status === "all"
                  ? "The next gathering starts here"
                  : `No ${status} reservations yet`
          }
          description={
            search
              ? "Try a booking reference, family email, occasion or event date."
              : status === "requested"
                ? "New requests from families will appear here. Each booking includes the occasion, package and payment details you need to make a decision."
                : "Family reservation requests and their review history will appear here as bookings are made."
          }
          action={
            search ? (
              <button type="button" className="workflow-button" onClick={() => setSearch("")}>
                Clear search
              </button>
            ) : status !== "all" && reservations.length > 0 ? (
              <button type="button" className="workflow-button" onClick={() => setStatus("all")}>
                View all requests <WorkspaceIcon name="arrow" size={16} />
              </button>
            ) : undefined
          }
        />
      ) : null}
      {!loading &&
        visibleReservations.map((reservation) => (
          <article
            id={`reservation-${reservation.id}`}
            key={reservation.id}
            className="reservation-card scroll-mt-28"
          >
            <div className="reservation-card-heading">
              <div>
                <p className="workflow-eyebrow">{reservation.booking_reference}</p>
                <h3>{reservation.event_title}</h3>
              </div>
              <span className={`workflow-badge workflow-badge-${reservation.status}`}>
                {statusLabels[reservation.status]}
              </span>
            </div>
            <dl className="reservation-facts">
              <div>
                <dt>Occasion</dt>
                <dd>
                  {formatDate(reservation.event_date)}
                  <span>
                    {formatTime(reservation.start_time)} – {formatTime(reservation.end_time)}{" "}
                    Pacific
                  </span>
                </dd>
              </div>
              <div>
                <dt>Family contact</dt>
                <dd>
                  <a href={`mailto:${reservation.email}`}>{reservation.email}</a>
                  {reservation.contact_phone ? (
                    <span>
                      <a href={`tel:${reservation.contact_phone}`}>{reservation.contact_phone}</a>
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt>Selected package</dt>
                <dd>
                  {reservationPackage(reservation.include_priest, reservation.include_havan)}
                  <span>${reservation.price_usd} before any Zeffy discount</span>
                </dd>
              </div>
            </dl>
            {reservation.notes ? (
              <div className="reservation-notes">
                <p className="workflow-eyebrow">A note from the family</p>
                <p>{reservation.notes}</p>
              </div>
            ) : null}
            {reservation.status === "requested" ? (
              <div className="reservation-review">
                <div className="reservation-review-intro">
                  <span className="workflow-step">1</span>
                  <div>
                    <h4>Verify the payment</h4>
                    <p>
                      Match the completed Zeffy order to this booking reference and $
                      {reservation.price_usd} package. Check the final amount and any discount; a
                      100% discount may total $0.
                    </p>
                  </div>
                </div>
                <label className="workflow-field">
                  Zeffy transaction reference
                  <input
                    value={paymentReferences[reservation.id] ?? ""}
                    onChange={(event) =>
                      setPaymentReferences((old) => ({
                        ...old,
                        [reservation.id]: event.target.value,
                      }))
                    }
                    maxLength={120}
                    placeholder="Enter the verified order reference"
                  />
                </label>
                <label className="workflow-checkbox">
                  <input
                    type="checkbox"
                    checked={checked[reservation.id] ?? false}
                    onChange={(event) =>
                      setChecked((old) => ({ ...old, [reservation.id]: event.target.checked }))
                    }
                  />
                  <span>
                    I verified the Zeffy order, booking reference, selected package and any
                    discount.
                  </span>
                </label>
                <div className="reservation-review-actions">
                  <div>
                    <span className="workflow-step">2</span>
                    <span>Confirm your decision</span>
                  </div>
                  <div className="workflow-actions">
                    <button
                      type="button"
                      disabled={
                        workingId === reservation.id ||
                        !checked[reservation.id] ||
                        (paymentReferences[reservation.id] ?? "").trim().length < 4
                      }
                      onClick={() => void review(reservation.id, "approve")}
                      className="workflow-button workflow-button-primary"
                    >
                      <WorkspaceIcon name="check" size={17} />
                      {workingId === reservation.id ? "Updating…" : "Approve booking"}
                    </button>
                    <button
                      type="button"
                      disabled={workingId === reservation.id}
                      onClick={() => setDecliningId(reservation.id)}
                      className="workflow-button workflow-button-quiet"
                    >
                      Decline request
                    </button>
                  </div>
                </div>
                {decliningId === reservation.id ? (
                  <div className="reservation-decline">
                    <p>
                      Decline this family’s reservation request? This decision will be saved to the
                      booking.
                    </p>
                    <div className="workflow-actions">
                      <button
                        type="button"
                        className="workflow-button"
                        onClick={() => setDecliningId("")}
                      >
                        Keep reviewing
                      </button>
                      <button
                        type="button"
                        className="workflow-button workflow-button-danger"
                        disabled={workingId === reservation.id}
                        onClick={() => void review(reservation.id, "decline")}
                      >
                        Confirm decline
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="reservation-history">
                <WorkspaceIcon
                  name={reservation.status === "approved" ? "check" : "clock"}
                  size={16}
                />
                <span>
                  {reservation.status === "approved"
                    ? "Payment verified and booking approved"
                    : "Request reviewed and declined"}
                  {reservation.payment_reference ? ` · Zeffy ${reservation.payment_reference}` : ""}
                </span>
              </div>
            )}
          </article>
        ))}
    </section>
  );
}
