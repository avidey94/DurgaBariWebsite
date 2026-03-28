import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createRouteHandlerSupabaseClient } from "@/lib/auth/supabase";
import { normalizeNextPath } from "@/lib/auth/site-url";
import { ensureFamilyForAuthUser } from "@/lib/portal/family-onboarding";

const toOtpType = (value: string | null): EmailOtpType | null => {
  if (
    value === "signup" ||
    value === "invite" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "email_change" ||
    value === "email"
  ) {
    return value;
  }
  return null;
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const otpType = toOtpType(request.nextUrl.searchParams.get("type"));
  const nextPath = normalizeNextPath(request.nextUrl.searchParams.get("next"));

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/login?error=missing_auth_token", request.url));
  }

  const authClient = createRouteHandlerSupabaseClient(request);

  if (!authClient) {
    return NextResponse.redirect(new URL("/login?error=supabase_not_configured", request.url));
  }

  const { supabase, getResponse, setResponse } = authClient;
  let error: Error | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash && otpType) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    error = result.error;
  } else {
    return NextResponse.redirect(new URL("/login?error=invalid_auth_payload", request.url));
  }

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  const { data: userData } = await supabase.auth.getUser();
  const authUserId = userData.user?.id;
  const authEmail = userData.user?.email;

  if (authUserId && authEmail) {
    const ensured = await ensureFamilyForAuthUser({
      authUserId,
      email: authEmail,
    });

    if (ensured.error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(ensured.error.message)}`, request.url));
    }
  }

  const redirectResponse = NextResponse.redirect(new URL(nextPath, request.url));
  setResponse(redirectResponse);

  return getResponse();
}
