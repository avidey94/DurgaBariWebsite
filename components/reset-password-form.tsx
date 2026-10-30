"use client";

import { useState, type FormEvent } from "react";

import { AuthArrow, AuthPasswordField, AuthStateIcon } from "@/components/auth-fields";
import type { Language } from "@/lib/i18n";

export function ResetPasswordForm({
  email,
  language = "en",
}: {
  email: string;
  language?: Language;
}) {
  const isBn = language === "bn";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [complete, setComplete] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      setStatus(
        isBn
          ? "কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন।"
          : "Use at least 8 characters for your new password.",
      );
      return;
    }
    if (password !== confirmPassword) {
      setStatus(isBn ? "পাসওয়ার্ড দুটি মিলছে না।" : "The two passwords do not match.");
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
      setStatus(
        isBn ? "সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।" : "We couldn’t connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-form" aria-labelledby="reset-heading">
      <p className="auth-eyebrow">
        {isBn ? "দুর্গা বাড়ি · সদস্য পোর্টাল" : "Durga Bari · Member portal"}
      </p>
      <AuthStateIcon kind={complete ? "check" : "lock"} />
      <h1 id="reset-heading" className="auth-heading">
        {complete
          ? isBn
            ? "নতুন পাসওয়ার্ড তৈরি।"
            : "You’re all set."
          : isBn
            ? "নতুন করে শুরু করুন।"
            : "A fresh start."}
      </h1>
      {complete ? (
        <div className="auth-sent-state" role="status">
          <p className="auth-intro">
            {isBn
              ? "আপনার পাসওয়ার্ড পরিবর্তন হয়েছে। পোর্টালে ফিরে যান।"
              : "Your password has been updated. You’re ready to return to your community."}
          </p>
          <a href="/portal" className="auth-submit">
            {isBn ? "পোর্টালে যান" : "Continue to member portal"}
            <AuthArrow />
          </a>
          <p className="auth-small-copy">
            {isBn
              ? "পরেরবার সাইন ইনের জন্য নতুন পাসওয়ার্ডটি সংরক্ষণ করুন।"
              : "Save your new password in your password manager for next time."}
          </p>
        </div>
      ) : (
        <>
          <p className="auth-intro">
            {isBn
              ? "আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড বেছে নিন।"
              : "Choose a new password for your account. A longer, unique password helps keep it secure."}
          </p>
          <div className="auth-email-destination auth-reset-email">
            <span>{isBn ? "আপনার অ্যাকাউন্ট" : "Your account"}</span>
            <strong>{email}</strong>
          </div>
          <form onSubmit={(event) => void submit(event)} aria-busy={busy}>
            <fieldset className="auth-fields" disabled={busy}>
              <AuthPasswordField
                id="new-password"
                label={isBn ? "নতুন পাসওয়ার্ড" : "New password"}
                value={password}
                onChange={setPassword}
                minLength={8}
                autoComplete="new-password"
                hint={isBn ? "কমপক্ষে ৮ অক্ষর।" : "Use at least 8 characters."}
                isBn={isBn}
              />
              <AuthPasswordField
                id="confirm-new-password"
                label={isBn ? "নতুন পাসওয়ার্ড আবার দিন" : "Confirm new password"}
                value={confirmPassword}
                onChange={setConfirmPassword}
                minLength={8}
                autoComplete="new-password"
                isBn={isBn}
              />
            </fieldset>
            {status ? (
              <p role="alert" className="auth-error">
                {status}
              </p>
            ) : null}
            <button type="submit" disabled={busy} className="auth-submit">
              <span>
                {busy
                  ? isBn
                    ? "সংরক্ষণ হচ্ছে…"
                    : "Saving your password…"
                  : isBn
                    ? "নতুন পাসওয়ার্ড সংরক্ষণ করুন"
                    : "Save new password"}
              </span>
              {busy ? <span className="auth-spinner" aria-hidden="true" /> : <AuthArrow />}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
