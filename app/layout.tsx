import type { Metadata } from "next";

import { NavBar } from "@/components/nav-bar";
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
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <NavBar user={user} />
        <main className="mx-auto min-h-[calc(100vh-73px)] max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
