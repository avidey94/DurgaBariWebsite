alter table public.donations
  drop constraint if exists donations_donation_type_check;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'donations'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%donation_type in%'
  loop
    execute format('alter table public.donations drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.donations
  add constraint donations_donation_type_check
  check (donation_type in ('founding_pledge', 'project', 'general', 'active_donor_bronze', 'active_donor_silver', 'active_donor_gold'));
