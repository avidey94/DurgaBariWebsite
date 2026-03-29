import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentFamilyPortalContext } from "@/lib/portal/server";

interface FamilyMemberOption {
  name: string;
  type: "adult" | "child";
}

const buildFamilyMembers = (family: {
  adultNames: string[];
  childNames: string[];
  familyDisplayName: string;
}): FamilyMemberOption[] => {
  const adults = family.adultNames
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, type: "adult" as const }));
  const children = family.childNames
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, type: "child" as const }));

  if (adults.length + children.length > 0) return [...adults, ...children];
  return [{ name: family.familyDisplayName, type: "adult" }];
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const familyContext = await getCurrentFamilyPortalContext();
  if (!familyContext) return NextResponse.json({ message: "Family profile not found." }, { status: 404 });

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });

  const now = new Date().toISOString();
  const [eventsResult, slotsResult, signupsResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, slug, title, short_summary, start_time, end_time, location, visibility, publish_status, event_type")
      .eq("publish_status", "published")
      .in("visibility", ["public", "members"])
      .gte("start_time", now)
      .order("start_time", { ascending: true })
      .limit(200),
    supabase
      .from("event_volunteer_slots")
      .select("id, event_id, title, description, start_time, end_time, capacity, notes, sort_order, slot_state")
      .gte("start_time", now)
      .order("start_time", { ascending: true }),
    supabase
      .from("event_volunteer_signups")
      .select("id, slot_id, event_id, family_id, email, participant_name, participant_type, signup_status, signed_up_at, cancelled_at")
      .in("signup_status", ["confirmed", "cancelled"]),
  ]);

  if (eventsResult.error) return NextResponse.json({ message: eventsResult.error.message }, { status: 500 });
  if (slotsResult.error) return NextResponse.json({ message: slotsResult.error.message }, { status: 500 });
  if (signupsResult.error) return NextResponse.json({ message: signupsResult.error.message }, { status: 500 });

  const signups = signupsResult.data ?? [];
  const confirmedCountBySlot = new Map<string, number>();
  signups.forEach((signup) => {
    if (signup.signup_status !== "confirmed") return;
    confirmedCountBySlot.set(signup.slot_id as string, (confirmedCountBySlot.get(signup.slot_id as string) ?? 0) + 1);
  });

  const mySignupsBySlotId = new Map<string, (typeof signups)>();
  signups.forEach((signup) => {
    if (signup.family_id === familyContext.family.id && signup.signup_status === "confirmed") {
      mySignupsBySlotId.set(signup.slot_id as string, [...(mySignupsBySlotId.get(signup.slot_id as string) ?? []), signup]);
    }
  });

  const slots = (slotsResult.data ?? []).map((slot) => ({
    ...slot,
    confirmed_count: confirmedCountBySlot.get(slot.id as string) ?? 0,
    my_signups: mySignupsBySlotId.get(slot.id as string) ?? [],
  }));

  const slotsByEventId = new Map<string, typeof slots>();
  slots.forEach((slot) => {
    const key = slot.event_id as string;
    slotsByEventId.set(key, [...(slotsByEventId.get(key) ?? []), slot]);
  });

  const eventsData = eventsResult.data ?? [];
  const events = eventsData
    .map((event) => ({
      ...event,
      volunteer_slots: slotsByEventId.get(event.id as string) ?? [],
    }))
    .filter((event) => event.volunteer_slots.length > 0);

  const myCommitments = slots
    .flatMap((slot) =>
      (slot.my_signups ?? []).map((signup) => ({
        signup_id: signup.id,
        slot_id: slot.id,
        event_id: slot.event_id,
        event_title: eventsData.find((event) => event.id === slot.event_id)?.title ?? "Event",
        slot_title: slot.title,
        participant_name: signup.participant_name,
        participant_type: signup.participant_type,
        start_time: slot.start_time,
        end_time: slot.end_time,
        location: eventsData.find((event) => event.id === slot.event_id)?.location ?? null,
      })),
    )
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return NextResponse.json(
    {
      events,
      myCommitments,
      familyMembers: buildFamilyMembers(familyContext.family),
    },
    { status: 200 },
  );
}
