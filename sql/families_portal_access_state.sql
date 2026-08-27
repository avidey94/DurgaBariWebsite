alter table public.families
  add column if not exists portal_access_state text;

update public.families
set portal_access_state = 'approved'
where portal_access_state is null;

alter table public.families
  alter column portal_access_state set default 'pending';

alter table public.families
  alter column portal_access_state set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'families_portal_access_state_check'
  ) then
    alter table public.families
      add constraint families_portal_access_state_check
      check (portal_access_state in ('pending', 'approved', 'suspended'));
  end if;
end $$;

create index if not exists families_portal_access_state_idx
  on public.families (portal_access_state);

create or replace function public.has_approved_portal_access()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.families f
    where f.auth_user_id = auth.uid()
      and (
        f.portal_access_state = 'approved'
        or exists (
          select 1
          from public.family_roles fr
          where fr.family_id = f.id
            and fr.role in ('super_admin', 'treasurer', 'event_manager', 'site_content_manager', 'membership_manager')
        )
      )
  );
$$;

drop policy if exists events_authenticated_member_read on public.events;
create policy events_authenticated_member_read on public.events
  for select
  to authenticated
  using (
    publish_status = 'published'
    and (
      visibility = 'public'
      or (
        visibility = 'members'
        and public.has_approved_portal_access()
      )
    )
  );

drop policy if exists event_rsvps_select_own on public.event_rsvps;
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
        and (
          e.visibility = 'public'
          or (e.visibility = 'members' and public.has_approved_portal_access())
        )
    )
  );

drop policy if exists event_rsvps_insert_own on public.event_rsvps;
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
        and e.is_rsvp_enabled = true
        and (
          e.visibility = 'public'
          or (e.visibility = 'members' and public.has_approved_portal_access())
        )
    )
  );

drop policy if exists event_rsvps_update_own on public.event_rsvps;
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
        and e.is_rsvp_enabled = true
        and (
          e.visibility = 'public'
          or (e.visibility = 'members' and public.has_approved_portal_access())
        )
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.events e
      where e.id = event_rsvps.event_id
        and e.publish_status = 'published'
        and e.is_rsvp_enabled = true
        and (
          e.visibility = 'public'
          or (e.visibility = 'members' and public.has_approved_portal_access())
        )
    )
  );

drop policy if exists event_volunteer_slots_select_member_events on public.event_volunteer_slots;
create policy event_volunteer_slots_select_member_events on public.event_volunteer_slots
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_volunteer_slots.event_id
        and e.publish_status = 'published'
        and (
          e.visibility = 'public'
          or (e.visibility = 'members' and public.has_approved_portal_access())
        )
    )
  );

drop policy if exists event_volunteer_signups_select_own_family on public.event_volunteer_signups;
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
        and (
          e.visibility = 'public'
          or (e.visibility = 'members' and public.has_approved_portal_access())
        )
    )
  );

drop policy if exists event_volunteer_signups_insert_own_family on public.event_volunteer_signups;
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
        and (
          e.visibility = 'public'
          or (e.visibility = 'members' and public.has_approved_portal_access())
        )
    )
  );

drop policy if exists event_volunteer_signups_update_own_family on public.event_volunteer_signups;
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
        and (
          e.visibility = 'public'
          or (e.visibility = 'members' and public.has_approved_portal_access())
        )
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
        and (
          e.visibility = 'public'
          or (e.visibility = 'members' and public.has_approved_portal_access())
        )
    )
  );
