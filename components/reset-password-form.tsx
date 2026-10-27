"use client";

import { useState, type FormEvent } from "react";

export function ResetPasswordForm({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [complete, setComplete] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      setStatus("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("The two passwords do not match.");
      return;
    }

    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { message: string };
      if (!response.ok) {
        setStatus(result.message);
        return;
      }
      setPassword("");
      setConfirmPassword("");
      setComplete(true);
    } catch {
      setStatus("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="db-panel overflow-hidden">
      <div className="border-b border-[var(--db-border-soft)] bg-[var(--db-surface-soft)] px-6 py-5 md:px-8">
        <p className="db-kicker">Member Access</p>
        <h1 className="db-title mt-2">{complete ? "Password updated" : "Choose a new password"}</h1>
      </div>
      <div className="space-y-5 p-6 md:p-8">
        {complete ? (
          <>
            <p className="text-sm leading-7 text-[var(--db-text-soft)]">
              Your new password is ready. You can continue to your portal now.
            </p>
            <a href="/portal" className="db-button-primary w-full text-sm">
              Continue to portal
            </a>
          </>
        ) : (
          <>
            <p className="text-sm leading-7 text-[var(--db-text-soft)]">
              Set a password for <strong>{email}</strong>. Save it so you can sign in again after
              leaving the portal.
            </p>
            <form className="space-y-4" onSubmit={(event) => void submit(event)}>
              <label className="block text-sm font-semibold">
                New password
                <input
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="db-input mt-2"
                />
              </label>
              <p className="text-xs text-[var(--db-text-soft)]">At least 8 characters.</p>
              <label className="block text-sm font-semibold">
                Confirm new password
                <input
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="db-input mt-2"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--db-text-soft)]">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                />
                Show passwords
              </label>
              {status && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  {status}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="db-button-primary w-full text-sm disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save new password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
