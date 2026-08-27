import { NextRequest, NextResponse } from "next/server";

import { createRouteHandlerSupabaseClient } from "@/lib/auth/supabase";
import { buildAuthCallbackUrl } from "@/lib/auth/site-url";
import { isDevLoginEnabled } from "@/lib/env";
import { jsonNoStore } from "@/lib/http";
import { checkRateLimit } from "@/lib/security/rate-limit";

interface LoginPayload {
  email?: string;
  password?: string;
  mode?: "magic-link" | "password" | "signup";
}

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT = 8;

const getClientIp = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip")?.trim() ||
  "unknown";

const genericAuthError = (message = "Unable to process authentication request.") =>
  jsonNoStore({ message }, { status: 400 });

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginPayload;
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return genericAuthError("Email is required.");
  }

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`${ip}:${email}:${body.mode ?? "unknown"}`, AUTH_LIMIT, AUTH_WINDOW_MS);
  if (!rateLimit.allowed) {
    console.warn(`[auth] rate limited login attempt for ${email} from ${ip}`);
    const response = jsonNoStore({ message: "Too many authentication attempts. Please try again later." }, { status: 429 });
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  if (isDevLoginEnabled) {
    return jsonNoStore(
      {
        message:
          "DEV_LOGIN_EMAIL is active. Auth is bypassed automatically, so you can go straight to /portal.",
      },
      { status: 200 },
    );
  }

  const authClient = createRouteHandlerSupabaseClient(request);

  if (!authClient) {
    return jsonNoStore(
      {
        message:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 400 },
    );
  }

  const { supabase, getResponse, setResponse } = authClient;

  if (body.mode === "magic-link") {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildAuthCallbackUrl("/portal"),
      },
    });

    if (error) {
      console.warn(`[auth] magic-link failure for ${email} from ${ip}`);
      return genericAuthError("If that email can receive sign-in links, a message will arrive shortly.");
    }

    const response = jsonNoStore(
      { message: "Magic link sent. Check your inbox and click the link to continue." },
      { status: 200 },
    );
    setResponse(response);

    return getResponse();
  }

  if (body.mode === "signup") {
    if (!body.password || body.password.length < 8) {
      return jsonNoStore(
        { message: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: body.password,
      options: {
        emailRedirectTo: buildAuthCallbackUrl("/portal"),
      },
    });

    if (error) {
      console.warn(`[auth] signup failure for ${email} from ${ip}`);
      return genericAuthError("Unable to create account right now.");
    }

    if (data.session) {
      const response = jsonNoStore({ message: "Account created. You are now logged in." }, { status: 200 });
      setResponse(response);

      return getResponse();
    }

    const response = jsonNoStore(
      { message: "Account created. Check your email to confirm and finish sign in." },
      { status: 200 },
    );
    setResponse(response);

    return getResponse();
  }

  if (body.mode === "password") {
    if (!body.password) {
      return NextResponse.json({ message: "Password is required." }, { status: 400 });
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: body.password,
    });

    if (error) {
      console.warn(`[auth] password login failure for ${email} from ${ip}`);
      return jsonNoStore({ message: "Invalid email or password." }, { status: 401 });
    }

    const response = jsonNoStore({ message: "Login successful." }, { status: 200 });
    setResponse(response);

    return getResponse();
  }

  return genericAuthError("Unsupported login mode.");
}
