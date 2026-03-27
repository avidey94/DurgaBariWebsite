create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_type text not null check (expense_type in ('operations', 'event', 'maintenance', 'utilities', 'supplies', 'marketing', 'professional_services', 'insurance', 'technology', 'other')),
  project_id uuid null references public.projects (id) on delete set null,
  vendor_name text not null,
  description text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  expense_status text not null default 'submitted'
    check (expense_status in ('draft', 'submitted', 'approved', 'paid', 'reimbursed', 'cancelled')),
  payment_method text not null default 'manual'
    check (payment_method in ('manual', 'ach', 'check', 'cash', 'card', 'zelle', 'bank_transfer', 'other')),
  incurred_at timestamptz not null,
  due_at timestamptz null,
  paid_at timestamptz null,
  receipt_url text null,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  recorded_by_family_id uuid null references public.families (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_incurred_at_idx on public.expenses (incurred_at desc);
create index if not exists expenses_status_idx on public.expenses (expense_status, incurred_at desc);
create index if not exists expenses_type_idx on public.expenses (expense_type, incurred_at desc);
create index if not exists expenses_project_id_idx on public.expenses (project_id, incurred_at desc);
create index if not exists expenses_vendor_name_idx on public.expenses (vendor_name);

create table if not exists public.expense_audit_events (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete restrict,
  event_type text not null check (event_type in ('create', 'update')),
  changed_at timestamptz not null default now(),
  changed_by_family_id uuid null references public.families (id) on delete set null,
  changed_by_email text null,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists expense_audit_events_expense_id_idx
  on public.expense_audit_events (expense_id, changed_at desc);

alter table public.expenses enable row level security;
alter table public.expense_audit_events enable row level security;

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
before update on public.expenses
for each row execute function public.tg_set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'expenses_select_finance_admin'
  ) then
    create policy expenses_select_finance_admin on public.expenses
      for select
      using (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'expenses_insert_finance_admin'
  ) then
    create policy expenses_insert_finance_admin on public.expenses
      for insert
      with check (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'expenses_update_finance_admin'
  ) then
    create policy expenses_update_finance_admin on public.expenses
      for update
      using (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      )
      with check (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expense_audit_events' and policyname = 'expense_audit_events_select_finance_admin'
  ) then
    create policy expense_audit_events_select_finance_admin on public.expense_audit_events
      for select
      using (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expense_audit_events' and policyname = 'expense_audit_events_insert_finance_admin'
  ) then
    create policy expense_audit_events_insert_finance_admin on public.expense_audit_events
      for insert
      with check (
        public.has_family_role('super_admin')
        or public.has_family_role('treasurer')
      );
  end if;
end $$;
