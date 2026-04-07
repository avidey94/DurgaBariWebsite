import { env, isDevLoginEnabled } from "@/lib/env";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { dataProvider } from "@/lib/data";
import type { PortalUser, PreviewState, Role } from "@/lib/types";
import { cookies } from "next/headers";

interface AuthReadOptions {
  ignorePreview?: boolean;
}

interface PreviewCookiePayload {
  mode: "family" | "logged_out";
  targetFamilyId?: string;
}

const PREVIEW_COOKIE_NAME = "db_preview_user";
export { PREVIEW_COOKIE_NAME };

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

const parsePreviewCookie = async (): Promise<PreviewCookiePayload | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PREVIEW_COOKIE_NAME)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PreviewCookiePayload;

    if (parsed.mode !== "family" && parsed.mode !== "logged_out") {
      return null;
    }

    if (parsed.mode === "family" && !parsed.targetFamilyId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const resolveBaseUser = async (): Promise<PortalUser | null> => {
  if (isDevLoginEnabled) {
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

const resolvePreviewedUser = async (
  baseUser: PortalUser,
  preview: PreviewCookiePayload,
): Promise<PortalUser | null> => {
  if (!baseUser.isAdmin) {
    return baseUser;
  }

  if (preview.mode === "logged_out") {
    return null;
  }

  const supabase = createServiceRoleSupabaseClient() ?? (await createServerSupabaseClient());
  if (!supabase) {
    return baseUser;
  }

  const { data: family } = await supabase
    .from("families")
    .select("id, auth_user_id, primary_email")
    .eq("id", preview.targetFamilyId ?? "")
    .maybeSingle();

  if (!family?.primary_email) {
    return baseUser;
  }

  const { data: familyRoles } = await supabase
    .from("family_roles")
    .select("role")
    .eq("family_id", family.id);

  const isPreviewAdmin = (familyRoles ?? []).some((row) => row.role === "super_admin");

  return {
    id: family.auth_user_id ?? undefined,
    email: family.primary_email.toLowerCase(),
    role: getRoleForEmail(family.primary_email.toLowerCase(), isPreviewAdmin),
    isAdmin: isPreviewAdmin,
    authSource: baseUser.authSource,
    preview: {
      active: true,
      mode: "family",
      actorEmail: baseUser.email,
      targetFamilyId: family.id,
      targetEmail: family.primary_email.toLowerCase(),
    },
  };
};

export const getCurrentUser = async (options?: AuthReadOptions): Promise<PortalUser | null> => {
  const baseUser = await resolveBaseUser();

  if (!baseUser) {
    return null;
  }

  if (options?.ignorePreview) {
    return baseUser;
  }

  const preview = await parsePreviewCookie();

  if (!preview) {
    return baseUser;
  }

  const previewed = await resolvePreviewedUser(baseUser, preview);

  if (preview.mode === "logged_out") {
    return null;
  }

  return previewed;
};

export const getActivePreviewState = async (): Promise<PreviewState | null> => {
  const baseUser = await resolveBaseUser();
  const preview = await parsePreviewCookie();

  if (!baseUser || !preview || !baseUser.isAdmin) {
    return null;
  }

  if (preview.mode === "logged_out") {
    return {
      active: true,
      mode: "logged_out",
      actorEmail: baseUser.email,
      targetFamilyId: null,
      targetEmail: null,
    };
  }

  const supabase = createServiceRoleSupabaseClient() ?? (await createServerSupabaseClient());
  if (!supabase) {
    return null;
  }

  const { data: family } = await supabase
    .from("families")
    .select("id, primary_email")
    .eq("id", preview.targetFamilyId ?? "")
    .maybeSingle();

  if (!family) {
    return null;
  }

  return {
    active: true,
    mode: "family",
    actorEmail: baseUser.email,
    targetFamilyId: family.id,
    targetEmail: family.primary_email?.toLowerCase() ?? null,
  };
};

export const isAdmin = (user: PortalUser) => user.isAdmin;
