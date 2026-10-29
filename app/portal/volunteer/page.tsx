import { redirect } from "next/navigation";

import { PortalVolunteerCenter } from "@/components/portal-volunteer-center";
import { getCurrentUser } from "@/lib/auth/session";
import { isNewSitePortal } from "@/lib/portal/is-new-site";

export default async function PortalVolunteerPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (await isNewSitePortal()) {
    return <PortalVolunteerCenter elevated />;
  }

  return (
    <section className="db-shell max-w-6xl">
      <PortalVolunteerCenter />
    </section>
  );
}
