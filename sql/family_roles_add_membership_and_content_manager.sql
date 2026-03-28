alter table public.family_roles
  drop constraint if exists family_roles_role_check;

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
      and t.relname = 'family_roles'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%role in%'
  loop
    execute format('alter table public.family_roles drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.family_roles
  add constraint family_roles_role_check
  check (role in ('super_admin', 'treasurer', 'event_manager', 'site_content_manager', 'membership_manager', 'member'));
