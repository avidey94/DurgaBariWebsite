import type { Metadata } from "next";
import { cookies } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { getActivePreviewState, getCurrentUser } from "@/lib/auth/session";
import { canAccessAdminHome, getAdminAccessContext } from "@/lib/portal/admin-auth";
import { getAdminInboxCounts } from "@/lib/portal/admin-inbox";

import "./globals.css";

export const metadata: Metadata = {
  title: "Durgabari Bay Area",
  description: "Community, culture, and devotion for Durgabari Bay Area.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("db_theme")?.value;
  const siteTheme = themeCookie === "classic-green" || themeCookie === "durgacenter" ? themeCookie : "revamp";
  const [user, preview, adminAccess] = await Promise.all([
    getCurrentUser(),
    getActivePreviewState(),
    getAdminAccessContext(),
  ]);
  const showAdminLink = adminAccess ? canAccessAdminHome(adminAccess) : false;
  const notificationCount = adminAccess && showAdminLink
    ? await getAdminInboxCounts(adminAccess).then((counts) => counts.total).catch(() => 0)
    : 0;

  return (
    <html lang="en" data-theme={siteTheme}>
      <body className="bg-[var(--db-bg)] text-[var(--db-text)] antialiased">
        <SiteHeader user={user} preview={preview} showAdminLink={showAdminLink} adminNotificationCount={notificationCount} initialTheme={siteTheme} />
        <main className="min-h-[calc(100vh-73px)]">{children}</main>
      </body>
    </html>
  );
}
