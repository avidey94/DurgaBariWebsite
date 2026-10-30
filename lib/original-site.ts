const ORIGINAL_SITE_ORIGIN = "https://thedurgacenter.org";

// Public page addresses confirmed against the original site's navigation and page list.
const originalPaths: Record<string, string> = {
  "/": "/",
  "/about": "/about/",
  "/calendar": "/events/",
  "/events": "/events/",
  "/events-festivals": "/coming-soon-a-calendar-of-sacred-celebrations/",
  "/coming-soon-a-calendar-of-sacred-celebrations":
    "/coming-soon-a-calendar-of-sacred-celebrations/",
  "/our-sacred-journey-from-vision-to-temple": "/our-sacred-journey-from-vision-to-temple/",
  "/get-involved": "/be-part-of-something-sacred-and-lasting/",
  "/be-part-of-something-sacred-and-lasting": "/be-part-of-something-sacred-and-lasting/",
  "/contact": "/contact/",
  "/donate": "/join-hands-to-build-durga-bari/",
  "/join-hands-to-build-durga-bari": "/join-hands-to-build-durga-bari/",
  "/projects": "/our-sacred-journey-from-vision-to-temple/",
  "/sponsors": "/join-hands-to-build-durga-bari/",
  "/reserve-an-event": "/contact/",
};

export function getOriginalSiteHref(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  let original = originalPaths[path];
  if (!original && path.startsWith("/events-festivals/")) original = "/events/";
  if (!original && path.startsWith("/projects/")) {
    original = "/our-sacred-journey-from-vision-to-temple/";
  }
  // New portal, admin, and other unmatched pages have no public original counterpart.
  return `${ORIGINAL_SITE_ORIGIN}${original || "/"}`;
}
