import { cookies } from "next/headers";

import { resolveSiteTheme, SITE_VIEW_COOKIE } from "@/lib/site-theme";

export async function isNewSitePortal() {
  return resolveSiteTheme((await cookies()).get(SITE_VIEW_COOKIE)?.value) === "revamp";
}
