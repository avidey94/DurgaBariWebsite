import { NextRequest, NextResponse } from "next/server";

import { createRouteHandlerSupabaseClient } from "@/lib/auth/supabase";
import { buildAuthCallbackUrl } from "@/lib/auth/site-url";
import { isDevLoginEnabled } from "@/lib/env";

interface LoginPayload {
  email?: string;
  password?: string;
  mode?: "magic-link" | "password" | "signup";
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginPayload;
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ message: "Email is required." }, { status: 400 });
  }

  if (isDevLoginEnabled) {
    return NextResponse.json(
      {
        message:
          "DEV_LOGIN_EMAIL is active. Auth is bypassed automatically, so you can go straight to /portal.",
      },
      { status: 200 },
    );
  }

  const authClient = createRouteHandlerSupabaseClient(request);

  if (!authClient) {
    return NextResponse.json(
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
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const response = NextResponse.json(
      { message: "Magic link sent. Check your inbox and click the link to continue." },
      { status: 200 },
    );
    setResponse(response);

    return getResponse();
  }

  if (body.mode === "signup") {
    if (!body.password || body.password.length < 8) {
      return NextResponse.json(
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
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (data.session) {
      const response = NextResponse.json({ message: "Account created. You are now logged in." }, { status: 200 });
      setResponse(response);

      return getResponse();
    }

    const response = NextResponse.json(
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
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    const response = NextResponse.json({ message: "Login successful." }, { status: 200 });
    setResponse(response);

    return getResponse();
  }

  return NextResponse.json({ message: "Unsupported login mode." }, { status: 400 });
}
