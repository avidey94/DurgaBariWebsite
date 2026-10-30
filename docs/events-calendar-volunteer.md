# Events + Volunteer System Notes

## Recurrence model
- Events are stored once in `public.events`.
- Optional `recurrence` JSON describes the repeat rule:
  - `frequency`: `daily | weekly | monthly`
  - `interval`: positive integer (default `1`)
  - `byWeekdays` (weekly only): array of weekday numbers `0..6` (Sun..Sat)
- Optional `recurrence_until` sets the stop date.
- Occurrences are generated at read time (not persisted as separate rows) using `lib/events/calendar.ts`.

## Volunteer model
- `event_volunteer_slots` stores slot definitions per event.
- `event_volunteer_signups` stores family/user signups per slot.
- One signup per family per slot (`unique (slot_id, family_id)`).
- Capacity checks happen at signup time in `/api/portal/volunteer/signup`.

## Calendar support
- Per-event ICS: `/api/calendar/events/[id]/ics`
- Public feed ICS: `/api/calendar/feed`

## Access model
- Public: read published public events and ICS.
- Signed-in members: read public/member events and volunteer through `/portal/volunteer`.
- `event_manager` + `super_admin`: full management via `/admin/events` and `/api/admin/events/*`.

## Central calendar experience
- `/calendar` is the shared home for events, festivals, and member RSVPs. Dates open a focused day view, and event-type filters live beside search. Space availability remains in the reservation and admin flows. Older `/events`, `/events-festivals`, and event detail links redirect into it.
- `/api/calendar/hub?month=YYYY-MM` returns the visible month, including recurring occurrences and the signed-in user's own RSVPs. Responses are private and never cached. Restricted space-blocking events and approved reservations expose only anonymous busy times.
- RSVP writes continue through `/api/events/[id]/rsvp`. Recurring events currently share one event-level RSVP; the event dialog explains this.
- The calendar supports a scoped home-screen installation. Its service worker stores only a neutral offline explanation; event responses, member details, and RSVPs always require a network connection.
- Run `node --test tests/calendar.test.cjs` for calendar dates, visibility, private booking redaction, RSVP ownership, access, and capacity checks.
