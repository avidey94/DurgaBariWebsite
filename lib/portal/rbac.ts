import type { FamilyRole } from "@/lib/portal/types";

export type PortalPermission =
  | "families.read_all"
  | "families.manage"
  | "roles.manage"
  | "projects.manage"
  | "projects.read"
  | "donations.read_all"
  | "donations.manage"
  | "expenses.read_all"
  | "expenses.manage"
  | "events.manage"
  | "admin.settings"
  | "member.self.read"
  | "member.self.update";

const permissionsByRole: Record<FamilyRole, PortalPermission[]> = {
  super_admin: [
    "families.read_all",
    "families.manage",
    "roles.manage",
    "projects.manage",
    "projects.read",
    "donations.read_all",
    "donations.manage",
    "expenses.read_all",
    "expenses.manage",
    "events.manage",
    "admin.settings",
    "member.self.read",
    "member.self.update",
  ],
  treasurer: [
    "families.read_all",
    "projects.manage",
    "projects.read",
    "donations.read_all",
    "donations.manage",
    "expenses.read_all",
    "expenses.manage",
    "member.self.read",
    "member.self.update",
  ],
  event_manager: [
    "projects.read",
    "events.manage",
    "member.self.read",
    "member.self.update",
  ],
  member: ["projects.read", "member.self.read", "member.self.update"],
};

export const getPermissionsForRoles = (roles: FamilyRole[]): Set<PortalPermission> => {
  const permissions = new Set<PortalPermission>();

  roles.forEach((role) => {
    permissionsByRole[role].forEach((permission) => {
      permissions.add(permission);
    });
  });

  return permissions;
};

export const hasPortalPermission = (roles: FamilyRole[], permission: PortalPermission): boolean => {
  return getPermissionsForRoles(roles).has(permission);
};

export const isFinanceRole = (roles: FamilyRole[]): boolean => {
  return roles.includes("super_admin") || roles.includes("treasurer");
};

export const isEventRole = (roles: FamilyRole[]): boolean => {
  return roles.includes("super_admin") || roles.includes("event_manager");
};
