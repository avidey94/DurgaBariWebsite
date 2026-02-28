create extension if not exists pgcrypto;

create table if not exists public.page_content_versions (
  id uuid primary key default gen_random_uuid(),
  page_content_id uuid null references public.page_content(id) on delete set null,
  slug text not null,
  title text,
  content_html text not null,
  created_at timestamptz not null default now(),
  created_by uuid null
);

create index if not exists page_content_versions_slug_created_at_idx
  on public.page_content_versions (slug, created_at desc);

alter table public.page_content_versions enable row level security;

-- Public read, write only via server-side service role key.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'page_content_versions' and policyname = 'page_content_versions_public_read'
  ) then
    create policy page_content_versions_public_read on public.page_content_versions
      for select
      using (true);
  end if;
end $$;
