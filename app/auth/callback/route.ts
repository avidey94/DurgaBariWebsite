import { NextRequest, NextResponse } from "next/server";

import { createRouteHandlerSupabaseClient } from "@/lib/auth/supabase";

const safeNextPath = (nextParam: string | null) => {
  if (!nextParam || !nextParam.startsWith("/")) {
    return "/portal";
  }

  return nextParam;
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const authClient = createRouteHandlerSupabaseClient(request);

  if (!authClient) {
    return NextResponse.redirect(new URL("/login?error=supabase_not_configured", request.url));
  }

  const { supabase, getResponse, setResponse } = authClient;
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  const redirectResponse = NextResponse.redirect(new URL(nextPath, request.url));
  setResponse(redirectResponse);

  return getResponse();
}
