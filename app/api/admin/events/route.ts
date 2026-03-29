import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";
import { ensureEventSlug } from "@/lib/events/server";

interface CreateEventBody {
  title?: string;
  slug?: string;
  shortSummary?: string | null;
  fullDescription?: string | null;
  eventType?: string;
  category?: string;
  startTime?: string;
  endTime?: string | null;
  allDay?: boolean;
  recurrence?: Record<string, unknown> | null;
  recurrenceUntil?: string | null;
  location?: string | null;
  coverImageUrl?: string | null;
  publishStatus?: "draft" | "published" | "archived";
  visibility?: "public" | "members" | "private";
  ctaText?: string | null;
  volunteerNotes?: string | null;
  maxVolunteerCount?: number | null;
}

const VALID_EVENT_TYPES = new Set(["darshan", "ritual", "festival", "community", "volunteer", "special"]);
const VALID_VISIBILITY = new Set(["public", "members", "private"]);
const VALID_STATUS = new Set(["draft", "published", "archived"]);

export async function GET() {
  const access = await getAdminAccessContext();
  if (!access) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPortalPermission(access.roles, "events.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });

  const [eventsResult, slotsResult, signupsResult] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, slug, title, short_summary, full_description, event_type, category, start_time, end_time, all_day, recurrence, recurrence_until, location, cover_image_url, publish_status, visibility, cta_text, volunteer_notes, max_volunteer_count, timezone, created_at, updated_at",
      )
      .order("start_time", { ascending: true }),
    supabase.from("event_volunteer_slots").select("id, event_id"),
    supabase.from("event_volunteer_signups").select("id, event_id, signup_status"),
  ]);

  if (eventsResult.error) {
    return NextResponse.json({ message: eventsResult.error.message }, { status: 500 });
  }

  const slotCountByEvent = new Map<string, number>();
  (slotsResult.data ?? []).forEach((row) => {
    slotCountByEvent.set(row.event_id as string, (slotCountByEvent.get(row.event_id as string) ?? 0) + 1);
  });

  const signupCountByEvent = new Map<string, number>();
  (signupsResult.data ?? []).forEach((row) => {
    if (row.signup_status !== "confirmed") return;
    signupCountByEvent.set(row.event_id as string, (signupCountByEvent.get(row.event_id as string) ?? 0) + 1);
  });

  const events = (eventsResult.data ?? []).map((event) => ({
    ...event,
    volunteer_slot_count: slotCountByEvent.get(event.id as string) ?? 0,
    volunteer_signup_count: signupCountByEvent.get(event.id as string) ?? 0,
  }));

  return NextResponse.json({ events }, { status: 200 });
}

export async function POST(request: Request) {
  const access = await getAdminAccessContext();
  if (!access) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPortalPermission(access.roles, "events.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as CreateEventBody;
  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ message: "title is required." }, { status: 400 });

  const parsedStart = new Date(body.startTime ?? "");
  if (Number.isNaN(parsedStart.getTime())) {
    return NextResponse.json({ message: "startTime must be valid ISO datetime." }, { status: 400 });
  }
  const parsedEnd = body.endTime ? new Date(body.endTime) : null;
  if (parsedEnd && Number.isNaN(parsedEnd.getTime())) {
    return NextResponse.json({ message: "endTime must be valid ISO datetime." }, { status: 400 });
  }
  if (parsedEnd && parsedEnd < parsedStart) {
    return NextResponse.json({ message: "endTime must be after startTime." }, { status: 400 });
  }

  const eventType = (body.eventType ?? "special").trim();
  if (!VALID_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ message: "Invalid eventType." }, { status: 400 });
  }

  const visibility = (body.visibility ?? "public").trim();
  if (!VALID_VISIBILITY.has(visibility)) {
    return NextResponse.json({ message: "Invalid visibility." }, { status: 400 });
  }

  const publishStatus = (body.publishStatus ?? "draft").trim();
  if (!VALID_STATUS.has(publishStatus)) {
    return NextResponse.json({ message: "Invalid publishStatus." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });

  const slug = body.slug?.trim() ? await ensureEventSlug(body.slug.trim()) : await ensureEventSlug(title);

  const { data, error } = await supabase
    .from("events")
    .insert({
      slug,
      title,
      short_summary: body.shortSummary?.trim() || null,
      full_description: body.fullDescription?.trim() || null,
      description: body.fullDescription?.trim() || body.shortSummary?.trim() || null,
      event_type: eventType,
      category: (body.category ?? "community").trim(),
      start_time: parsedStart.toISOString(),
      end_time: parsedEnd?.toISOString() ?? null,
      all_day: Boolean(body.allDay),
      recurrence: body.recurrence ?? null,
      recurrence_until: body.recurrenceUntil ? new Date(body.recurrenceUntil).toISOString() : null,
      location: body.location?.trim() || null,
      cover_image_url: body.coverImageUrl?.trim() || null,
      publish_status: publishStatus,
      visibility,
      is_public: visibility === "public",
      cta_text: body.ctaText?.trim() || null,
      volunteer_notes: body.volunteerNotes?.trim() || null,
      max_volunteer_count:
        body.maxVolunteerCount === null || body.maxVolunteerCount === undefined
          ? null
          : Math.max(1, Math.floor(Number(body.maxVolunteerCount))),
      timezone: "America/Los_Angeles",
      updated_at: new Date().toISOString(),
      created_by: access.familyId,
    })
    .select(
      "id, slug, title, short_summary, full_description, event_type, category, start_time, end_time, all_day, recurrence, recurrence_until, location, cover_image_url, publish_status, visibility, cta_text, volunteer_notes, max_volunteer_count, timezone, created_at, updated_at",
    )
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ event: data }, { status: 201 });
}
