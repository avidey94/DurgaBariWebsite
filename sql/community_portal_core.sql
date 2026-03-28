create extension if not exists pgcrypto;

-- Family-centric identity model: exactly one login family account for now.
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  family_display_name text not null,
  primary_email text unique not null,
  phone_number text null,
  adults_count integer not null default 1 check (adults_count >= 0),
  adult_names text[] not null default '{}',
  children_count integer not null default 0 check (children_count >= 0),
  child_names text[] not null default '{}',
  founding_family_status text not null default 'not_founding'
    check (founding_family_status in ('not_founding', 'founding_active', 'founding_completed', 'founding_paused')),
  pledge_status text not null default 'none'
    check (pledge_status in ('none', 'active', 'completed', 'paused', 'cancelled')),
  active_donor_status text not null default 'none'
    check (active_donor_status in ('none', 'bronze', 'silver', 'gold')),
  requested_active_donor_status text null
    check (requested_active_donor_status in ('bronze', 'silver', 'gold')),
  requested_active_donor_at timestamptz null,
  active_donor_status_set_by_family_id uuid null references public.families (id) on delete set null,
  active_donor_status_set_at timestamptz null,
  source text not null default 'supabase'
    check (source in ('supabase', 'google_sheet', 'import')),
  legacy_sheet_row_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists families_primary_email_idx on public.families (primary_email);
create index if not exists families_auth_user_id_idx on public.families (auth_user_id);

create table if not exists public.family_roles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  role text not null check (role in ('super_admin', 'treasurer', 'event_manager', 'site_content_manager', 'membership_manager', 'member')),
  granted_by_family_id uuid null references public.families (id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (family_id, role)
);

create index if not exists family_roles_family_id_idx on public.family_roles (family_id);
create index if not exists family_roles_role_idx on public.family_roles (role);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  short_description text not null,
  full_description text not null,
  cover_image_url text null,
  funding_goal_cents bigint not null check (funding_goal_cents >= 0),
  status text not null default 'planned'
    check (status in ('planned', 'active', 'funded', 'completed', 'archived')),
  featured boolean not null default false,
  donor_visibility text not null default 'public'
    check (donor_visibility in ('public', 'members', 'hidden')),
  accept_anonymous boolean not null default true,
  is_public boolean not null default true,
  starts_at timestamptz null,
  ends_at timestamptz null,
  funded_at timestamptz null,
  completed_at timestamptz null,
  created_by_family_id uuid null references public.families (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_featured_idx on public.projects (featured);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  body text not null,
  is_published boolean not null default false,
  published_at timestamptz null,
  created_by_family_id uuid null references public.families (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_updates_project_id_idx on public.project_updates (project_id);
create index if not exists project_updates_published_idx on public.project_updates (is_published, published_at desc);

create table if not exists public.pledges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  program_code text not null default 'FOUNDING_2026',
  program_name text not null default 'Founding Family Pledge 2026-2028',
  monthly_commitment_cents integer not null default 10000 check (monthly_commitment_cents > 0),
  start_date date not null default date '2026-01-01',
  target_date date not null default date '2028-12-31',
  target_total_cents integer not null default 360000 check (target_total_cents > 0),
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, program_code)
);

create index if not exists pledges_family_id_idx on public.pledges (family_id);
create index if not exists pledges_program_code_idx on public.pledges (program_code);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete restrict,
  donation_type text not null check (donation_type in ('founding_pledge', 'project', 'general')),
  project_id uuid null references public.projects (id) on delete set null,
  amount_cents bigint not null check (amount_cents >= 0),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  recorded_by_family_id uuid null references public.families (id) on delete set null,
  payment_channel text not null default 'manual'
    check (payment_channel in ('manual', 'benevity', 'zelle', 'check', 'cash', 'bank_transfer', 'stripe', 'other')),
  external_reference text null,
  is_anonymous boolean not null default false,
  visibility text not null default 'public' check (visibility in ('public', 'members', 'private')),
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (donation_type = 'project' and project_id is not null)
    or (donation_type <> 'project' and project_id is null)
  )
);

create index if not exists donations_family_id_idx on public.donations (family_id, occurred_at desc);
create index if not exists donations_project_id_idx on public.donations (project_id, occurred_at desc);
create index if not exists donations_type_idx on public.donations (donation_type, occurred_at desc);

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

-- Shared helper function to keep updated_at current.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Recreate triggers safely.
drop trigger if exists trg_families_updated_at on public.families;
create trigger trg_families_updated_at
before update on public.families
for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_project_updates_updated_at on public.project_updates;
create trigger trg_project_updates_updated_at
before update on public.project_updates
for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_pledges_updated_at on public.pledges;
create trigger trg_pledges_updated_at
before update on public.pledges
for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_donations_updated_at on public.donations;
create trigger trg_donations_updated_at
before update on public.donations
for each row execute function public.tg_set_updated_at();

-- RLS helper functions.
create or replace function public.current_family_id()
returns uuid
language sql
stable
as $$
  select id from public.families where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.has_family_role(target_role text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.family_roles fr
    where fr.family_id = public.current_family_id()
      and fr.role = target_role
  );
$$;

-- Derived views.
create or replace view public.project_funding_totals_v as
select
  p.id as project_id,
  coalesce(sum(d.amount_cents), 0)::bigint as funded_amount_cents,
  case
    when p.funding_goal_cents <= 0 then 0
    else least(100, round((coalesce(sum(d.amount_cents), 0)::numeric / p.funding_goal_cents::numeric) * 100, 2))
  end as percent_funded
from public.projects p
left join public.donations d
  on d.project_id = p.id
 and d.donation_type = 'project'
group by p.id, p.funding_goal_cents;

create or replace view public.family_founding_pledge_progress_v as
with pledge_rows as (
  select
    p.id,
    p.family_id,
    p.program_code,
    p.start_date,
    p.target_date,
    p.monthly_commitment_cents,
    p.target_total_cents,
    p.status,
    least(current_date, p.target_date) as as_of_date
  from public.pledges p
  where p.program_code = 'FOUNDING_2026'
),
progress_base as (
  select
    pr.*,
    case
      when pr.as_of_date < pr.start_date then 0
      else (
        (date_part('year', age(pr.as_of_date, pr.start_date))::int * 12)
        + date_part('month', age(pr.as_of_date, pr.start_date))::int
        + 1
      )
    end as elapsed_months,
    coalesce(sum(case when d.donation_type = 'founding_pledge' then d.amount_cents else 0 end), 0)::bigint as total_donated_cents
  from pledge_rows pr
  left join public.donations d on d.family_id = pr.family_id
  group by
    pr.id,
    pr.family_id,
    pr.program_code,
    pr.start_date,
    pr.target_date,
    pr.monthly_commitment_cents,
    pr.target_total_cents,
    pr.status,
    pr.as_of_date
)
select
  pb.id as pledge_id,
  pb.family_id,
  pb.program_code,
  pb.status,
  pb.as_of_date,
  pb.total_donated_cents,
  least(pb.target_total_cents::bigint, (pb.elapsed_months::bigint * pb.monthly_commitment_cents::bigint)) as target_donated_by_now_cents,
  greatest(0::bigint, pb.target_total_cents::bigint - pb.total_donated_cents) as remaining_balance_cents,
  case
    when pb.target_total_cents <= 0 then 0
    else least(100, round((pb.total_donated_cents::numeric / pb.target_total_cents::numeric) * 100, 2))
  end as progress_percent,
  case
    when pb.total_donated_cents > least(pb.target_total_cents::bigint, (pb.elapsed_months::bigint * pb.monthly_commitment_cents::bigint)) then 'ahead'
    when pb.total_donated_cents = least(pb.target_total_cents::bigint, (pb.elapsed_months::bigint * pb.monthly_commitment_cents::bigint)) then 'on_track'
    else 'behind'
  end as progress_status
from progress_base pb;

alter table public.families enable row level security;
alter table public.family_roles enable row level security;
alter table public.projects enable row level security;
alter table public.project_updates enable row level security;
alter table public.pledges enable row level security;
alter table public.donations enable row level security;
alter table public.donation_audit_events enable row level security;

-- Families policies.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'families' and policyname = 'families_select_own_or_admin'
  ) then
    create policy families_select_own_or_admin on public.families
      for select
      using (
        id = public.current_family_id()
        or public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'families' and policyname = 'families_update_own_or_super_admin'
  ) then
    create policy families_update_own_or_super_admin on public.families
      for update
      using (
        id = public.current_family_id()
        or public.has_family_role('super_admin')
      )
      with check (
        id = public.current_family_id()
        or public.has_family_role('super_admin')
      );
  end if;
end $$;

-- Donation audit policies.
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

-- Family roles policies.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'family_roles' and policyname = 'family_roles_select_own_or_super_admin'
  ) then
    create policy family_roles_select_own_or_super_admin on public.family_roles
      for select
      using (
        family_id = public.current_family_id()
        or public.has_family_role('super_admin')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'family_roles' and policyname = 'family_roles_manage_super_admin_only'
  ) then
    create policy family_roles_manage_super_admin_only on public.family_roles
      for all
      using (public.has_family_role('super_admin'))
      with check (public.has_family_role('super_admin'));
  end if;
end $$;

-- Projects policies.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_public_read'
  ) then
    create policy projects_public_read on public.projects
      for select
      using (is_public = true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_manage_finance_admin'
  ) then
    create policy projects_manage_finance_admin on public.projects
      for all
      using (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      )
      with check (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;
end $$;

-- Project updates policies.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'project_updates' and policyname = 'project_updates_public_published_read'
  ) then
    create policy project_updates_public_published_read on public.project_updates
      for select
      using (is_published = true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'project_updates' and policyname = 'project_updates_manage_admin'
  ) then
    create policy project_updates_manage_admin on public.project_updates
      for all
      using (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
        or public.has_family_role('event_manager')
      )
      with check (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
        or public.has_family_role('event_manager')
      );
  end if;
end $$;

-- Pledges policies.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'pledges' and policyname = 'pledges_select_own_or_finance_admin'
  ) then
    create policy pledges_select_own_or_finance_admin on public.pledges
      for select
      using (
        family_id = public.current_family_id()
        or public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'pledges' and policyname = 'pledges_manage_finance_admin'
  ) then
    create policy pledges_manage_finance_admin on public.pledges
      for all
      using (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      )
      with check (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;
end $$;

-- Donations policies.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'donations' and policyname = 'donations_select_own_or_finance_admin'
  ) then
    create policy donations_select_own_or_finance_admin on public.donations
      for select
      using (
        family_id = public.current_family_id()
        or public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'donations' and policyname = 'donations_insert_own_or_finance_admin'
  ) then
    create policy donations_insert_own_or_finance_admin on public.donations
      for insert
      with check (
        family_id = public.current_family_id()
        or public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'donations' and policyname = 'donations_update_finance_admin'
  ) then
    create policy donations_update_finance_admin on public.donations
      for update
      using (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      )
      with check (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;
end $$;
