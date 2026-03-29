import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { ensureEventSlug } from "@/lib/events/server";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

interface UpdateEventBody {
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await getAdminAccessContext();
  if (!access) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPortalPermission(access.roles, "events.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as UpdateEventBody;
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) return NextResponse.json({ message: "title cannot be empty." }, { status: 400 });
    updates.title = title;
    if (body.slug === undefined) {
      updates.slug = await ensureEventSlug(title, id);
    }
  }

  if (body.slug !== undefined) {
    updates.slug = await ensureEventSlug(body.slug.trim(), id);
  }

  if (body.shortSummary !== undefined) updates.short_summary = body.shortSummary?.trim() || null;
  if (body.fullDescription !== undefined) {
    updates.full_description = body.fullDescription?.trim() || null;
    updates.description = body.fullDescription?.trim() || null;
  }
  if (body.eventType !== undefined) updates.event_type = body.eventType;
  if (body.category !== undefined) updates.category = body.category;
  if (body.startTime !== undefined) updates.start_time = new Date(body.startTime).toISOString();
  if (body.endTime !== undefined) updates.end_time = body.endTime ? new Date(body.endTime).toISOString() : null;
  if (body.allDay !== undefined) updates.all_day = body.allDay;
  if (body.recurrence !== undefined) updates.recurrence = body.recurrence;
  if (body.recurrenceUntil !== undefined) {
    updates.recurrence_until = body.recurrenceUntil ? new Date(body.recurrenceUntil).toISOString() : null;
  }
  if (body.location !== undefined) updates.location = body.location?.trim() || null;
  if (body.coverImageUrl !== undefined) updates.cover_image_url = body.coverImageUrl?.trim() || null;
  if (body.publishStatus !== undefined) updates.publish_status = body.publishStatus;
  if (body.visibility !== undefined) {
    updates.visibility = body.visibility;
    updates.is_public = body.visibility === "public";
  }
  if (body.ctaText !== undefined) updates.cta_text = body.ctaText?.trim() || null;
  if (body.volunteerNotes !== undefined) updates.volunteer_notes = body.volunteerNotes?.trim() || null;
  if (body.maxVolunteerCount !== undefined) {
    updates.max_volunteer_count =
      body.maxVolunteerCount === null ? null : Math.max(1, Math.floor(Number(body.maxVolunteerCount)));
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Supabase is not configured." }, { status: 500 });

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select(
      "id, slug, title, short_summary, full_description, event_type, category, start_time, end_time, all_day, recurrence, recurrence_until, location, cover_image_url, publish_status, visibility, cta_text, volunteer_notes, max_volunteer_count, timezone, created_at, updated_at",
    )
    .maybeSingle();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ message: "Event not found." }, { status: 404 });
  return NextResponse.json({ event: data }, { status: 200 });
}
