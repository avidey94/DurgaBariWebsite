-- Allow $0 donation line-items and add an immutable audit trail for create/update events.

alter table public.donations drop constraint if exists donations_amount_cents_check;
alter table public.donations
  add constraint donations_amount_cents_check check (amount_cents >= 0);

create table if not exists public.donation_audit_events (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations (id) on delete restrict,
  event_type text not null check (event_type in ('create', 'update')),
  changed_at timestamptz not null default now(),
  changed_by_family_id uuid null references public.families (id) on delete set null,
  changed_by_email text null,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists donation_audit_events_donation_id_idx
  on public.donation_audit_events (donation_id, changed_at desc);

alter table public.donation_audit_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'donation_audit_events' and policyname = 'donation_audit_events_select_finance_admin'
  ) then
    create policy donation_audit_events_select_finance_admin on public.donation_audit_events
      for select
      using (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'donation_audit_events' and policyname = 'donation_audit_events_insert_finance_admin'
  ) then
    create policy donation_audit_events_insert_finance_admin on public.donation_audit_events
      for insert
      with check (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;
end $$;
