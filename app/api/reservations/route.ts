import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";
import { findSpaceConflict } from "@/lib/events/availability";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  isValidEventDate,
  MAX_RESERVATION_MINUTES,
  pacificNow,
  reservationMinutes,
  reservationPrice,
} from "@/lib/reservations";

export async function GET() {
  const user = await getCurrentUser({ ignorePreview: true });
  if (!user?.id) return NextResponse.json({ message: "Please log in to see reservations." }, { status: 401 });
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Reservations are unavailable." }, { status: 503 });

  const { data, error } = await supabase
    .from("event_reservations")
    .select("id, booking_reference, event_title, event_date, start_time, end_time, include_priest, include_havan, price_usd, status, created_at")
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ message: "Could not load reservations." }, { status: 500 });
  return NextResponse.json({ reservations: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getCurrentUser({ ignorePreview: true });
  if (!user?.id || !user.email || user.authSource !== "supabase") {
    return NextResponse.json({ message: "Please log in with a member account to reserve an event." }, { status: 401 });
  }
  const rate = checkRateLimit(`reservation:${user.id}`, 5, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const title = typeof body.eventTitle === "string" ? body.eventTitle.trim() : "";
  const date = typeof body.eventDate === "string" ? body.eventDate : "";
  const start = typeof body.startTime === "string" ? body.startTime : "";
  const end = typeof body.endTime === "string" ? body.endTime : "";
  const phone = typeof body.contactPhone === "string" ? body.contactPhone.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const priest = body.includePriest === true;
  const havan = body.includeHavan === true;
  const minutes = reservationMinutes(start, end);
  const now = pacificNow();

  if (!title || title.length > 120) {
    return NextResponse.json({ message: "Enter an event name of up to 120 characters." }, { status: 400 });
  }
  if (phone.length > 40 || notes.length > 1500) {
    return NextResponse.json({ message: "Phone or event notes are too long." }, { status: 400 });
  }
  if (!isValidEventDate(date) || date < now.date || (date === now.date && start <= now.time)) {
    return NextResponse.json({ message: "Choose a future date and start time in Pacific time." }, { status: 400 });
  }
  if (minutes === null || minutes <= 0 || minutes > MAX_RESERVATION_MINUTES) {
    return NextResponse.json({ message: "Choose an end time after the start time, within 6 hours." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Reservations are unavailable." }, { status: 503 });

  try {
    const conflict = await findSpaceConflict(date, start, end);
    if (conflict) {
      return NextResponse.json({ message: "This time is blocked on the Durga Bari calendar. Please choose another time." }, { status: 409 });
    }
  } catch {
    return NextResponse.json({ message: "Could not check availability." }, { status: 503 });
  }

  const id = randomUUID();
  const bookingReference = `DB-${id.slice(0, 12).toUpperCase()}`;
  const priceUsd = reservationPrice(priest, havan);
  const { error } = await supabase.from("event_reservations").insert({
    id,
    booking_reference: bookingReference,
    auth_user_id: user.id,
    email: user.email.toLowerCase(),
    event_title: title,
    event_date: date,
    start_time: start,
    end_time: end,
    contact_phone: phone || null,
    notes: notes || null,
    include_priest: priest,
    include_havan: havan,
    price_usd: priceUsd,
  });

  if (error) return NextResponse.json({ message: "Could not save the request. Please try again." }, { status: 500 });
  return NextResponse.json({ bookingReference, priceUsd }, { status: 201 });
}
