"use client";

import { useState } from "react";

interface LoginFormProps {
  supabaseConfigured: boolean;
  devBypassEnabled: boolean;
}

interface LoginResponse {
  message: string;
}

async function submitLogin(
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

export function LoginForm({ supabaseConfigured, devBypassEnabled }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const handleMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Sending magic link...");

    const result = await submitLogin({ email, mode: "magic-link" });
    setStatus(result.message);
  };

  const handlePasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Signing in...");

    const result = await submitLogin({ email, password, mode: "password" });
    setStatus(result.message);

    if (result.ok) {
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

      <form onSubmit={handleMagicLink} className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Magic Link</h2>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.org"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Send magic link
        </button>
      </form>

      <form
        onSubmit={handlePasswordLogin}
        className="space-y-3 rounded-lg border border-slate-200 bg-white p-5"
      >
        <h2 className="text-base font-semibold text-slate-900">Email + Password</h2>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.org"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Log in with password
        </button>
      </form>

      {status && <p className="text-sm text-slate-700">{status}</p>}
    </div>
  );
}
