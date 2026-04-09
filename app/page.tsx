import { cookies } from "next/headers";

import { HomePageClassic } from "@/components/home/HomePageClassic";
import { HomePageRevamp } from "@/components/home/HomePageRevamp";
import { resolveLanguage } from "@/lib/i18n";

interface HomePageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const cookieStore = await cookies();
  const isRevampTheme = cookieStore.get("db_theme")?.value !== "classic-green";
  return isRevampTheme ? <HomePageRevamp lang={lang} /> : <HomePageClassic lang={lang} />;
}
