import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { getActivePreviewState, getCurrentUser } from "@/lib/auth/session";

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
  const [user, preview] = await Promise.all([getCurrentUser(), getActivePreviewState()]);

  return (
    <html lang="en" data-theme="classic-green">
      <body className="bg-[var(--db-bg)] text-[var(--db-text)] antialiased">
        <SiteHeader user={user} preview={preview} />
        <main className="min-h-[calc(100vh-73px)]">{children}</main>
      </body>
    </html>
  );
}
