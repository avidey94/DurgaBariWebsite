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
      <article className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">{event.event_type}</p>
        {event.visibility === "members" ? (
          <p className="inline-block rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Members only
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{event.title}</h1>
        {event.short_summary ? <p className="text-lg text-slate-700">{event.short_summary}</p> : null}

        <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Starts</p>
            <p className="text-sm font-medium text-slate-900">{dateTimeFormatter.format(new Date(startsAt))}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Ends</p>
            <p className="text-sm font-medium text-slate-900">
              {endsAt ? dateTimeFormatter.format(new Date(endsAt)) : "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
            <p className="text-sm font-medium text-slate-900">{event.location ?? "Durga Bari Campus"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Type</p>
            <p className="text-sm font-medium capitalize text-slate-900">{event.event_type}</p>
          </div>
        </div>

        {event.full_description ? (
          <div className="prose prose-slate max-w-none text-sm">
            <p>{event.full_description}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/calendar/events/${event.slug ?? event.id}/ics?occurrenceStart=${encodeURIComponent(startsAt)}`}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add to Calendar
          </a>
          <Link
            href="/api/calendar/feed"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Subscribe to Calendar
          </Link>
          <Link
            href="/events-festivals"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Back to events
          </Link>
        </div>
      </article>
    </ContentPageFrame>
  );
}
