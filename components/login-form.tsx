"use client";

import { useState } from "react";

import type { Language } from "@/lib/i18n";

interface LoginFormProps {
  language: Language;
  supabaseConfigured: boolean;
  devBypassEnabled: boolean;
  initialError?: string;
}

interface LoginResponse {
  message: string;
}

type AuthMode = "password" | "signup";

async function submitAuth(
  payload: Record<string, string>,
): Promise<{ ok: boolean; message: string }> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as LoginResponse;

  return { ok: response.ok, message: data.message };
}

export function LoginForm({ language, supabaseConfigured, devBypassEnabled, initialError }: LoginFormProps) {
  const isBn = language === "bn";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("password");
  const [status, setStatus] = useState(initialError ? (isBn ? `অথ ত্রুটি: ${initialError}` : `Auth error: ${initialError}`) : "");

  const runAuth = async () => {
    if (!email) {
      setStatus(isBn ? "ইমেইল আবশ্যক।" : "Email is required.");
      return;
    }

    if (!password) {
      setStatus(isBn ? "পাসওয়ার্ড আবশ্যক।" : "Password is required.");
      return;
    }

    setStatus(
      mode === "signup"
        ? isBn
          ? "অ্যাকাউন্ট তৈরি করা হচ্ছে..."
          : "Creating account..."
        : isBn
          ? "সাইন ইন করা হচ্ছে..."
          : "Signing in...",
    );

    const result = await submitAuth({
      email,
      ...(password ? { password } : {}),
      mode,
    });

    setStatus(result.message);

    if (result.ok && mode === "password") {
      window.location.href = "/portal";
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
            ? "Supabase এখনও কনফিগার করা হয়নি। লাইভ অথেন্টিকেশন চালু করতে NEXT_PUBLIC_SUPABASE_URL এবং NEXT_PUBLIC_SUPABASE_ANON_KEY যোগ করুন।"
            : "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live authentication."}
        </p>
      )}

      <div className="db-panel space-y-4 p-6 md:p-8">
        <p className="db-kicker">{isBn ? "সদস্য প্রবেশ" : "Member Access"}</p>
        <h2 className="db-title">
          {mode === "signup"
            ? isBn
              ? "নতুন অ্যাকাউন্ট সাইন আপ"
              : "New account sign up"
            : isBn
              ? "সাইন ইন"
              : "Sign In"}
        </h2>
        <p className="text-sm leading-7 text-[var(--db-text-soft)]">
          {mode === "signup" ? (
            <>
              {isBn
                ? "অ্যাকাউন্ট তৈরি করতে ইমেইল ও পাসওয়ার্ড দিন। "
                : "Enter an email and password to create an account. "}
              <button
                type="button"
                onClick={() => setMode("password")}
                className="font-semibold underline"
              >
                {isBn ? "এখানে" : "HERE"}
              </button>
              {isBn
                ? " ক্লিক করে বিদ্যমান অ্যাকাউন্ট দিয়ে সাইন ইন করুন।"
                : " to sign in with an already created account."}
            </>
          ) : (
            <>
              {isBn ? "ইমেইল/পাসওয়ার্ড দিয়ে লগইন করুন। " : "Log in with your email/password. Click "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-semibold underline"
              >
                {isBn ? "এখানে" : "HERE"}
              </button>
              {isBn ? " ক্লিক করে নতুন অ্যাকাউন্ট তৈরি করুন।" : " to create a new account."}
            </>
          )}
        </p>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.org"
          className="db-input"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={isBn ? "পাসওয়ার্ড" : "Password"}
          className="db-input"
        />

        <button
          type="button"
          onClick={() => void runAuth()}
          className="db-button-primary w-full text-sm"
        >
          {mode === "signup" ? (isBn ? "অ্যাকাউন্ট তৈরি করুন" : "Create account") : isBn ? "সাইন ইন" : "Sign In"}
        </button>
      </div>

      {status && <p className="text-sm text-[var(--db-text-soft)]">{status}</p>}
    </div>
  );
}
