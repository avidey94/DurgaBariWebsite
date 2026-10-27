-- A published event can reserve the space, regardless of who may view its details.
-- Existing events start as informational because their end times were optional.
alter table public.events
  add column if not exists blocks_reservations boolean not null default false;

create index if not exists events_calendar_space_idx
  on public.events (start_time, publish_status)
  where blocks_reservations = true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_space_block_has_end'
  ) then
    alter table public.events
      add constraint events_space_block_has_end
      check (not blocks_reservations or (end_time is not null and end_time > start_time));
  end if;
end $$;
