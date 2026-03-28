"use client";

import { useState } from "react";

import { formatUsPhoneNumber } from "@/lib/phone";

interface PortalOnboardingFormProps {
  email: string;
  initialName?: string;
  initialAdultsCount?: number;
  initialChildrenCount?: number;
}

const resizeNames = (current: string[], targetCount: number) => {
  const next = [...current];
  if (targetCount < next.length) {
    return next.slice(0, targetCount);
  }
  while (next.length < targetCount) {
    next.push("");
  }
  return next;
};

export function PortalOnboardingForm({
  email,
  initialName = "",
  initialAdultsCount = 1,
  initialChildrenCount = 0,
}: PortalOnboardingFormProps) {
  const [familyDisplayName, setFamilyDisplayName] = useState(initialName);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [adultsCount, setAdultsCount] = useState(String(initialAdultsCount));
  const [childrenCount, setChildrenCount] = useState(String(initialChildrenCount));
  const [adultNames, setAdultNames] = useState<string[]>(
    resizeNames(initialName ? [initialName] : [], initialAdultsCount),
  );
  const [childNames, setChildNames] = useState<string[]>(resizeNames([], initialChildrenCount));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/portal/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyDisplayName,
          phoneNumber,
          adultsCount: Number(adultsCount),
          childrenCount: Number(childrenCount),
          adultNames,
          childNames,
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to complete profile setup.");
      }

      window.location.href = "/portal";
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to complete profile setup.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome to Your Portal</h1>
      <p className="mt-2 text-sm text-slate-600">
        Signed in as <strong>{email}</strong>
      </p>
      <p className="mt-1 text-sm text-slate-700">
        Complete your one-time profile setup. Future profile changes must be requested through an admin.
      </p>

      <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-sm text-slate-700">
          Name
          <input
            value={familyDisplayName}
            onChange={(event) => setFamilyDisplayName(event.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <label className="text-sm text-slate-700">
          Phone #
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(formatUsPhoneNumber(event.target.value))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="925-555-1234"
            required
          />
        </label>

        <label className="text-sm text-slate-700">
          Adults
          <input
            type="number"
            min={1}
            value={adultsCount}
            onChange={(event) => {
              const nextValue = event.target.value;
              setAdultsCount(nextValue);
              const parsed = Number(nextValue);
              if (Number.isFinite(parsed) && parsed >= 1) {
                setAdultNames((current) => resizeNames(current, Math.floor(parsed)));
              }
            }}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <label className="text-sm text-slate-700">
          Children
          <input
            type="number"
            min={0}
            value={childrenCount}
            onChange={(event) => {
              const nextValue = event.target.value;
              setChildrenCount(nextValue);
              const parsed = Number(nextValue);
              if (Number.isFinite(parsed) && parsed >= 0) {
                setChildNames((current) => resizeNames(current, Math.floor(parsed)));
              }
            }}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-slate-800">Adult names</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {adultNames.map((name, index) => (
              <input
                key={`adult-${index + 1}`}
                value={name}
                onChange={(event) =>
                  setAdultNames((current) =>
                    current.map((entry, currentIndex) => (currentIndex === index ? event.target.value : entry)),
                  )
                }
                placeholder={`Adult ${index + 1} name`}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-slate-800">Children names</p>
          {childNames.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">No children added.</p>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {childNames.map((name, index) => (
                <input
                  key={`child-${index + 1}`}
                  value={name}
                  onChange={(event) =>
                    setChildNames((current) =>
                      current.map((entry, currentIndex) => (currentIndex === index ? event.target.value : entry)),
                    )
                  }
                  placeholder={`Child ${index + 1} name`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Complete setup"}
          </button>
        </div>
      </form>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
