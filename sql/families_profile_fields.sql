-- Add profile-management fields for family admin editing.

alter table public.families
  add column if not exists phone_number text null,
  add column if not exists adult_names text[] not null default '{}',
  add column if not exists child_names text[] not null default '{}';
