create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  location text null,
  start_time timestamptz not null,
  end_time timestamptz null,
  is_public boolean not null default true,
  is_rsvp_enabled boolean not null default true,
  capacity integer null check (capacity is null or capacity > 0),
  form_schema jsonb null,
  created_at timestamptz not null default now(),
  created_by uuid null,
  updated_at timestamptz not null default now()
);

create index if not exists events_start_time_idx on public.events (start_time);
create index if not exists events_is_public_idx on public.events (is_public);
create index if not exists events_is_rsvp_enabled_idx on public.events (is_rsvp_enabled);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null,
  email text not null,
  status text not null check (status in ('going', 'not_going', 'maybe')),
  headcount integer not null default 1 check (headcount >= 0),
  answers jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists event_rsvps_event_id_idx on public.event_rsvps (event_id);
create index if not exists event_rsvps_user_id_idx on public.event_rsvps (user_id);
create index if not exists event_rsvps_event_id_status_idx on public.event_rsvps (event_id, status);
