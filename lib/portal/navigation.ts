import { hasPortalPermission, type PortalPermission } from "@/lib/portal/rbac";
import type { FamilyRole } from "@/lib/portal/types";
import type { WorkspaceIconName } from "@/components/workspace/workspace-ui";

export interface WorkspaceNavItem {
  href: string;
  label: string;
  icon: WorkspaceIconName;
  group: string;
  permission?: PortalPermission;
  description?: string;
}

export const roleNames: Record<FamilyRole, string> = {
  super_admin: "Site administrator",
  treasurer: "Treasurer",
  event_manager: "Event manager",
  membership_manager: "Membership manager",
  site_content_manager: "Content manager",
  member: "Member",
};

const adminNavigation: WorkspaceNavItem[] = [
  { href: "/admin", label: "Overview", icon: "home", group: "Workspace" },
  {
    href: "/admin/notifications",
    label: "Review inbox",
    icon: "inbox",
    group: "Workspace",
    description: "Member approvals, reservations, and donor requests in one place.",
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    icon: "calendar",
    group: "Gatherings",
    permission: "events.manage",
    description: "See events and approved space bookings together.",
  },
  {
    href: "/admin/events",
    label: "Events & service",
    icon: "spark",
    group: "Gatherings",
    permission: "events.manage",
    description: "Publish gatherings, manage RSVPs, and organize volunteers.",
  },
  {
    href: "/admin/reservations",
    label: "Reservations",
    icon: "clock",
    group: "Gatherings",
    permission: "events.manage",
    description: "Verify payments and confirm private space requests.",
  },
  {
    href: "/admin/donations",
    label: "Donations",
    icon: "heart",
    group: "Stewardship",
    permission: "donations.manage",
    description: "Record gifts and reconcile your community’s contributions.",
  },
  {
    href: "/admin/expenses",
    label: "Expenses",
    icon: "receipt",
    group: "Stewardship",
    permission: "expenses.manage",
    description: "Review requests, track payments, and reconcile costs.",
  },
  {
    href: "/admin/projects",
    label: "Funding projects",
    icon: "folder",
    group: "Stewardship",
    permission: "projects.manage",
    description: "Shape and manage campaigns that build our shared future.",
  },
  {
    href: "/admin/roles",
    label: "Members & access",
    icon: "users",
    group: "Community",
    permission: "roles.read_all",
    description: "Care for family profiles and manage team responsibilities.",
  },
  {
    href: "/admin/content",
    label: "Website content",
    icon: "folder",
    group: "Community",
    permission: "cms.manage",
    description: "Keep the public website welcoming, accurate, and up to date.",
  },
];

export function getAdminNavigation(roles: FamilyRole[]) {
  return adminNavigation.filter(
    (item) => !item.permission || hasPortalPermission(roles, item.permission),
  );
}

export const memberNavigation: WorkspaceNavItem[] = [
  { href: "/portal", label: "Your home", icon: "home", group: "Member space" },
  { href: "/portal/donations", label: "Giving history", icon: "heart", group: "Your giving" },
  { href: "/portal/pledge", label: "Active donor circle", icon: "spark", group: "Your giving" },
  {
    href: "/portal/foundingfamily",
    label: "Founding family",
    icon: "folder",
    group: "Your giving",
  },
  { href: "/calendar", label: "Community calendar", icon: "calendar", group: "Get involved" },
  {
    href: "/portal/volunteer",
    label: "Volunteer & serve",
    icon: "volunteer",
    group: "Get involved",
  },
  { href: "/reserve-an-event", label: "Reserve a space", icon: "clock", group: "Get involved" },
  { href: "/portal/expense", label: "Reimbursements", icon: "receipt", group: "Get involved" },
];
