import { cookies } from "next/headers";
import type { Metadata } from "next";

import { HomePageClassic } from "@/components/home/HomePageClassic";
import { HomePageDurgacenter } from "@/components/home/HomePageDurgacenter";
import { HomePageElevated } from "@/components/home/HomePageElevated";
import { HomePageCinematic } from "@/components/home/HomePageCinematic";
import { resolveLanguage } from "@/lib/i18n";
import { resolveSiteTheme, SITE_VIEW_COOKIE } from "@/lib/site-theme";

interface HomePageProps {
  searchParams: Promise<{ lang?: string }>;
}

export const metadata: Metadata = {
  title: "A Home for Maa Durga in San Jose",
  description:
    "A new spiritual and cultural home taking shape in San Jose, California. Discover Maa Durga and her family, meet our growing community, and be part of Durga Bari’s beginning.",
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const cookieStore = await cookies();
  const theme = resolveSiteTheme(cookieStore.get(SITE_VIEW_COOKIE)?.value);
  if (theme === "durgacenter") {
    return <HomePageDurgacenter lang={lang} />;
  }
  if (theme === "classic-green") return <HomePageClassic lang={lang} />;
  if (lang === "en") return <HomePageCinematic />;
  return <HomePageElevated lang={lang} />;
}
