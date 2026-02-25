import { env } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/auth/supabase";
import type { PortalUser, Role } from "@/lib/types";

const getRoleForEmail = (email: string): Role => {
  if (env.adminEmails.includes(email.toLowerCase())) {
    return "admin";
  }

  return "member";
};

export const getCurrentUser = async (): Promise<PortalUser | null> => {
  if (env.devLoginEmail) {
    return {
      email: env.devLoginEmail,
      role: getRoleForEmail(env.devLoginEmail),
      authSource: "dev-bypass",
    };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) {
    return null;
  }

  const email = data.user.email.toLowerCase();

  return {
    email,
    role: getRoleForEmail(email),
    authSource: "supabase",
  };
};

export const isAdmin = (user: PortalUser) => user.role === "admin";
