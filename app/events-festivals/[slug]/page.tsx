import { redirect } from "next/navigation";
import { pacificDay } from "@/lib/events/hub";
import { computeVisibilityForUser, getEventBySlug } from "@/lib/events/server";

export default async function EventDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ occurrenceStart?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const search = new URLSearchParams({ event: slug });
  const start =
    query.occurrenceStart && !Number.isNaN(Date.parse(query.occurrenceStart))
      ? query.occurrenceStart
      : (await getEventBySlug(slug, await computeVisibilityForUser()))?.start_time;
  if (start) {
    const date = pacificDay(start);
    search.set("date", date);
    search.set("month", date.slice(0, 7));
  }
  redirect(`/calendar?${search}`);
}
