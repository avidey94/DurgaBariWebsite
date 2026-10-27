-- Booking requests are written only by authenticated server routes using the service role.
-- Zeffy payments are verified by staff before approval.
create table if not exists public.event_reservations (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  event_title text not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  contact_phone text,
  notes text,
  include_priest boolean not null default false,
  include_havan boolean not null default false,
  price_usd integer not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'declined')),
  payment_reference text,
  payment_verified_at timestamptz,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_reservations_duration_check check (
    end_time > start_time and end_time - start_time <= interval '6 hours'
  ),
  constraint event_reservations_price_check check (
    price_usd = 101 + (case when include_priest then 201 else 0 end)
                    + (case when include_havan then 50 else 0 end)
  ),
  constraint event_reservations_approval_payment_check check (
    status <> 'approved' or (payment_reference is not null and payment_verified_at is not null)
  ),
  constraint event_reservations_approved_no_overlap exclude using gist (
    tsrange(event_date + start_time, event_date + end_time, '[)') with &&
  ) where (status = 'approved')
);

create index if not exists event_reservations_user_created_idx
  on public.event_reservations (auth_user_id, created_at desc);
create index if not exists event_reservations_date_status_idx
  on public.event_reservations (event_date, status);

alter table public.event_reservations enable row level security;
