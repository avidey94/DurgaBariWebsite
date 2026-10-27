import { NextRequest, NextResponse } from "next/server";

import { createRouteHandlerSupabaseClient } from "@/lib/auth/supabase";

export async function POST(request: NextRequest) {
  const authClient = createRouteHandlerSupabaseClient(request);

  if (authClient) {
    const { getResponse, setResponse, supabase } = authClient;
    await supabase.auth.signOut();
    const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
    response.headers.set("Cache-Control", "private, no-store");
    setResponse(response);

    return getResponse();
  }

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
