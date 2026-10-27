import { NextRequest } from "next/server";

import { createRouteHandlerSupabaseClient } from "@/lib/auth/supabase";
import { jsonNoStore } from "@/lib/http";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { password?: string };
  const password = body.password ?? "";

  if (password.length < 8) {
    return jsonNoStore(
      { message: "Use at least 8 characters for your new password." },
      { status: 400 },
    );
  }

  const authClient = createRouteHandlerSupabaseClient(request);
  if (!authClient) {
    return jsonNoStore({ message: "Password reset is unavailable right now." }, { status: 503 });
  }

  const { supabase, getResponse, setResponse } = authClient;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return jsonNoStore(
      { message: "This reset link has expired. Please request a new one." },
      { status: 401 },
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return jsonNoStore(
      { message: error.message || "Unable to update your password." },
      { status: 400 },
    );
  }

  const response = jsonNoStore({ message: "Password updated." }, { status: 200 });
  setResponse(response);
  return getResponse();
}
