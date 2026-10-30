import { redirect } from "next/navigation";

import { PortalVolunteerCenter } from "@/components/portal-volunteer-center";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessMemberContent, getCurrentFamilyPortalContext } from "@/lib/portal/server";
import { isNewSitePortal } from "@/lib/portal/is-new-site";

export const metadata = { title: "Volunteer & serve" };

export default async function PortalVolunteerPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const context = await getCurrentFamilyPortalContext();
  if (!context || !context.family.profileCompleted || !canAccessMemberContent(context)) {
    redirect("/portal");
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
