import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { dataProvider } from "@/lib/data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });
  }

  const { id: eventId } = await context.params;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ message: eventError.message }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ message: "Event not found." }, { status: 404 });
  }

  const { data: rows, error: rowsError } = await supabase
    .from("event_rsvps")
    .select("user_id, email, headcount")
    .eq("event_id", eventId)
    .eq("status", "going")
    .gt("headcount", 0)
    .order("headcount", { ascending: false })
    .order("email", { ascending: true });

  if (rowsError) {
    return NextResponse.json({ message: rowsError.message }, { status: 500 });
  }

  const families = await dataProvider.getAllFamilies();
  const familyByEmail = new Map(
    families.map((family) => [family.primaryEmail.toLowerCase(), family.familyName]),
  );

  const breakdown = (rows ?? []).map((row) => {
    const normalizedEmail = (row.email ?? "").toLowerCase();
    const familyName = familyByEmail.get(normalizedEmail) ?? row.email;

    return {
      user_id: row.user_id,
      email: row.email,
      family_name: familyName,
      headcount: Math.max(0, row.headcount ?? 0),
    };
  });

  return NextResponse.json(
    {
      event: {
        id: event.id,
        title: event.title,
      },
      breakdown,
    },
    { status: 200 },
  );
}
