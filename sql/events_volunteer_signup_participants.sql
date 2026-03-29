alter table public.event_volunteer_signups
  add column if not exists participant_name text;

alter table public.event_volunteer_signups
  add column if not exists participant_type text;

update public.event_volunteer_signups
set participant_name = coalesce(nullif(participant_name, ''), email)
where participant_name is null or participant_name = '';

update public.event_volunteer_signups
set participant_type = coalesce(participant_type, 'adult')
where participant_type is null;

alter table public.event_volunteer_signups
  alter column participant_name set not null;

alter table public.event_volunteer_signups
  alter column participant_type set not null;

alter table public.event_volunteer_signups
  drop constraint if exists event_volunteer_signups_participant_type_check;

alter table public.event_volunteer_signups
  add constraint event_volunteer_signups_participant_type_check
  check (participant_type in ('adult', 'child'));

alter table public.event_volunteer_signups
  drop constraint if exists event_volunteer_signups_slot_id_family_id_key;

alter table public.event_volunteer_signups
  drop constraint if exists event_volunteer_signups_slot_family_participant_key;

alter table public.event_volunteer_signups
  add constraint event_volunteer_signups_slot_family_participant_key
  unique (slot_id, family_id, participant_name);
