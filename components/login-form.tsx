"use client";

import { useState } from "react";

interface LoginFormProps {
  supabaseConfigured: boolean;
  devBypassEnabled: boolean;
  initialError?: string;
}

interface LoginResponse {
  message: string;
}

type AuthMode = "magic-link" | "password" | "signup";

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

export function LoginForm({ supabaseConfigured, devBypassEnabled, initialError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(initialError ? `Auth error: ${initialError}` : "");

  const runAuth = async (mode: AuthMode) => {
    if (!email) {
      setStatus("Email is required.");
      return;
    }

    if ((mode === "password" || mode === "signup") && !password) {
      setStatus("Password is required.");
      return;
    }

    setStatus(
      mode === "magic-link"
        ? "Sending magic link..."
        : mode === "signup"
          ? "Creating account..."
          : "Signing in...",
    );

    const result = await submitAuth({
      email,
      ...(password ? { password } : {}),
      mode,
    });

    setStatus(result.message);

    if (result.ok && (mode === "password" || mode === "signup")) {
      window.location.href = "/portal";
    }
  };

  return (
    <div className="space-y-6">
      {devBypassEnabled && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          DEV_LOGIN_EMAIL is enabled. Authentication is bypassed in development.
          <div className="mt-2">
            <a className="font-semibold underline" href="/portal">
              Continue to portal
            </a>
          </div>
        </div>
      )}

      {!supabaseConfigured && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live authentication.
        </p>
      )}

      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Email Authentication</h2>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.org"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password (required for sign up / password login)"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />

        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => runAuth("magic-link")}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Send magic link
          </button>
          <button
            type="button"
            onClick={() => runAuth("password")}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => runAuth("signup")}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Create account
          </button>
        </div>
      </div>

      {status && <p className="text-sm text-slate-700">{status}</p>}
    </div>
  );
}
