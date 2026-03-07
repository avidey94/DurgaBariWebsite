import { getCurrentUser } from "@/lib/auth/session";
import { getPermissionsForRoles, hasPortalPermission, type PortalPermission } from "@/lib/portal/rbac";
import { getCurrentFamilyPortalContext } from "@/lib/portal/server";
import type { FamilyRole } from "@/lib/portal/types";

export interface AdminAccessContext {
  userEmail: string;
  familyId: string | null;
  roles: FamilyRole[];
  permissions: Set<PortalPermission>;
}

export const getAdminAccessContext = async (): Promise<AdminAccessContext | null> => {
  const user = await getCurrentUser({ ignorePreview: true });

  if (!user) {
    return null;
  }

  const familyContext = await getCurrentFamilyPortalContext({ ignorePreview: true });

  let roles: FamilyRole[] = familyContext?.roles ?? [];
  const familyId: string | null = familyContext?.family.id ?? null;

  // Backward-compatible fallback while existing admin accounts are being migrated
  // into family_roles. This preserves current event/CMS admin workflows even after
  // bootstrap creates a default "member" role grant.
  if (user.isAdmin && !roles.includes("super_admin")) {
    roles = ["super_admin", ...roles];
  }

  const normalizedRoles = Array.from(
    new Set<FamilyRole>(roles.length > 0 ? roles : ["member"]),
  );

  return {
    userEmail: user.email,
    familyId,
    roles: normalizedRoles,
    permissions: getPermissionsForRoles(normalizedRoles),
  };
};

export const canAccessAdminHome = (ctx: AdminAccessContext): boolean => {
  return (
    hasPortalPermission(ctx.roles, "events.manage") ||
    hasPortalPermission(ctx.roles, "donations.manage") ||
    hasPortalPermission(ctx.roles, "projects.manage") ||
    hasPortalPermission(ctx.roles, "families.read_all") ||
    hasPortalPermission(ctx.roles, "roles.manage")
  );
};
