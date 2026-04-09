import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentPageFrame } from "@/components/content-page";
import { computeVisibilityForUser, getEventBySlug } from "@/lib/events/server";
import { expandOccurrences } from "@/lib/events/calendar";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short" });

interface EventDetailsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ occurrenceStart?: string }>;
}

export default async function EventDetailsPage({ params, searchParams }: EventDetailsPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const occurrenceStart = query.occurrenceStart;
  const visibility = await computeVisibilityForUser();

  const event = await getEventBySlug(slug, {
    includePrivate: visibility.includePrivate,
    includeMembers: visibility.includeMembers,
  });
  if (!event) {
    notFound();
  }

  const selectedOccurrence =
    occurrenceStart
      ? expandOccurrences(
          event,
          new Date(new Date(occurrenceStart).getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          new Date(new Date(occurrenceStart).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          50,
        ).find((entry) => entry.occurrenceStart === occurrenceStart)
      : null;

  const startsAt = selectedOccurrence?.occurrenceStart ?? event.start_time;
  const endsAt = selectedOccurrence?.occurrenceEnd ?? event.end_time;

  return (
    <ContentPageFrame>
      <article className="db-card space-y-5 p-6 md:p-8">
        <p className="db-kicker">{event.event_type}</p>
        {event.visibility === "members" ? (
          <p className="db-pill">
            Members only
          </p>
        ) : null}
        <h1 className="db-title">{event.title}</h1>
        {event.short_summary ? <p className="db-subtitle">{event.short_summary}</p> : null}

        <div className="db-card-muted grid gap-3 p-5 sm:grid-cols-2">
          <div>
            <p className="db-kicker text-[0.68rem]">Starts</p>
            <p className="text-sm font-medium text-[var(--db-text)]">{dateTimeFormatter.format(new Date(startsAt))}</p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Ends</p>
            <p className="text-sm font-medium text-[var(--db-text)]">
              {endsAt ? dateTimeFormatter.format(new Date(endsAt)) : "Not specified"}
            </p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Location</p>
            <p className="text-sm font-medium text-[var(--db-text)]">{event.location ?? "Durga Bari Campus"}</p>
          </div>
          <div>
            <p className="db-kicker text-[0.68rem]">Type</p>
            <p className="text-sm font-medium capitalize text-[var(--db-text)]">{event.event_type}</p>
          </div>
        </div>

        {event.full_description ? (
          <div className="db-prose max-w-none text-sm">
            <p>{event.full_description}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/calendar/events/${event.slug ?? event.id}/ics?occurrenceStart=${encodeURIComponent(startsAt)}`}
            className="db-button-primary text-sm no-underline"
          >
            Add to Calendar
          </a>
          <Link
            href="/api/calendar/feed"
            className="db-button-secondary text-sm no-underline"
          >
            Subscribe to Calendar
          </Link>
          <Link
            href="/events-festivals"
            className="db-button-secondary text-sm no-underline"
          >
            Back to events
          </Link>
        </div>
      </article>
    </ContentPageFrame>
  );
}
