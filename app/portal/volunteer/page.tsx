import { redirect } from "next/navigation";

import { PortalVolunteerCenter } from "@/components/portal-volunteer-center";
import { getCurrentUser } from "@/lib/auth/session";

export default async function PortalVolunteerPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <PortalVolunteerCenter />
    </section>
  );
}
