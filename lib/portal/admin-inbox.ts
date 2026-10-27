import { createServiceRoleSupabaseClient } from "@/lib/auth/supabase";
import type { AdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export interface AdminInboxCounts {
  members: number;
  reservations: number;
  donorRequests: number;
  total: number;
}

export interface PendingMember {
  id: string;
  family_display_name: string;
  primary_email: string;
  phone_number: string | null;
  adults_count: number;
  adult_names: string[];
  children_count: number;
  child_names: string[];
  created_at: string;
}

export interface PendingReservation {
  id: string;
  booking_reference: string;
  email: string;
  event_title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface PendingDonorRequest {
  id: string;
  family_display_name: string;
  primary_email: string;
  requested_active_donor_status: string;
  requested_active_donor_at: string | null;
}

const canReviewMembers = (access: AdminAccessContext) =>
  hasPortalPermission(access.roles, "families.manage");

const canReviewReservations = (access: AdminAccessContext) =>
  hasPortalPermission(access.roles, "events.manage");

export async function getAdminInboxCounts(access: AdminAccessContext): Promise<AdminInboxCounts> {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) throw new Error("The admin inbox is unavailable.");

  const empty = { count: 0, error: null };
  const [members, reservations, donorRequests] = await Promise.all([
    canReviewMembers(access)
      ? supabase
          .from("families")
          .select("id", { count: "exact", head: true })
          .eq("portal_access_state", "pending")
          .eq("profile_completed", true)
      : Promise.resolve(empty),
    canReviewReservations(access)
      ? supabase
          .from("event_reservations")
          .select("id", { count: "exact", head: true })
          .eq("status", "requested")
      : Promise.resolve(empty),
    canReviewMembers(access)
      ? supabase
          .from("families")
          .select("id", { count: "exact", head: true })
          .not("requested_active_donor_status", "is", null)
      : Promise.resolve(empty),
  ]);

  if (members.error || reservations.error || donorRequests.error) {
    throw new Error("Could not load admin notifications.");
  }

  const counts = {
    members: members.count ?? 0,
    reservations: reservations.count ?? 0,
    donorRequests: donorRequests.count ?? 0,
  };
  return { ...counts, total: counts.members + counts.reservations + counts.donorRequests };
}

export async function getAdminInboxItems(access: AdminAccessContext) {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) throw new Error("The admin inbox is unavailable.");

  const empty = { data: [], error: null };
  const [members, reservations, donorRequests] = await Promise.all([
    canReviewMembers(access)
      ? supabase
          .from("families")
          .select(
            "id, family_display_name, primary_email, phone_number, adults_count, adult_names, children_count, child_names, created_at",
          )
          .eq("portal_access_state", "pending")
          .eq("profile_completed", true)
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve(empty),
    canReviewReservations(access)
      ? supabase
          .from("event_reservations")
          .select(
            "id, booking_reference, email, event_title, event_date, start_time, end_time, created_at",
          )
          .eq("status", "requested")
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve(empty),
    canReviewMembers(access)
      ? supabase
          .from("families")
          .select(
            "id, family_display_name, primary_email, requested_active_donor_status, requested_active_donor_at",
          )
          .not("requested_active_donor_status", "is", null)
          .order("requested_active_donor_at", { ascending: false })
          .limit(100)
      : Promise.resolve(empty),
  ]);

  if (members.error || reservations.error || donorRequests.error) {
    throw new Error("Could not load admin notifications.");
  }

  return {
    members: (members.data ?? []) as PendingMember[],
    reservations: (reservations.data ?? []) as PendingReservation[],
    donorRequests: (donorRequests.data ?? []) as PendingDonorRequest[],
  };
}
