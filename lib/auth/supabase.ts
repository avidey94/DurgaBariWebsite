import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { env, isSupabaseConfigured } from "@/lib/env";

export const createBrowserSupabaseClient = () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
};

export const createServerSupabaseClient = async () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
};

export const createRouteHandlerSupabaseClient = (request: NextRequest) => {
  if (!isSupabaseConfigured) {
    return null;
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return {
    supabase,
    getResponse: () => response,
    setResponse: (nextResponse: NextResponse) => {
      response.cookies.getAll().forEach((cookie) => {
        nextResponse.cookies.set(cookie);
      });
      response = nextResponse;
    },
  };
};

export const updateSupabaseSession = async (request: NextRequest) => {
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
};

export const createServiceRoleSupabaseClient = () => {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
