alter table public.families
  add column if not exists active_donor_status text not null default 'none';

alter table public.families
  add column if not exists requested_active_donor_status text null;

alter table public.families
  add column if not exists requested_active_donor_at timestamptz null;

alter table public.families
  add column if not exists active_donor_status_set_by_family_id uuid null references public.families (id) on delete set null;

alter table public.families
  add column if not exists active_donor_status_set_at timestamptz null;

alter table public.families
  drop constraint if exists families_active_donor_status_check;

alter table public.families
  add constraint families_active_donor_status_check
  check (active_donor_status in ('none', 'bronze', 'silver', 'gold'));

alter table public.families
  drop constraint if exists families_requested_active_donor_status_check;

alter table public.families
  add constraint families_requested_active_donor_status_check
  check (requested_active_donor_status in ('bronze', 'silver', 'gold'));
