"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { AuthArrow, AuthPasswordField, AuthStateIcon } from "@/components/auth-fields";
import type { Language } from "@/lib/i18n";

interface LoginFormProps {
  language: Language;
  supabaseConfigured: boolean;
  devBypassEnabled: boolean;
  initialError?: string;
  initialMode?: "password" | "signup" | "recovery";
  returnTo?: string;
}

type AuthMode = "password" | "signup" | "recovery" | "check-email" | "recovery-sent";

async function submitAuth(payload: Record<string, string>) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as {
    message: string;
    nextStep?: "portal" | "confirm-email";
  };
  return { ok: response.ok, message: data.message, nextStep: data.nextStep };
}

export function LoginForm({
  language,
  supabaseConfigured,
  devBypassEnabled,
  initialError,
  initialMode = "password",
  returnTo = "/portal",
}: LoginFormProps) {
  const isBn = language === "bn";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(
    initialError
      ? isBn
        ? "ইমেইল লিংকটির মেয়াদ শেষ হয়ে থাকতে পারে। আবার সাইন ইন করুন বা নতুন লিংক নিন।"
        : "This email link may have expired or already been used. Sign in below or request a new reset link."
      : "",
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousMode = useRef(mode);

  useEffect(() => {
    if (previousMode.current !== mode) {
      headingRef.current?.focus({ preventScroll: true });
      previousMode.current = mode;
    }
  }, [mode]);

  const changeMode = (nextMode: AuthMode) => {
    if (busy) return;
    setMode(nextMode);
    setStatus("");
    setPassword("");
    setConfirmPassword("");
  };

  const runAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setStatus(isBn ? "ইমেইল আবশ্যক।" : "Enter your email address.");
      return;
    }
    if (mode !== "recovery" && !password) {
      setStatus(isBn ? "পাসওয়ার্ড আবশ্যক।" : "Enter your password.");
      return;
    }
    if (mode === "signup") {
      if (password.length < 8) {
        setStatus(
          isBn
            ? "কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন।"
            : "Use at least 8 characters for your password.",
        );
        return;
      }
      if (password !== confirmPassword) {
        setStatus(isBn ? "পাসওয়ার্ড দুটি মিলছে না।" : "The two passwords do not match.");
        return;
      }
    }

    setBusy(true);
    setStatus("");
    try {
      const result = await submitAuth({
        email: normalizedEmail,
        ...(mode !== "recovery" ? { password } : {}),
        mode,
      });
      if (!result.ok) {
        setStatus(result.message);
        return;
      }
      if (mode === "password" || result.nextStep === "portal") {
        window.location.assign(returnTo);
      } else {
        setMode(mode === "signup" ? "check-email" : "recovery-sent");
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      setStatus(
        isBn
          ? "সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
          : "We couldn’t connect. Your details are still here; please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const emailSent = mode === "check-email" || mode === "recovery-sent";
  const title =
    mode === "signup"
      ? isBn
        ? "পরিবারে স্বাগতম।"
        : "Make yourself at home."
      : mode === "recovery"
        ? isBn
          ? "আবার যুক্ত হোন।"
          : "Let’s get you back in."
        : emailSent
          ? isBn
            ? "ইমেইল দেখুন।"
            : "Check your inbox."
          : isBn
            ? "আবার স্বাগতম।"
            : "Welcome home.";

  return (
    <section className="auth-form" aria-labelledby="auth-heading">
      {devBypassEnabled ? (
        <div className="auth-notice auth-notice-development">
          <span>
            {isBn
              ? "ডেভেলপমেন্ট প্রিভিউ · সাইন ইন বাইপাস সক্রিয়।"
              : "Development preview · sign-in bypass is active."}
          </span>
          <a href="/portal">
            {isBn ? "পোর্টালে যান" : "Open member portal"} <span aria-hidden="true">↗</span>
          </a>
        </div>
      ) : null}

      <p className="auth-eyebrow">
        {isBn ? "দুর্গা বাড়ি · সদস্য পোর্টাল" : "Durga Bari · Member portal"}
      </p>
      {emailSent ? <AuthStateIcon /> : null}
      <h1 id="auth-heading" className="auth-heading" ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      <p className="auth-intro">
        {mode === "signup"
          ? isBn
            ? "আমাদের সম্প্রদায়ের সঙ্গে যুক্ত হতে আপনার অ্যাকাউন্ট তৈরি করুন।"
            : "Create your account and take the first step into our community."
          : mode === "recovery"
            ? isBn
              ? "আপনার অ্যাকাউন্টের ইমেইল দিন। আমরা পাসওয়ার্ড বদলানোর লিংক পাঠাব।"
              : "Enter your account email. We’ll send you a link to choose a new password."
            : mode === "check-email"
              ? isBn
                ? "ইমেইল নিশ্চিত করুন, তারপর পরিবারের প্রোফাইল তৈরি করুন।"
                : "Confirm your email, then tell us a little about your family."
              : mode === "recovery-sent"
                ? isBn
                  ? "এই ইমেইলে অ্যাকাউন্ট থাকলে পাসওয়ার্ড পরিবর্তনের লিংক পাবেন।"
                  : "If there’s an account with this address, a reset link will be on its way."
                : isBn
                  ? "আপনার পরিবার, আপনার সেবা এবং আমাদের আগামী উৎসব—সব এক জায়গায়।"
                  : "Your family, your contributions and what’s coming next. All in one place."}
      </p>

      {emailSent ? (
        <div className="auth-sent-state">
          <div className="auth-email-destination">
            <span>{isBn ? "আপনার ইমেইল" : "Your email address"}</span>
            <strong>{email.trim().toLowerCase()}</strong>
          </div>
          {mode === "check-email" ? (
            <ol className="auth-next-steps" aria-label={isBn ? "পরবর্তী ধাপ" : "What happens next"}>
              <li>
                <span>01</span>
                <div>
                  <strong>{isBn ? "ইমেইলের লিংক খুলুন" : "Open the confirmation link"}</strong>
                  <p>
                    {isBn
                      ? "প্রয়োজনে স্প্যাম ফোল্ডার দেখুন।"
                      : "Check your spam or promotions folder, too."}
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>{isBn ? "আপনার পরিবারের পরিচয় দিন" : "Introduce your household"}</strong>
                  <p>
                    {isBn
                      ? "আপনার পরিবারের সদস্য ও যোগাযোগের তথ্য দিন।"
                      : "Add your family members and contact details."}
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>{isBn ? "সদস্যপদের পর্যালোচনা" : "We’ll review your membership"}</strong>
                  <p>
                    {isBn
                      ? "প্রশাসকের অনুমোদনে সদস্য সুবিধা চালু হবে।"
                      : "An administrator will approve your member access."}
                  </p>
                </div>
              </li>
            </ol>
          ) : (
            <p className="auth-small-copy">
              {isBn
                ? "লিংকটি না পেলে স্প্যাম ফোল্ডার দেখুন। রিসেট লিংক খুলে নতুন পাসওয়ার্ড বেছে নিন।"
                : "Check spam if it hasn’t arrived. Open the link in the email to set your new password."}
            </p>
          )}
          <button
            type="button"
            onClick={() => changeMode("password")}
            className="auth-submit auth-submit-secondary"
          >
            {isBn ? "সাইন ইনে ফিরুন" : "Back to sign in"}
            <AuthArrow />
          </button>
          <button
            type="button"
            onClick={() => changeMode(mode === "check-email" ? "signup" : "recovery")}
            className="auth-text-button"
          >
            {isBn ? "অন্য ইমেইল ব্যবহার করুন" : "Use a different email address"}
          </button>
        </div>
      ) : (
        <>
          {mode !== "recovery" ? (
            <div
              className="auth-mode-switch"
              role="group"
              aria-label={isBn ? "অ্যাকাউন্ট প্রবেশ" : "Account access"}
            >
              <button
                type="button"
                aria-pressed={mode === "password"}
                disabled={busy}
                onClick={() => changeMode("password")}
              >
                {isBn ? "সাইন ইন" : "Sign in"}
              </button>
              <button
                type="button"
                aria-pressed={mode === "signup"}
                disabled={busy}
                onClick={() => changeMode("signup")}
              >
                {isBn ? "অ্যাকাউন্ট তৈরি" : "Create account"}
              </button>
            </div>
          ) : null}

          {!supabaseConfigured ? (
            <p className="auth-notice" role="status">
              {isBn
                ? "সাইন ইন এখন উপলব্ধ নয়। অনুগ্রহ করে পরে চেষ্টা করুন বা আমাদের সঙ্গে যোগাযোগ করুন।"
                : "Sign-in is temporarily unavailable. Please try again later or contact us for help."}
            </p>
          ) : null}

          <form onSubmit={(event) => void runAuth(event)} aria-busy={busy}>
            <fieldset className="auth-fields" disabled={busy || !supabaseConfigured}>
              <div className="auth-field">
                <label htmlFor="account-email">{isBn ? "ইমেইল" : "Email address"}</label>
                <input
                  id="account-email"
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {mode !== "recovery" ? (
                <AuthPasswordField
                  key={`${mode}-password`}
                  id="account-password"
                  label={isBn ? "পাসওয়ার্ড" : "Password"}
                  value={password}
                  onChange={setPassword}
                  minLength={mode === "signup" ? 8 : undefined}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  hint={
                    mode === "signup"
                      ? isBn
                        ? "কমপক্ষে ৮ অক্ষর।"
                        : "Use at least 8 characters."
                      : undefined
                  }
                  isBn={isBn}
                />
              ) : null}
              {mode === "signup" ? (
                <AuthPasswordField
                  id="confirm-password"
                  label={isBn ? "পাসওয়ার্ড আবার দিন" : "Confirm password"}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  minLength={8}
                  autoComplete="new-password"
                  isBn={isBn}
                />
              ) : null}
            </fieldset>
            {mode === "password" ? (
              <div className="auth-recovery-link">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => changeMode("recovery")}
                  className="auth-text-button"
                >
                  {isBn ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot your password?"}
                </button>
              </div>
            ) : null}
            {status ? (
              <p role="alert" className="auth-error">
                {status}
              </p>
            ) : null}
            <button type="submit" disabled={busy || !supabaseConfigured} className="auth-submit">
              <span>
                {busy
                  ? isBn
                    ? "অপেক্ষা করুন…"
                    : mode === "recovery"
                      ? "Sending your link…"
                      : mode === "signup"
                        ? "Creating your account…"
                        : "Signing you in…"
                  : mode === "signup"
                    ? isBn
                      ? "অ্যাকাউন্ট তৈরি করুন"
                      : "Create account"
                    : mode === "recovery"
                      ? isBn
                        ? "রিসেট লিংক পাঠান"
                        : "Send reset link"
                      : isBn
                        ? "সাইন ইন"
                        : "Sign in"}
              </span>
              {busy ? <span className="auth-spinner" aria-hidden="true" /> : <AuthArrow />}
            </button>
          </form>

          {mode === "signup" ? (
            <div className="auth-membership-note">
              <AuthStateIcon kind="lock" />
              <p>
                {isBn
                  ? "অ্যাকাউন্ট তৈরি → ইমেইল নিশ্চিতকরণ → পরিবারের পরিচয়। সদস্য সুবিধা প্রশাসকের অনুমোদনের পর চালু হবে।"
                  : "Create your account, confirm your email and complete your family profile. Member access follows an administrator’s review."}
              </p>
            </div>
          ) : null}
          {mode === "recovery" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => changeMode("password")}
              className="auth-text-button auth-bottom-link"
            >
              <span aria-hidden="true">←</span> {isBn ? "সাইন ইনে ফিরুন" : "Back to sign in"}
            </button>
          ) : null}
          {mode === "password" ? (
            <p className="auth-support-copy">
              {isBn ? "প্রথমবার এসেছেন?" : "New to Durga Bari?"}{" "}
              <button
                type="button"
                disabled={busy}
                onClick={() => changeMode("signup")}
                className="auth-text-button"
              >
                {isBn ? "আমাদের পরিবারে যুক্ত হোন" : "Join our community"}
              </button>
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
