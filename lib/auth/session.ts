import { cookies } from "next/headers";

import { env } from "@/lib/env";
import type { PortalUser, Role } from "@/lib/types";

export const SESSION_COOKIE_NAME = "durgabari_portal_email";

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

  const cookieStore = await cookies();
  const emailFromCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value?.toLowerCase();

  if (!emailFromCookie) {
    return null;
  }

  return {
    email: emailFromCookie,
    role: getRoleForEmail(emailFromCookie),
    authSource: "supabase",
  };
};

export const isAdmin = (user: PortalUser) => user.role === "admin";
