import { Fragment } from "react";

export interface DurgacenterEventSummary {
  title: string;
  date: string;
  day: string;
  weekday: string;
  time: string;
  url: string;
  featured: boolean;
}

export function DurgacenterEventListPage({ events }: { events: DurgacenterEventSummary[] }) {
  return (
    <section className="durgacenter-event-list-page">
      <h1 className="sr-only">Events</h1>
      <div className="durgacenter-event-list-content">
        <div className="durgacenter-event-list-toolbar">
          <span>Upcoming <span aria-hidden="true">⌄</span></span>
          <div className="durgacenter-event-list-icons" aria-hidden="true"><span>⌕</span><span>▣</span></div>
        </div>
        {events.length === 0 ? <p className="durgacenter-event-list-empty">There are no upcoming events.</p> : null}
        {events.map((event, index) => (
          <Fragment key={`${event.url}-${event.day}`}>
            {index === 0 || events[index - 1].date !== event.date ? <div className="durgacenter-event-list-month"><span>{event.date}</span><span /></div> : null}
            <article className="durgacenter-event-list-item">
              <div className="durgacenter-event-list-day"><small>{event.weekday}</small><strong>{event.day}</strong></div>
              <div>
                <p>{event.featured ? "⚑ " : ""}{event.time}</p>
                <h2><a href={event.url}>{event.title}</a></h2>
              </div>
            </article>
          </Fragment>
        ))}
        <div className="durgacenter-event-list-pagination">
          <a href="https://thedurgacenter.org/events/list/?eventDisplay=past">‹ Previous</a>
          <span>Today</span>
          <span className="is-disabled">Next ›</span>
        </div>
        <a className="durgacenter-event-list-subscribe" href="https://thedurgacenter.org/events/list/?ical=1">Subscribe to calendar <span aria-hidden="true">⌄</span></a>
      </div>
    </section>
  );
}
