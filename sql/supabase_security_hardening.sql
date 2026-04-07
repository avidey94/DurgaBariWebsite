-- Supabase security hardening patch
-- Apply this after the existing schema scripts to resolve Security Advisor issues
-- and reduce direct database exposure through the public schema.

create extension if not exists pgcrypto;

-- Lock helper functions to a fixed search_path and run role lookups as the
-- function owner so RLS policies can safely depend on them.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select f.id
  from public.families f
  where f.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.has_family_role(target_role text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.families f
    join public.family_roles fr on fr.family_id = f.id
    where f.auth_user_id = auth.uid()
      and fr.role = target_role
  );
$$;

-- Force views to use the caller's permissions and RLS instead of the owner.
alter view public.project_funding_totals_v
  set (security_invoker = true);

alter view public.family_founding_pledge_progress_v
  set (security_invoker = true);

-- The public site reads current page content through server-side routes.
-- Historical CMS versions should not be publicly readable from Supabase.
drop policy if exists page_content_versions_public_read on public.page_content_versions;
drop policy if exists page_content_versions_read_cms_admin on public.page_content_versions;

create policy page_content_versions_read_cms_admin on public.page_content_versions
  for select
  to authenticated
  using (
    public.has_family_role('super_admin')
    or public.has_family_role('site_content_manager')
  );

-- Exposed event tables were missing RLS entirely.
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.event_volunteer_slots enable row level security;
alter table public.event_volunteer_signups enable row level security;

drop policy if exists events_public_read on public.events;
drop policy if exists events_authenticated_member_read on public.events;
drop policy if exists events_manage_event_admin on public.events;

create policy events_public_read on public.events
  for select
  to anon
  using (
    publish_status = 'published'
    and visibility = 'public'
  );

create policy events_authenticated_member_read on public.events
  for select
  to authenticated
  using (
    publish_status = 'published'
    and visibility in ('public', 'members')
  );

create policy events_manage_event_admin on public.events
  for all
  to authenticated
  using (
    public.has_family_role('super_admin')
    or public.has_family_role('event_manager')
  )
  with check (
    public.has_family_role('super_admin')
    or public.has_family_role('event_manager')
  );

drop policy if exists event_rsvps_select_own on public.event_rsvps;
drop policy if exists event_rsvps_insert_own on public.event_rsvps;
drop policy if exists event_rsvps_update_own on public.event_rsvps;
drop policy if exists event_rsvps_manage_event_admin on public.event_rsvps;

create policy event_rsvps_select_own on public.event_rsvps
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.events e
      where e.id = event_rsvps.event_id
        and e.publish_status = 'published'
        and e.visibility in ('public', 'members')
    )
  );

create policy event_rsvps_insert_own on public.event_rsvps
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.events e
      where e.id = event_rsvps.event_id
        and e.publish_status = 'published'
        and e.visibility in ('public', 'members')
        and e.is_rsvp_enabled = true
    )
  );

create policy event_rsvps_update_own on public.event_rsvps
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.events e
      where e.id = event_rsvps.event_id
        and e.publish_status = 'published'
        and e.visibility in ('public', 'members')
        and e.is_rsvp_enabled = true
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.events e
      where e.id = event_rsvps.event_id
        and e.publish_status = 'published'
        and e.visibility in ('public', 'members')
        and e.is_rsvp_enabled = true
    )
  );

create policy event_rsvps_manage_event_admin on public.event_rsvps
  for all
  to authenticated
  using (
    public.has_family_role('super_admin')
    or public.has_family_role('event_manager')
  )
  with check (
    public.has_family_role('super_admin')
    or public.has_family_role('event_manager')
  );

drop policy if exists event_volunteer_slots_select_member_events on public.event_volunteer_slots;
drop policy if exists event_volunteer_slots_manage_event_admin on public.event_volunteer_slots;

create policy event_volunteer_slots_select_member_events on public.event_volunteer_slots
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_volunteer_slots.event_id
        and e.publish_status = 'published'
        and e.visibility in ('public', 'members')
    )
  );

create policy event_volunteer_slots_manage_event_admin on public.event_volunteer_slots
  for all
  to authenticated
  using (
    public.has_family_role('super_admin')
    or public.has_family_role('event_manager')
  )
  with check (
    public.has_family_role('super_admin')
    or public.has_family_role('event_manager')
  );

drop policy if exists event_volunteer_signups_select_own_family on public.event_volunteer_signups;
drop policy if exists event_volunteer_signups_insert_own_family on public.event_volunteer_signups;
drop policy if exists event_volunteer_signups_update_own_family on public.event_volunteer_signups;
drop policy if exists event_volunteer_signups_manage_event_admin on public.event_volunteer_signups;

create policy event_volunteer_signups_select_own_family on public.event_volunteer_signups
  for select
  to authenticated
  using (
    family_id = public.current_family_id()
    and exists (
      select 1
      from public.events e
      where e.id = event_volunteer_signups.event_id
        and e.publish_status = 'published'
        and e.visibility in ('public', 'members')
    )
  );

create policy event_volunteer_signups_insert_own_family on public.event_volunteer_signups
  for insert
  to authenticated
  with check (
    family_id = public.current_family_id()
    and user_id = auth.uid()
    and exists (
      select 1
      from public.event_volunteer_slots s
      join public.events e on e.id = s.event_id
      where s.id = event_volunteer_signups.slot_id
        and s.event_id = event_volunteer_signups.event_id
        and s.slot_state = 'open'
        and s.start_time > now()
        and e.publish_status = 'published'
        and e.visibility in ('public', 'members')
    )
  );

create policy event_volunteer_signups_update_own_family on public.event_volunteer_signups
  for update
  to authenticated
  using (
    family_id = public.current_family_id()
    and exists (
      select 1
      from public.event_volunteer_slots s
      join public.events e on e.id = s.event_id
      where s.id = event_volunteer_signups.slot_id
        and s.event_id = event_volunteer_signups.event_id
        and s.start_time > now()
        and e.publish_status = 'published'
        and e.visibility in ('public', 'members')
    )
  )
  with check (
    family_id = public.current_family_id()
    and user_id = auth.uid()
    and exists (
      select 1
      from public.event_volunteer_slots s
      join public.events e on e.id = s.event_id
      where s.id = event_volunteer_signups.slot_id
        and s.event_id = event_volunteer_signups.event_id
        and s.start_time > now()
        and e.publish_status = 'published'
        and e.visibility in ('public', 'members')
    )
  );

create policy event_volunteer_signups_manage_event_admin on public.event_volunteer_signups
  for all
  to authenticated
  using (
    public.has_family_role('super_admin')
    or public.has_family_role('event_manager')
  )
  with check (
    public.has_family_role('super_admin')
    or public.has_family_role('event_manager')
  );
