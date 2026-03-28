import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeUsPhoneNumber } from "@/lib/phone";
import { ensureFamilyForAuthUser } from "@/lib/portal/family-onboarding";

interface OnboardingBody {
  familyDisplayName?: string;
  phoneNumber?: string;
  adultsCount?: number;
  childrenCount?: number;
  adultNames?: string[];
  childNames?: string[];
}

export async function POST(request: Request) {
  const user = await getCurrentUser({ ignorePreview: true });

  if (!user?.id || !user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const ensureResult = await ensureFamilyForAuthUser({
    authUserId: user.id,
    email: user.email,
  });

  if (ensureResult.error || !ensureResult.familyId) {
    return NextResponse.json({ message: ensureResult.error?.message ?? "Unable to initialize family profile." }, { status: 500 });
  }

  const body = (await request.json()) as OnboardingBody;
  const familyDisplayName = (body.familyDisplayName ?? "").trim();
  const phoneNumberInput = (body.phoneNumber ?? "").trim();
  const adultsCount = Math.floor(Number(body.adultsCount ?? 0));
  const childrenCount = Math.floor(Number(body.childrenCount ?? 0));
  const adultNames = (body.adultNames ?? []).map((name) => name.trim()).filter(Boolean);
  const childNames = (body.childNames ?? []).map((name) => name.trim()).filter(Boolean);

  if (!familyDisplayName) {
    return NextResponse.json({ message: "Name is required." }, { status: 400 });
  }

  if (!phoneNumberInput) {
    return NextResponse.json({ message: "Phone number is required." }, { status: 400 });
  }

  const phoneNumber = normalizeUsPhoneNumber(phoneNumberInput);

  if (!phoneNumber) {
    return NextResponse.json(
      { message: "Phone number must be a valid US number (10 digits, optional country code)." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(adultsCount) || adultsCount < 1) {
    return NextResponse.json({ message: "Adults must be at least 1." }, { status: 400 });
  }

  if (!Number.isFinite(childrenCount) || childrenCount < 0) {
    return NextResponse.json({ message: "Children must be 0 or more." }, { status: 400 });
  }

  if (adultNames.length !== adultsCount) {
    return NextResponse.json({ message: "Please provide a name for each adult." }, { status: 400 });
  }

  if (childNames.length !== childrenCount) {
    return NextResponse.json({ message: "Please provide a name for each child." }, { status: 400 });
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("id, profile_completed")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (familyError || !family) {
    return NextResponse.json({ message: familyError?.message ?? "Family profile not found." }, { status: 500 });
  }

  if (family.profile_completed) {
    return NextResponse.json(
      { message: "Profile onboarding is already complete. Please contact an admin for updates." },
      { status: 409 },
    );
  }

  const { error: updateError } = await supabase
    .from("families")
    .update({
      family_display_name: familyDisplayName,
      primary_email: user.email.toLowerCase(),
      phone_number: phoneNumber,
      adults_count: adultsCount,
      adult_names: adultNames,
      children_count: childrenCount,
      child_names: childNames,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", family.id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
