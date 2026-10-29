import { cookies } from "next/headers";

import { HomePageClassic } from "@/components/home/HomePageClassic";
import { HomePageDurgacenter } from "@/components/home/HomePageDurgacenter";
import { HomePageElevated } from "@/components/home/HomePageElevated";
import { PayloadPageView } from "@/components/payload/Page";
import { resolveLanguage } from "@/lib/i18n";
import { getPublishedPayloadPage } from "@/lib/payload/pages";
import { resolveSiteTheme, SITE_VIEW_COOKIE } from "@/lib/site-theme";

interface HomePageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const cookieStore = await cookies();
  const theme = resolveSiteTheme(cookieStore.get(SITE_VIEW_COOKIE)?.value);
  if (theme === "durgacenter") {
    return <HomePageDurgacenter lang={lang} />;
  }
  if (theme === "classic-green") return <HomePageClassic lang={lang} />;
  if (lang === "en") {
    const page = await getPublishedPayloadPage("home");
    if (page) return <PayloadPageView page={page} />;
  }
  return <HomePageElevated lang={lang} />;
}
