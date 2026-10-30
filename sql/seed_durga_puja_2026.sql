-- Historical Durga Puja schedule supplied by the user.
-- Source: PHOTO-2026-10-12-22-53-03.jpg, Durga Bari, 16–20 October 2026.
-- The poster uses "PST" generically. Its printed clock times are interpreted as
-- San Jose local time (America/Los_Angeles, UTC-07:00 on these dates).
-- Only Sandhi Puja has an explicit end time. No other durations are inferred.
-- Existing events and RSVPs are preserved. Re-running this seed skips its slugs.
with schedule (slug, title, puja_day, program, event_type, local_start, local_end, notes) as (
  values
    ('durga-puja-2026-shashthi-kalparambho', 'Shashthi · Kalparambho', 'Shashthi', 'Kalparambho', 'ritual', '2026-10-16 09:00', null, null),
    ('durga-puja-2026-shashthi-bodhan', 'Shashthi · Bodhan', 'Shashthi', 'Bodhan', 'ritual', '2026-10-16 14:30', null, 'The schedule notes that Shashthi Puja was to be completed by 5:24 PM, when Saptami tithi began.'),
    ('durga-puja-2026-shashthi-cultural-program', 'Shashthi · Cultural Program', 'Shashthi', 'Cultural Program', 'community', '2026-10-16 17:30', null, null),
    ('durga-puja-2026-saptami-pujo', 'Saptami Pujo', 'Saptami', 'Saptami Pujo', 'festival', '2026-10-17 08:30', null, null),
    ('durga-puja-2026-saptami-pushpanjali', 'Saptami · Pushpanjali', 'Saptami', 'Pushpanjali', 'ritual', '2026-10-17 12:30', null, null),
    ('durga-puja-2026-saptami-balidan-maatriutsorgya', 'Saptami · Balidan / Maatriutsorgya', 'Saptami', 'Balidan / Maatriutsorgya', 'ritual', '2026-10-17 14:00', null, null),
    ('durga-puja-2026-saptami-havan', 'Saptami · Havan', 'Saptami', 'Havan', 'ritual', '2026-10-17 16:00', null, null),
    ('durga-puja-2026-saptami-cultural-program', 'Saptami · Cultural Program', 'Saptami', 'Cultural Program', 'community', '2026-10-17 17:30', null, null),
    ('durga-puja-2026-ashtami-pujo', 'Ashtami Pujo', 'Ashtami', 'Ashtami Pujo', 'festival', '2026-10-18 08:30', null, null),
    ('durga-puja-2026-ashtami-pushpanjali', 'Ashtami · Pushpanjali', 'Ashtami', 'Pushpanjali', 'ritual', '2026-10-18 12:30', null, null),
    ('durga-puja-2026-ashtami-havan', 'Ashtami · Havan', 'Ashtami', 'Havan', 'ritual', '2026-10-18 13:30', null, null),
    ('durga-puja-2026-ashtami-balidan-maatriutsorgya', 'Ashtami · Balidan / Maatriutsorgya', 'Ashtami', 'Balidan / Maatriutsorgya', 'ritual', '2026-10-18 14:30', null, null),
    ('durga-puja-2026-ashtami-dhol-tasha', 'Ashtami · Dhol Tasha Performance', 'Ashtami', 'Dhol Tasha Performance', 'community', '2026-10-18 16:30', null, null),
    ('durga-puja-2026-ashtami-sandhi-puja', 'Ashtami · Sandhi Puja', 'Ashtami', 'Sandhi Puja', 'ritual', '2026-10-18 21:57', '2026-10-18 22:45', null),
    ('durga-puja-2026-navami-pujo', 'Navami Pujo', 'Navami', 'Navami Pujo', 'festival', '2026-10-19 08:30', null, null),
    ('durga-puja-2026-navami-pushpanjali', 'Navami · Pushpanjali', 'Navami', 'Pushpanjali', 'ritual', '2026-10-19 12:30', null, null),
    ('durga-puja-2026-navami-balidan-maatriutsorgya', 'Navami · Balidan / Maatriutsorgya', 'Navami', 'Balidan / Maatriutsorgya', 'ritual', '2026-10-19 13:30', null, null),
    ('durga-puja-2026-navami-havan', 'Navami · Havan', 'Navami', 'Havan', 'ritual', '2026-10-19 17:00', null, null),
    ('durga-puja-2026-navami-cultural-program', 'Navami · Cultural Program', 'Navami', 'Cultural Program', 'community', '2026-10-19 18:00', null, null),
    ('durga-puja-2026-dashami-pujo', 'Dashami Pujo', 'Dashami', 'Dashami Pujo', 'festival', '2026-10-20 10:00', null, null),
    ('durga-puja-2026-dashami-shantir-jal', 'Dashami · Shantir Jal', 'Dashami', 'Shantir Jal', 'ritual', '2026-10-20 14:00', null, null),
    ('durga-puja-2026-dashami-sindoor-khela', 'Dashami · Sindoor Khela', 'Dashami', 'Sindoor Khela', 'community', '2026-10-20 18:00', null, null)
), inserted as (
  insert into public.events (
    slug, title, description, short_summary, full_description,
    event_type, category, start_time, end_time, all_day, recurrence,
    recurrence_until, location, publish_status, visibility, is_public,
    is_rsvp_enabled, capacity, timezone, blocks_reservations
  )
  select
    slug,
    title,
    concat_ws(E'\n\n',
      format('%s during %s at Durga Bari, part of Durga Puja 2026 (October 16–20).', program, puja_day),
      notes,
      'Historical program transcribed from the original Durga Bari Durga Puja 2026 schedule. Times are San Jose local time (America/Los_Angeles). The original schedule noted that timings were subject to change according to tithi.'
    ),
    format('Durga Puja 2026 · %s · %s', puja_day, program),
    concat_ws(E'\n\n',
      format('%s during %s at Durga Bari, part of Durga Puja 2026 (October 16–20).', program, puja_day),
      notes,
      'Historical program transcribed from the original Durga Bari Durga Puja 2026 schedule. Times are San Jose local time (America/Los_Angeles). The original schedule noted that timings were subject to change according to tithi.'
    ),
    event_type,
    'Durga Puja 2026',
    local_start::timestamp at time zone 'America/Los_Angeles',
    local_end::timestamp at time zone 'America/Los_Angeles',
    false,
    null,
    null,
    'Durga Bari · 2350 Paragon Dr, San Jose, CA 95131',
    'published',
    'public',
    true,
    false,
    null,
    'America/Los_Angeles',
    false
  from schedule
  on conflict (slug) where slug is not null do nothing
  returning start_time, event_type
)
select
  count(*) as events_inserted,
  min(start_time at time zone 'America/Los_Angeles') as first_local_start,
  max(start_time at time zone 'America/Los_Angeles') as last_local_start,
  count(*) filter (where event_type = 'festival') as festival_programs,
  count(*) filter (where event_type = 'ritual') as ritual_programs,
  count(*) filter (where event_type = 'community') as cultural_programs
from inserted;
