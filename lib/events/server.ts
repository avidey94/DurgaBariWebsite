import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";
import {
  expandOccurrences,
  toSlug,
  type CalendarEvent,
  type EventOccurrence,
  type EventPublishStatus,
  type EventVisibility,
} from "@/lib/events/calendar";

export interface VolunteerSlot {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  capacity: number;
  notes: string | null;
  sort_order: number;
  slot_state: "open" | "closed";
  created_at: string;
  updated_at: string;
}

export interface VolunteerSignup {
  id: string;
  slot_id: string;
  event_id: string;
  family_id: string;
  user_id: string;
  email: string;
  participant_name: string;
  participant_type: "adult" | "child";
  signup_status: "confirmed" | "cancelled";
  signed_up_at: string;
  cancelled_at: string | null;
}

const selectEventColumns =
  "id, slug, title, short_summary, full_description, event_type, category, start_time, end_time, all_day, recurrence, recurrence_until, location, cover_image_url, publish_status, visibility, cta_text, volunteer_notes, max_volunteer_count, timezone, created_at, updated_at";

export const ensureEventSlug = async (title: string, eventId?: string): Promise<string> => {
  const supabase = createServiceRoleSupabaseClient();
  const base = toSlug(title) || "event";
  if (!supabase) return `${base}-${Date.now()}`;

  let next = base;
  let attempt = 0;

  while (attempt < 50) {
    const query = supabase.from("events").select("id").eq("slug", next).maybeSingle();
    const { data } = await query;
    if (!data || (eventId && data.id === eventId)) {
      return next;
    }
    attempt += 1;
    next = `${base}-${attempt + 1}`;
  }

  return `${base}-${Date.now()}`;
};

export const listCalendarEvents = async (options: {
  includeDraft?: boolean;
  includePrivate?: boolean;
  includeMembers?: boolean;
  fromIso: string;
  toIso: string;
}): Promise<EventOccurrence[]> => {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("events")
    .select(selectEventColumns)
    .order("start_time", { ascending: true })
    .lte("start_time", options.toIso);

  if (!options.includeDraft) {
    query = query.eq("publish_status", "published");
  }

  if (!options.includePrivate) {
    if (options.includeMembers) {
      query = query.in("visibility", ["public", "members"]);
    } else {
      query = query.eq("visibility", "public");
    }
  }

  const { data, error } = await query;
  if (error) return [];

  return (data ?? [])
    .map((event) => ({
      ...(event as CalendarEvent),
      slug: ((event as CalendarEvent).slug ?? `event-${(event as CalendarEvent).id}`) as string,
    }))
    .flatMap((event) => expandOccurrences(event as CalendarEvent, options.fromIso, options.toIso, 180))
    .sort((a, b) => new Date(a.occurrenceStart).getTime() - new Date(b.occurrenceStart).getTime());
};

export const getEventBySlug = async (
  slug: string,
  options?: { includePrivate?: boolean; includeMembers?: boolean },
): Promise<CalendarEvent | null> => {
  const includePrivate = Boolean(options?.includePrivate);
  const includeMembers = Boolean(options?.includeMembers);
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return null;

  let query = supabase.from("events").select(selectEventColumns).eq("slug", slug);
  if (!includePrivate) {
    query = query.eq("publish_status", "published");
    query = includeMembers ? query.in("visibility", ["public", "members"]) : query.eq("visibility", "public");
  }

  const { data } = await query.maybeSingle();
  if (data) {
    const event = data as CalendarEvent;
    return { ...event, slug: event.slug ?? `event-${event.id}` };
  }

  if (/^[0-9a-fA-F-]{36}$/.test(slug)) {
    let byIdQuery = supabase.from("events").select(selectEventColumns).eq("id", slug);
    if (!includePrivate) {
      byIdQuery = byIdQuery.eq("publish_status", "published");
      byIdQuery = includeMembers
        ? byIdQuery.in("visibility", ["public", "members"])
        : byIdQuery.eq("visibility", "public");
    }
    const { data: byId } = await byIdQuery.maybeSingle();
    if (byId) {
      const event = byId as CalendarEvent;
      return { ...event, slug: event.slug ?? `event-${event.id}` };
    }
  }

  return null;
};

export const canManageEvents = async (): Promise<boolean> => {
  const access = await getAdminAccessContext();
  return access ? hasPortalPermission(access.roles, "events.manage") : false;
};

export const canViewMemberEvents = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return Boolean(user);
};

export const listVolunteerSlotsForEvents = async (eventIds: string[]): Promise<VolunteerSlot[]> => {
  if (eventIds.length === 0) return [];
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("event_volunteer_slots")
    .select("id, event_id, title, description, start_time, end_time, capacity, notes, sort_order, slot_state, created_at, updated_at")
    .in("event_id", eventIds)
    .order("sort_order", { ascending: true })
    .order("start_time", { ascending: true });

  return (data ?? []) as VolunteerSlot[];
};

export const listVolunteerSignupsForSlots = async (slotIds: string[]): Promise<VolunteerSignup[]> => {
  if (slotIds.length === 0) return [];
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("event_volunteer_signups")
    .select(
      "id, slot_id, event_id, family_id, user_id, email, participant_name, participant_type, signup_status, signed_up_at, cancelled_at",
    )
    .in("slot_id", slotIds);

  return (data ?? []) as VolunteerSignup[];
};

export const computeVisibilityForUser = async (): Promise<{
  includePrivate: boolean;
  includeMembers: boolean;
}> => {
  const access = await getAdminAccessContext();
  if (access && hasPortalPermission(access.roles, "events.manage")) {
    return { includePrivate: true, includeMembers: true };
  }

  const user = await getCurrentUser();
  if (user) {
    return { includePrivate: false, includeMembers: true };
  }

  return { includePrivate: false, includeMembers: false };
};

export const visibilityToLegacyPublic = (visibility: EventVisibility) => visibility === "public";
export const legacyPublicToVisibility = (isPublic: boolean): EventVisibility => (isPublic ? "public" : "private");
export const normalizePublishStatus = (value: string): EventPublishStatus =>
  value === "published" || value === "archived" ? value : "draft";
