import { HomePageClassic } from "@/components/home/HomePageClassic";
import { resolveLanguage } from "@/lib/i18n";

interface HomePageTempProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function HomePageTemp({ searchParams }: HomePageTempProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  return <HomePageClassic lang={lang} />;
}
