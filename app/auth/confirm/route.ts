import { NextRequest, NextResponse } from "next/server";

// Compatibility route for templates or links that still point at /auth/confirm.
// We canonicalize all auth completion through /auth/callback.
export async function GET(request: NextRequest) {
  const callbackUrl = new URL("/auth/callback", request.url);

  request.nextUrl.searchParams.forEach((value, key) => {
    callbackUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(callbackUrl);
}
