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
