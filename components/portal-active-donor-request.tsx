"use client";

import { useState } from "react";

import type { ActiveDonorStatus, RequestedActiveDonorStatus } from "@/lib/portal/types";

interface PortalActiveDonorRequestProps {
  currentStatus: ActiveDonorStatus;
  requestedStatus: RequestedActiveDonorStatus | null;
  requestedAt: string | null;
  allowedStatuses: RequestedActiveDonorStatus[];
}

const tierMeta: Record<RequestedActiveDonorStatus, { label: string; price: string; className: string }> = {
  bronze: {
    label: "Bronze",
    price: "$100/mo",
    className: "border-amber-300 bg-amber-50 text-amber-950",
  },
  silver: {
    label: "Silver",
    price: "$300/mo",
    className: "border-slate-300 bg-slate-50 text-slate-950",
  },
  gold: {
    label: "Gold",
    price: "$500/mo",
    className: "border-yellow-300 bg-yellow-50 text-yellow-950",
  },
};

export function PortalActiveDonorRequest({
  currentStatus,
  requestedStatus,
  requestedAt,
  allowedStatuses,
}: PortalActiveDonorRequestProps) {
  const [selectedStatus, setSelectedStatus] = useState<RequestedActiveDonorStatus>(
    requestedStatus && allowedStatuses.includes(requestedStatus)
      ? requestedStatus
      : (allowedStatuses[0] ?? "bronze"),
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitRequest = async () => {
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/portal/active-donor-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedStatus: selectedStatus }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to submit request.");
      }

      setMessage(`Request sent for ${tierMeta[selectedStatus].label} active donor status. An admin will review it.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-slate-900">
        {currentStatus === "none" ? "Request active donor status" : "Request an active donor tier change"}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {currentStatus === "none"
          ? "Select your intended monthly tier and submit it for membership manager or super admin approval."
          : "You can request either an upgrade or downgrade. Your current tier is excluded, and any new request replaces the previous pending choice."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          Current status: <strong>{currentStatus}</strong>
        </span>
        {requestedStatus ? (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-900">
            Pending request: <strong>{requestedStatus}</strong>
            {requestedAt ? ` (${new Date(requestedAt).toLocaleDateString("en-US")})` : ""}
          </span>
        ) : null}
      </div>

      {allowedStatuses.length === 0 ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          You are already at the only available tier for your current account state.
        </p>
      ) : (
        <fieldset className="mt-4 grid gap-2 sm:grid-cols-3">
          {allowedStatuses.map((status) => (
            <label
              key={status}
              className={`rounded-lg border px-4 py-3 text-sm transition ${
                selectedStatus === status
                  ? "border-[var(--db-selected-border)] bg-[var(--db-selected-bg)] text-[var(--db-selected-text)] shadow-[var(--db-selected-shadow)]"
                  : tierMeta[status].className
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="active-donor-request"
                  checked={selectedStatus === status}
                  onChange={() => setSelectedStatus(status)}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold">{tierMeta[status].label}</p>
                  <p className={`text-xs ${selectedStatus === status ? "text-[var(--db-text-soft)]" : "text-slate-600"}`}>
                    {tierMeta[status].price}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </fieldset>
      )}

      <div className="mt-4">
        <button
          type="button"
          disabled={submitting || allowedStatuses.length === 0}
          onClick={() => void submitRequest()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit membership tier request"}
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
