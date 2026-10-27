import { ContentHero, ContentPageFrame } from "@/components/content-page";
import { ReserveEventContent } from "@/components/reserve-event-content";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ReserveAnEventPage() {
  const user = await getCurrentUser({ ignorePreview: true });
  const canReserve = !!user?.id && user.authSource === "supabase";
  const zeffyUrl = process.env.ZEFFY_RESERVATION_URL ?? "https://www.zeffy.com/en-US/ticketing/reserve-an-event-at-durga-bari";

  return (
    <ContentPageFrame>
      <ContentHero
        kicker="Private gatherings"
        title="Reserve an Event"
        subtitle="Request Durga Bari’s space for a private event. Choose a date and time, add the services you need, and complete payment through Zeffy. Our team will review your request before confirming it."
      />
      <ReserveEventContent canReserve={canReserve} zeffyUrl={zeffyUrl} />
    </ContentPageFrame>
  );
}
