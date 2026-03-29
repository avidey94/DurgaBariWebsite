import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentFamilyPortalContext } from "@/lib/portal/server";

interface SignupBody {
  slotId?: string;
  participantNames?: string[];
  participantName?: string;
}

const normalizeParticipantNames = (value: string[] | undefined, fallback?: string): string[] => {
  const source = Array.isArray(value) && value.length > 0 ? value : fallback ? [fallback] : [];
  const normalized = source.map((name) => name.trim()).filter(Boolean);
  return Array.from(new Set(normalized));
};

const buildFamilyMemberSet = (family: {
  adultNames: string[];
  childNames: string[];
  familyDisplayName: string;
}) => {
  const names = [...family.adultNames, ...family.childNames].map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) {
    names.push(family.familyDisplayName.trim());
  }

  return new Set(names);
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id || !user.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const familyContext = await getCurrentFamilyPortalContext();
  if (!familyContext) return NextResponse.json({ message: "Family profile not found." }, { status: 404 });

  const body = (await request.json()) as SignupBody;
  const slotId = (body.slotId ?? "").trim();
  if (!slotId) return NextResponse.json({ message: "slotId is required." }, { status: 400 });

  const participantNames = normalizeParticipantNames(body.participantNames, body.participantName);
  if (participantNames.length === 0) {
    return NextResponse.json({ message: "Select at least one family member." }, { status: 400 });
  }

  const familyMemberSet = buildFamilyMemberSet(familyContext.family);
  const invalidMembers = participantNames.filter((name) => !familyMemberSet.has(name));
  if (invalidMembers.length > 0) {
    return NextResponse.json({ message: "One or more selected family members are invalid." }, { status: 400 });
  }

  const participantTypeByName = new Map<string, "adult" | "child">();
  familyContext.family.adultNames.forEach((name) => {
    const trimmed = name.trim();
    if (trimmed) participantTypeByName.set(trimmed, "adult");
  });
  familyContext.family.childNames.forEach((name) => {
    const trimmed = name.trim();
    if (trimmed) participantTypeByName.set(trimmed, "child");
  });

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });

  const { data: slot, error: slotError } = await supabase
    .from("event_volunteer_slots")
    .select("id, event_id, capacity, slot_state, start_time")
    .eq("id", slotId)
    .maybeSingle();

  if (slotError) return NextResponse.json({ message: slotError.message }, { status: 500 });
  if (!slot) return NextResponse.json({ message: "Slot not found." }, { status: 404 });
  if (slot.slot_state !== "open") return NextResponse.json({ message: "Slot is closed." }, { status: 409 });

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, publish_status, visibility")
    .eq("id", slot.event_id)
    .maybeSingle();
  if (eventError) return NextResponse.json({ message: eventError.message }, { status: 500 });
  if (!event || event.publish_status !== "published") return NextResponse.json({ message: "Event unavailable." }, { status: 404 });
  if (event.visibility === "private") return NextResponse.json({ message: "Event unavailable." }, { status: 403 });

  const now = new Date();
  if (new Date(slot.start_time) < now) {
    return NextResponse.json({ message: "This slot has already started." }, { status: 409 });
  }

  const { data: existingSignups, error: existingError } = await supabase
    .from("event_volunteer_signups")
    .select("id, participant_name, signup_status")
    .eq("slot_id", slotId)
    .eq("family_id", familyContext.family.id)
    .in("participant_name", participantNames);

  if (existingError) return NextResponse.json({ message: existingError.message }, { status: 500 });

  const existingByName = new Map<string, (typeof existingSignups)[number]>();
  (existingSignups ?? []).forEach((signup) => {
    existingByName.set(signup.participant_name as string, signup);
  });

  const alreadyConfirmed = participantNames.filter((name) => existingByName.get(name)?.signup_status === "confirmed");
  if (alreadyConfirmed.length > 0) {
    return NextResponse.json(
      { message: `${alreadyConfirmed.join(", ")} already signed up for this slot.` },
      { status: 409 },
    );
  }

  const { count } = await supabase
    .from("event_volunteer_signups")
    .select("id", { count: "exact", head: true })
    .eq("slot_id", slotId)
    .eq("signup_status", "confirmed");

  const availableSeats = slot.capacity - (count ?? 0);
  if (participantNames.length > availableSeats) {
    return NextResponse.json(
      { message: `Only ${Math.max(0, availableSeats)} spots left for this slot.` },
      { status: 409 },
    );
  }

  const toReactivate = participantNames
    .filter((name) => existingByName.get(name)?.signup_status === "cancelled")
    .map((name) => ({ id: existingByName.get(name)?.id as string, participant_name: name }));

  const toInsert = participantNames.filter((name) => !existingByName.has(name));

  if (toReactivate.length > 0) {
    const { error: reactivateError } = await supabase
      .from("event_volunteer_signups")
      .update({
        signup_status: "confirmed",
        cancelled_at: null,
        signed_up_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in(
        "id",
        toReactivate.map((entry) => entry.id),
      );

    if (reactivateError) return NextResponse.json({ message: reactivateError.message }, { status: 500 });
  }

  if (toInsert.length > 0) {
    const insertRows = toInsert.map((name) => ({
      slot_id: slotId,
      event_id: slot.event_id,
      family_id: familyContext.family.id,
      user_id: user.id,
      email: user.email.toLowerCase(),
      participant_name: name,
      participant_type: participantTypeByName.get(name) ?? "adult",
      signup_status: "confirmed",
      signed_up_at: new Date().toISOString(),
      cancelled_at: null,
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from("event_volunteer_signups").insert(insertRows);
    if (insertError) return NextResponse.json({ message: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const familyContext = await getCurrentFamilyPortalContext();
  if (!familyContext) return NextResponse.json({ message: "Family profile not found." }, { status: 404 });

  const body = (await request.json()) as SignupBody;
  const slotId = (body.slotId ?? "").trim();
  if (!slotId) return NextResponse.json({ message: "slotId is required." }, { status: 400 });

  const participantNames = normalizeParticipantNames(body.participantNames, body.participantName);
  if (participantNames.length === 0) {
    return NextResponse.json({ message: "participantName is required." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });

  const { data: slot } = await supabase
    .from("event_volunteer_slots")
    .select("start_time")
    .eq("id", slotId)
    .maybeSingle();

  if (!slot) return NextResponse.json({ message: "Slot not found." }, { status: 404 });
  if (new Date(slot.start_time) < new Date()) {
    return NextResponse.json({ message: "Cannot cancel after slot start." }, { status: 409 });
  }

  const { error } = await supabase
    .from("event_volunteer_signups")
    .update({
      signup_status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("slot_id", slotId)
    .eq("family_id", familyContext.family.id)
    .in("participant_name", participantNames)
    .eq("signup_status", "confirmed");

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 200 });
}
