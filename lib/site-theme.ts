export type SiteTheme = "classic-green" | "revamp" | "durgacenter";

// A new cookie resets earlier theme choices so visitors first see the current
// Durga Center design. The menu can still switch to the other site views.
export const SITE_VIEW_COOKIE = "db_site_view";

export function resolveSiteTheme(value: string | undefined): SiteTheme {
  return value === "classic-green" || value === "revamp" ? value : "durgacenter";
}
