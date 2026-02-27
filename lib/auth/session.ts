import { env } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/auth/supabase";
import { dataProvider } from "@/lib/data";
import type { PortalUser, Role } from "@/lib/types";

const resolveSheetAdminStatus = async (email: string): Promise<boolean | null> => {
  if (env.dataProvider !== "google-sheets") {
    return null;
  }

  try {
    const family = await dataProvider.getFamilyByEmail(email);
    return family?.isAdmin ?? false;
  } catch {
    return null;
  }
};

const getRoleForEmail = (email: string, isAdmin: boolean): Role => {
  if (isAdmin || env.adminEmails.includes(email.toLowerCase())) {
    return "admin";
  }

  return "member";
};

export const getCurrentUser = async (): Promise<PortalUser | null> => {
  if (env.devLoginEmail) {
    const sheetIsAdmin = await resolveSheetAdminStatus(env.devLoginEmail);
    const isAdmin = sheetIsAdmin ?? env.adminEmails.includes(env.devLoginEmail);

    return {
      email: env.devLoginEmail,
      role: getRoleForEmail(env.devLoginEmail, isAdmin),
      isAdmin,
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
  const sheetIsAdmin = await resolveSheetAdminStatus(email);
  const isAdmin = sheetIsAdmin ?? env.adminEmails.includes(email);

  return {
    id: data.user.id,
    email,
    role: getRoleForEmail(email, isAdmin),
    isAdmin,
    authSource: "supabase",
  };
};

export const isAdmin = (user: PortalUser) => user.isAdmin;
