import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DurgacenterEventsPage } from "@/components/DurgacenterEventsPage";
import { resolveSiteTheme, SITE_VIEW_COOKIE } from "@/lib/site-theme";

export default async function SacredCelebrationsPage() {
  const theme = resolveSiteTheme((await cookies()).get(SITE_VIEW_COOKIE)?.value);
  if (theme !== "durgacenter") redirect("/events-festivals");
  return <DurgacenterEventsPage />;
}
export const metadata = { title: "A Calendar of Sacred Celebrations" };
