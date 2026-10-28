import { cookies } from "next/headers";

import { DurgacenterJoinHandsPage } from "@/components/DurgacenterJoinHandsPage";
import DonatePage from "@/app/donate/page";
import { resolveSiteTheme, SITE_VIEW_COOKIE } from "@/lib/site-theme";

interface JoinHandsPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function JoinHandsPage({ searchParams }: JoinHandsPageProps) {
  const theme = resolveSiteTheme((await cookies()).get(SITE_VIEW_COOKIE)?.value);
  if (theme === "durgacenter") return <DurgacenterJoinHandsPage />;
  return <DonatePage searchParams={searchParams} />;
}
export const metadata = { title: "Join Hands to Build Durga Bari" };
