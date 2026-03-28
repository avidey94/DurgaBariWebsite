alter table public.families
  add column if not exists profile_completed boolean;

update public.families
set profile_completed = true
where profile_completed is null;

alter table public.families
  alter column profile_completed set default false;

alter table public.families
  alter column profile_completed set not null;

create index if not exists families_profile_completed_idx on public.families (profile_completed);
