import { createClient } from "@supabase/supabase-js";

import { env, isSupabaseConfigured } from "@/lib/env";

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey);
};
