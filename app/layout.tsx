import type { Metadata } from "next";
import { cookies } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { ElevatedFooter } from "@/components/elevated/Footer";
import { decodeCmsText } from "@/lib/cms/cms-text";
import { getCmsPageContentsByPrefix } from "@/lib/cms/page-content";
import { getActivePreviewState, getCurrentUser } from "@/lib/auth/session";
import { canAccessAdminHome, getAdminAccessContext } from "@/lib/portal/admin-auth";
import { getAdminInboxCounts } from "@/lib/portal/admin-inbox";
import { hasPortalPermission } from "@/lib/portal/rbac";
import { resolveSiteTheme, SITE_VIEW_COOKIE } from "@/lib/site-theme";

import "./globals.css";
import "../styles/elevated.css";
import "../styles/member-portal.css";
import "../styles/member-subpages.css";
import "../styles/workspace.css";
import "../styles/admin-workflows.css";

export const metadata: Metadata = {
  title: {
    default: "Durga Bari – Center for Spiritual and Cultural Excellence – A sacred space for worship, Bengali cultural heritage, and community rooted in the blessings of Ma Durga",
    template: "%s – Durga Bari – Center for Spiritual and Cultural Excellence",
  },
  description: "A sacred space for worship, Bengali cultural heritage, and community rooted in the blessings of Ma Durga.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const siteTheme = resolveSiteTheme(cookieStore.get(SITE_VIEW_COOKIE)?.value);
  const [user, preview, adminAccess] = await Promise.all([
    getCurrentUser(),
    getActivePreviewState(),
    getAdminAccessContext(),
  ]);
  const showAdminLink = adminAccess ? canAccessAdminHome(adminAccess) : false;
  const notificationCount = adminAccess && showAdminLink
    ? await getAdminInboxCounts(adminAccess).then((counts) => counts.total).catch(() => 0)
    : 0;
  const footerRows = siteTheme === "revamp" ? await getCmsPageContentsByPrefix("revamp-footer-") : [];
  const footerFields = Object.fromEntries(footerRows.map((row) => [row.slug, decodeCmsText(row.content_html)]));
  const canManageCms = adminAccess ? hasPortalPermission(adminAccess.roles, "cms.manage") : false;

  return (
    <html lang="en" data-theme={siteTheme}>
      <body className="bg-[var(--db-bg)] text-[var(--db-text)] antialiased">
        <SiteHeader user={user} preview={preview} showAdminLink={showAdminLink} adminNotificationCount={notificationCount} initialTheme={siteTheme} />
        <main className="min-h-[calc(100vh-73px)]">{children}</main>
        {siteTheme === "durgacenter" ? (
          <footer className="durgacenter-footer">Copyright © 2026 Durga Bari - Center for Spiritual and Cultural Excellence</footer>
        ) : siteTheme === "revamp" ? <ElevatedFooter fields={footerFields} isAdmin={canManageCms} /> : null}
      </body>
    </html>
  );
}
