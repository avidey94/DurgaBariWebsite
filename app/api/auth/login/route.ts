import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getSupabaseClient } from "@/lib/auth/supabase";
import { env } from "@/lib/env";

interface LoginPayload {
  email?: string;
  password?: string;
  mode?: "magic-link" | "password";
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginPayload;
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ message: "Email is required." }, { status: 400 });
  }

  if (env.devLoginEmail) {
    return NextResponse.json(
      {
        message:
          "DEV_LOGIN_EMAIL is active. Auth is bypassed automatically, so you can go straight to /portal.",
      },
      { status: 200 },
    );
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      {
        message:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 400 },
    );
  }

  if (body.mode === "magic-link") {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/login`,
      },
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Magic link sent. Check your inbox." }, { status: 200 });
  }

  if (body.mode === "password") {
    if (!body.password) {
      return NextResponse.json({ message: "Password is required." }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: body.password,
    });

    if (error || !data.user?.email) {
      return NextResponse.json(
        { message: error?.message ?? "Login failed." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ message: "Login successful." }, { status: 200 });

    response.cookies.set(SESSION_COOKIE_NAME, data.user.email.toLowerCase(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  }

  return NextResponse.json({ message: "Unsupported login mode." }, { status: 400 });
}
