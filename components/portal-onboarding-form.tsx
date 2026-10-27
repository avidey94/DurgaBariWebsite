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
      setError(
        submitError instanceof Error ? submitError.message : "Unable to complete profile setup.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="db-panel p-6 md:p-8">
      <p className="db-kicker">Step 3 of 3 · Family Profile</p>
      <h1 className="db-title mt-3">One last step to set up your account</h1>
      <div className="mt-5 grid gap-2 text-center text-xs font-semibold text-[var(--db-text-soft)] sm:grid-cols-3">
        <span className="rounded-xl bg-[var(--db-surface-soft)] p-3">✓ Account created</span>
        <span className="rounded-xl bg-[var(--db-surface-soft)] p-3">✓ Email confirmed</span>
        <span className="rounded-xl border border-[var(--db-border-soft)] bg-[var(--db-panel-strong)] p-3 text-[var(--db-text)]">
          3. Complete your profile
        </span>
      </div>
      <p className="mt-5 text-sm leading-7 text-[var(--db-text-soft)]">
        Signed in as <strong>{email}</strong>. Tell us who is in your household so Durga Bari can
        review your membership.
      </p>
      <p className="mt-2 text-sm leading-7 text-[var(--db-text-soft)]">
        Your details are saved when you tap <strong>Complete profile</strong>. If you leave now,
        sign in again to return here. Member access begins after an administrator approves your
        profile.
      </p>

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-sm text-slate-700">
          Family or household name
          <input
            value={familyDisplayName}
            onChange={(event) => setFamilyDisplayName(event.target.value)}
            className="db-input mt-1 block"
            placeholder="The Sharma family"
            autoComplete="organization"
            required
          />
        </label>

        <label className="text-sm text-slate-700">
          Contact phone number
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(formatUsPhoneNumber(event.target.value))}
            className="db-input mt-1 block"
            placeholder="925-555-1234"
            type="tel"
            autoComplete="tel"
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
            className="db-input mt-1 block"
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
            className="db-input mt-1 block"
            required
          />
        </label>

        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-slate-800">Adult names</p>
          <p className="mt-1 text-xs text-[var(--db-text-soft)]">
            Enter the name of each adult in your household.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {adultNames.map((name, index) => (
              <input
                key={`adult-${index + 1}`}
                value={name}
                onChange={(event) =>
                  setAdultNames((current) =>
                    current.map((entry, currentIndex) =>
                      currentIndex === index ? event.target.value : entry,
                    ),
                  )
                }
                placeholder={`Adult ${index + 1} name`}
                className="db-input text-sm"
                required
              />
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-slate-800">Children&apos;s names</p>
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
                      current.map((entry, currentIndex) =>
                        currentIndex === index ? event.target.value : entry,
                      ),
                    )
                  }
                  placeholder={`Child ${index + 1} name`}
                  className="db-input text-sm"
                  required
                />
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <p className="mb-3 text-xs leading-6 text-[var(--db-text-soft)]">
            Please review these details before submitting. After setup, changes are handled by a
            Durga Bari administrator.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="db-button-primary text-sm disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Complete profile"}
          </button>
        </div>
      </form>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
