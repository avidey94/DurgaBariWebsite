import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const canCurrentUserManageCms = async (): Promise<boolean> => {
  const access = await getAdminAccessContext();
  return access ? hasPortalPermission(access.roles, "cms.manage") : false;
};
