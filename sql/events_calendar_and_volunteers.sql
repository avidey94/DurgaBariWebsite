create extension if not exists pgcrypto;

alter table public.events
  add column if not exists slug text;
alter table public.events
  add column if not exists short_summary text;
alter table public.events
  add column if not exists full_description text;
alter table public.events
  add column if not exists event_type text not null default 'special';
alter table public.events
  add column if not exists category text not null default 'community';
alter table public.events
  add column if not exists all_day boolean not null default false;
alter table public.events
  add column if not exists recurrence jsonb;
alter table public.events
  add column if not exists recurrence_until timestamptz;
alter table public.events
  add column if not exists cover_image_url text;
alter table public.events
  add column if not exists publish_status text not null default 'draft';
alter table public.events
  add column if not exists visibility text not null default 'public';
alter table public.events
  add column if not exists cta_text text;
alter table public.events
  add column if not exists volunteer_notes text;
alter table public.events
  add column if not exists max_volunteer_count integer;
alter table public.events
  add column if not exists timezone text not null default 'America/Los_Angeles';

do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'events_slug_unique_idx'
  ) then
    create unique index events_slug_unique_idx on public.events (slug) where slug is not null;
  end if;
end $$;

alter table public.events
  drop constraint if exists events_publish_status_check;
alter table public.events
  add constraint events_publish_status_check
  check (publish_status in ('draft', 'published', 'archived'));

alter table public.events
  drop constraint if exists events_visibility_check;
alter table public.events
  add constraint events_visibility_check
  check (visibility in ('public', 'members', 'private'));

alter table public.events
  drop constraint if exists events_event_type_check;
alter table public.events
  add constraint events_event_type_check
  check (event_type in ('darshan', 'ritual', 'festival', 'community', 'volunteer', 'special'));

create table if not exists public.event_volunteer_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  capacity integer not null default 1 check (capacity > 0),
  notes text,
  sort_order integer not null default 0,
  slot_state text not null default 'open' check (slot_state in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_volunteer_slots_event_id_idx on public.event_volunteer_slots (event_id, start_time);

create table if not exists public.event_volunteer_signups (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.event_volunteer_slots (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null,
  email text not null,
  participant_name text not null,
  participant_type text not null default 'adult' check (participant_type in ('adult', 'child')),
  signup_status text not null default 'confirmed' check (signup_status in ('confirmed', 'cancelled')),
  signed_up_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slot_id, family_id, participant_name)
);

create index if not exists event_volunteer_signups_event_id_idx on public.event_volunteer_signups (event_id);
create index if not exists event_volunteer_signups_slot_id_idx on public.event_volunteer_signups (slot_id);
create index if not exists event_volunteer_signups_family_id_idx on public.event_volunteer_signups (family_id);
