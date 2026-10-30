"use client";

import { useState, type FormEvent } from "react";

import type { Language } from "@/lib/i18n";

interface LoginFormProps {
  language: Language;
  supabaseConfigured: boolean;
  devBypassEnabled: boolean;
  initialError?: string;
  initialMode?: "password" | "signup";
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
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(
    initialError
      ? isBn
        ? "ইমেইল লিংকটি সম্পূর্ণ করা যায়নি। আবার সাইন ইন করুন বা নতুন লিংক নিন।"
        : "That email link could not be completed. It may have expired or already been used. Sign in or request a new link."
      : "",
  );

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setStatus("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
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
        changeMode(mode === "signup" ? "check-email" : "recovery-sent");
      }
    } catch {
      setStatus(
        isBn ? "সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।" : "Could not connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {devBypassEnabled && (
        <div className="db-card-muted p-4 text-sm text-emerald-900">
          {isBn
            ? "DEV_LOGIN_EMAIL সক্রিয় আছে। ডেভেলপমেন্টে অথেন্টিকেশন বাইপাস করা হচ্ছে।"
            : "DEV_LOGIN_EMAIL is enabled. Authentication is bypassed in development."}
          <div className="mt-2">
            <a className="font-semibold underline" href="/portal">
              {isBn ? "পোর্টালে যান" : "Continue to portal"}
            </a>
          </div>
        </div>
      )}

      {!supabaseConfigured && (
        <p className="db-card-muted p-4 text-sm text-amber-900">
          {isBn
            ? "Supabase এখনও কনফিগার করা হয়নি।"
            : "Supabase is not configured yet. Sign-in is unavailable."}
        </p>
      )}

      <div className="db-panel overflow-hidden">
        <div className="border-b border-[var(--db-border-soft)] bg-[var(--db-surface-soft)] px-6 py-5 md:px-8">
          <p className="db-kicker">{isBn ? "সদস্য প্রবেশ" : "Member Access"}</p>
          <h1 className="db-title mt-2">
            {mode === "signup"
              ? isBn
                ? "আপনার অ্যাকাউন্ট তৈরি করুন"
                : "Create your account"
              : mode === "recovery" || mode === "recovery-sent"
                ? isBn
                  ? "পাসওয়ার্ড পুনরুদ্ধার"
                  : "Reset your password"
                : mode === "check-email"
                  ? isBn
                    ? "ইমেইল দেখুন"
                    : "Check your email"
                  : isBn
                    ? "স্বাগতম"
                    : "Welcome back"}
          </h1>
        </div>

        <div className="space-y-6 p-6 md:p-8">
          {mode === "check-email" || mode === "recovery-sent" ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[var(--db-border-soft)] bg-[var(--db-surface-soft)] p-5">
                <p className="font-semibold text-[var(--db-text)]">
                  {mode === "check-email"
                    ? isBn
                      ? "পরবর্তী ধাপ: ইমেইল নিশ্চিত করুন"
                      : "Next step: confirm your email"
                    : isBn
                      ? "ইমেইলে লিংক পাঠানো হয়েছে"
                      : "Look for a reset link"}
                </p>
                <p className="mt-2 break-all text-sm text-[var(--db-text-soft)]">
                  {email.trim().toLowerCase()}
                </p>
              </div>
              <p className="text-sm leading-7 text-[var(--db-text-soft)]">
                {mode === "check-email"
                  ? isBn
                    ? "ইমেইলের নিশ্চিতকরণ লিংক খুলুন। তারপর আপনার পরিবারের প্রোফাইল পূরণ করুন। পরে সাইন ইন করতে এখন তৈরি করা পাসওয়ার্ড ব্যবহার করুন।"
                    : "Open the confirmation link in your email, then complete your family profile. Keep the password you just chose for future sign-ins."
                  : isBn
                    ? "এই ইমেইলে অ্যাকাউন্ট থাকলে পাসওয়ার্ড পরিবর্তনের লিংক পাবেন।"
                    : "If this email has an account, a password reset link will arrive. Check spam or promotions too."}
              </p>
              {mode === "check-email" && (
                <>
                  <p className="text-sm leading-7 text-[var(--db-text-soft)]">
                    {isBn
                      ? "প্রোফাইল সেটআপ সম্পূর্ণ করার পর প্রশাসকের অনুমোদন পর্যন্ত সদস্য সুবিধা অপেক্ষমাণ থাকবে।"
                      : "After profile setup, member access stays pending until a Durga Bari administrator approves it."}
                  </p>
                  <p className="text-sm leading-7 text-[var(--db-text-soft)]">
                    {isBn
                      ? "ইমেইল না পেলে স্প্যাম দেখুন। আগে অ্যাকাউন্ট তৈরি করে থাকলে সাইন ইন করুন বা পাসওয়ার্ড বদলান।"
                      : "No email? Check spam. If you already have an account, sign in or reset your password."}
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={() => changeMode("password")}
                className="db-button-secondary w-full text-sm"
              >
                {isBn ? "সাইন ইনে ফিরুন" : "Back to sign in"}
              </button>
            </div>
          ) : (
            <>
              {mode !== "recovery" && (
                <div
                  className="grid grid-cols-2 gap-2 rounded-full bg-[var(--db-surface-soft)] p-1"
                  aria-label="Account access"
                >
                  <button
                    type="button"
                    aria-pressed={mode === "password"}
                    onClick={() => changeMode("password")}
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${mode === "password" ? "bg-[var(--db-panel-strong)] text-[var(--db-text)] shadow-sm" : "text-[var(--db-text-soft)]"}`}
                  >
                    {isBn ? "সাইন ইন" : "Sign in"}
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === "signup"}
                    onClick={() => changeMode("signup")}
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${mode === "signup" ? "bg-[var(--db-panel-strong)] text-[var(--db-text)] shadow-sm" : "text-[var(--db-text-soft)]"}`}
                  >
                    {isBn ? "অ্যাকাউন্ট তৈরি" : "Create account"}
                  </button>
                </div>
              )}

              {mode === "signup" && (
                <div
                  className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-[var(--db-text-soft)]"
                  aria-label="Account setup steps"
                >
                  <span className="rounded-xl bg-[var(--db-surface-soft)] p-2">
                    1. {isBn ? "তৈরি" : "Create"}
                  </span>
                  <span className="rounded-xl bg-[var(--db-surface-soft)] p-2">
                    2. {isBn ? "নিশ্চিত" : "Confirm email"}
                  </span>
                  <span className="rounded-xl bg-[var(--db-surface-soft)] p-2">
                    3. {isBn ? "প্রোফাইল" : "Profile"}
                  </span>
                </div>
              )}

              <p className="text-sm leading-7 text-[var(--db-text-soft)]">
                {mode === "signup"
                  ? isBn
                    ? "নিজের পাসওয়ার্ড বেছে নিন। আমরা আপনার ইমেইলে একটি নিশ্চিতকরণ লিংক পাঠাব।"
                    : "Choose a password you can use again. We’ll email you a link to confirm your address."
                  : mode === "recovery"
                    ? isBn
                      ? "আপনার ইমেইল দিন, আমরা পাসওয়ার্ড পরিবর্তনের লিংক পাঠাব।"
                      : "Enter your account email and we’ll send a password reset link."
                    : isBn
                      ? "আপনার ইমেইল ও পাসওয়ার্ড দিয়ে সাইন ইন করুন।"
                      : "Sign in with the email and password you chose when you created your account."}
              </p>

              <form className="space-y-4" onSubmit={(event) => void runAuth(event)}>
                <label className="block text-sm font-semibold text-[var(--db-text)]">
                  {isBn ? "ইমেইল" : "Email address"}
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.org"
                    className="db-input mt-2"
                  />
                </label>

                {mode !== "recovery" && (
                  <div className="text-sm font-semibold text-[var(--db-text)]">
                    <label htmlFor="account-password">{isBn ? "পাসওয়ার্ড" : "Password"}</label>
                    <div className="relative mt-2">
                      <input
                        id="account-password"
                        required
                        minLength={mode === "signup" ? 8 : undefined}
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="db-input pr-20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute inset-y-0 right-3 text-sm font-semibold text-[var(--db-link)]"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (isBn ? "লুকান" : "Hide") : isBn ? "দেখুন" : "Show"}
                      </button>
                    </div>
                  </div>
                )}

                {mode === "signup" && (
                  <>
                    <p className="text-xs text-[var(--db-text-soft)]">
                      {isBn
                        ? "কমপক্ষে ৮ অক্ষর।"
                        : "At least 8 characters. Save it in your password manager."}
                    </p>
                    <label className="block text-sm font-semibold text-[var(--db-text)]">
                      {isBn ? "পাসওয়ার্ড আবার দিন" : "Confirm password"}
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
                  </>
                )}

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
                  disabled={busy || !supabaseConfigured}
                  className="db-button-primary w-full text-sm disabled:cursor-wait disabled:opacity-60"
                >
                  {busy
                    ? isBn
                      ? "অপেক্ষা করুন..."
                      : "Please wait..."
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
                </button>
              </form>

              {mode === "password" && (
                <button
                  type="button"
                  onClick={() => changeMode("recovery")}
                  className="w-full text-center text-sm font-semibold underline"
                >
                  {isBn ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot your password?"}
                </button>
              )}
              {mode === "recovery" && (
                <button
                  type="button"
                  onClick={() => changeMode("password")}
                  className="w-full text-center text-sm font-semibold underline"
                >
                  {isBn ? "সাইন ইনে ফিরুন" : "Back to sign in"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
