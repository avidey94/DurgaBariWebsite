import { cookies } from "next/headers";

import { HomePageClassic } from "@/components/home/HomePageClassic";
import { HomePageDurgacenter } from "@/components/home/HomePageDurgacenter";
import { HomePageRevamp } from "@/components/home/HomePageRevamp";
import { resolveLanguage } from "@/lib/i18n";

interface HomePageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const cookieStore = await cookies();
  const theme = cookieStore.get("db_theme")?.value;
  if (theme === "durgacenter") {
    return <HomePageDurgacenter lang={lang} />;
  }
  return theme === "classic-green" ? <HomePageClassic lang={lang} /> : <HomePageRevamp lang={lang} />;
}
