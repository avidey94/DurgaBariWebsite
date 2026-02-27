create extension if not exists pgcrypto;

create table if not exists public.page_content (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text,
  content_html text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

alter table public.page_content enable row level security;

-- Public read, write only via server-side service role key.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'page_content' and policyname = 'page_content_public_read'
  ) then
    create policy page_content_public_read on public.page_content
      for select
      using (true);
  end if;
end $$;
