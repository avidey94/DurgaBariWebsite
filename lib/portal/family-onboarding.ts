import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";

const toDisplayName = (email: string) => {
  const localPart = email.split("@")[0] ?? "";
  const normalized = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return email;
  }

  return normalized
    .split(" ")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
};

interface EnsureFamilyForAuthUserInput {
  authUserId: string;
  email: string;
}

export const ensureFamilyForAuthUser = async (input: EnsureFamilyForAuthUserInput) => {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return { familyId: null, error: new Error("Supabase service role is not configured.") };
  }

  const email = input.email.trim().toLowerCase();
  const { data: existingByAuthId, error: existingByAuthIdError } = await supabase
    .from("families")
    .select("id, auth_user_id")
    .eq("auth_user_id", input.authUserId)
    .maybeSingle();

  if (existingByAuthIdError) {
    return { familyId: null, error: new Error(existingByAuthIdError.message) };
  }

  let familyId = (existingByAuthId?.id as string | undefined) ?? null;

  if (!familyId) {
    const { data: existingByEmail, error: existingByEmailError } = await supabase
      .from("families")
      .select("id, auth_user_id")
      .eq("primary_email", email)
      .maybeSingle();

    if (existingByEmailError) {
      return { familyId: null, error: new Error(existingByEmailError.message) };
    }

    if (existingByEmail?.id) {
      familyId = existingByEmail.id as string;

      if (existingByEmail.auth_user_id !== input.authUserId) {
        const { error: relinkError } = await supabase
          .from("families")
          .update({
            auth_user_id: input.authUserId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", familyId);

        if (relinkError) {
          return { familyId: null, error: new Error(relinkError.message) };
        }
      }
    }
  }

  if (!familyId) {
    const insertResult = await supabase
      .from("families")
      .insert({
        auth_user_id: input.authUserId,
        family_display_name: toDisplayName(email),
        primary_email: email,
        phone_number: null,
        adults_count: 1,
        adult_names: [],
        children_count: 0,
        child_names: [],
        founding_family_status: "not_founding",
        pledge_status: "none",
        source: "supabase",
        profile_completed: false,
      })
      .select("id")
      .single();

    if (insertResult.error) {
      if (insertResult.error.code !== "23505") {
        return { familyId: null, error: new Error(insertResult.error.message) };
      }

      const retryFamily = await supabase
        .from("families")
        .select("id, auth_user_id")
        .eq("primary_email", email)
        .maybeSingle();

      if (retryFamily.error || !retryFamily.data?.id) {
        return { familyId: null, error: new Error(retryFamily.error?.message ?? "Unable to resolve family record.") };
      }

      familyId = retryFamily.data.id as string;

      if (retryFamily.data.auth_user_id !== input.authUserId) {
        const { error: relinkError } = await supabase
          .from("families")
          .update({
            auth_user_id: input.authUserId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", familyId);

        if (relinkError) {
          return { familyId: null, error: new Error(relinkError.message) };
        }
      }
    } else {
      familyId = insertResult.data.id as string;
    }
  }

  if (!familyId) {
    return { familyId: null, error: new Error("Family record could not be created.") };
  }

  const { error: roleError } = await supabase.from("family_roles").insert({
    family_id: familyId,
    role: "member",
    granted_by_family_id: null,
  });

  if (roleError && roleError.code !== "23505") {
    return { familyId, error: new Error(roleError.message) };
  }

  return { familyId, error: null };
};
