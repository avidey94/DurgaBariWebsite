import { NextRequest, NextResponse } from "next/server";

import { createRouteHandlerSupabaseClient } from "@/lib/auth/supabase";

export async function POST(request: NextRequest) {
  const authClient = createRouteHandlerSupabaseClient(request);

  if (authClient) {
    const { getResponse, setResponse, supabase } = authClient;
    await supabase.auth.signOut();
    const response = NextResponse.redirect(new URL("/", request.url));
    setResponse(response);

    return getResponse();
  }

  return NextResponse.redirect(new URL("/", request.url));
}
