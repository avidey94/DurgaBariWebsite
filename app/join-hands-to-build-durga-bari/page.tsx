import { cookies } from "next/headers";

import { DurgacenterJoinHandsPage } from "@/components/DurgacenterJoinHandsPage";
import DonatePage from "@/app/donate/page";

interface JoinHandsPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function JoinHandsPage({ searchParams }: JoinHandsPageProps) {
  const theme = (await cookies()).get("db_theme")?.value;
  if (theme === "durgacenter") return <DurgacenterJoinHandsPage />;
  return <DonatePage searchParams={searchParams} />;
}
