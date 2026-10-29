export type SiteTheme = "classic-green" | "revamp" | "durgacenter";

// Start visitors on the new site after launch. Earlier saved view choices use
// the previous cookie name; visitors can still switch views from the menu.
export const SITE_VIEW_COOKIE = "db_site_view_v2";

export function resolveSiteTheme(value: string | undefined): SiteTheme {
  return value === "classic-green" || value === "durgacenter" ? value : "revamp";
}
