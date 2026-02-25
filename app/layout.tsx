import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/session";

import "./globals.css";

export const metadata: Metadata = {
  title: "Durgabari Donation Portal",
  description: "Secure donor portal for Durgabari families.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" data-theme="classic-green">
      <body className="bg-[var(--db-bg)] text-[var(--db-text)] antialiased">
        <SiteHeader user={user} />
        <main className="min-h-[calc(100vh-73px)]">{children}</main>
      </body>
    </html>
  );
}
