# Community Portal V2 Plan

## 1) Implementation plan

### Phase 0: foundation and safety
- Add Supabase schema for families, roles, pledges, projects, donations, project updates.
- Add role helpers and RLS helper functions.
- Keep existing events/CMS tables untouched.

### Phase 1: domain contracts (no behavior break)
- Add portal-specific TypeScript domain types.
- Add role permission map for UI and API route guards.
- Add payment provider abstraction with a placeholder/manual provider.

### Phase 2: read-path migration
- Add Supabase-backed read APIs for family dashboard, donations, projects.
- Keep Sheets provider available behind a feature flag during validation.
- Add parity checks for totals (sheet vs Supabase) for a temporary migration window.

### Phase 3: admin workflows
- Add super_admin user/family/role management pages.
- Add treasurer reconciliation UI for donation classification and edits.
- Add event_manager-scoped event tools (reuse existing events stack).

### Phase 4: payments and ingestion
- Implement payment intent abstraction endpoint; keep provider-agnostic storage.
- Add import scripts from Google Sheets to Supabase ledger tables.
- Retire Sheets from runtime reads after parity sign-off.

## 2) Data model

### Core entities
- `families`: one login/account per family, household metadata, founding/pledge status.
- `family_roles`: role grants per family (`super_admin`, `treasurer`, `event_manager`, `member`).
- `pledges`: one family can have pledge program records (starting with `FOUNDING_2026`).
- `projects`: public/member-facing funding projects.
- `project_updates`: optional updates attached to projects.
- `donations`: immutable financial ledger; category via `donation_type`.

### Store vs derive
- Stored:
- Family profile fields, pledge definitions, donation ledger rows, project metadata.
- Derived:
- `funded_amount`, `percent_funded`, founding pledge progress (`total_by_now`, `remaining`, status).
- Do not store aggregate rollups as free-text.

## 3) RBAC model

### Roles
- `super_admin`: full system control.
- `treasurer`: full financial control, read all families.
- `event_manager`: events/RSVP/content related to events only.
- `member`: own family data only.

### Authority split
- Financial authority (`treasurer`) is separate from event/content authority (`event_manager`).
- Role assignment authority is only `super_admin`.

## 4) RLS strategy

### Helper functions
- `current_family_id()` resolves `auth.uid()` to family row.
- `has_family_role(role)` checks role grants.

### Policies (high level)
- `families`:
- Members can read own row.
- Treasurers and super admins can read all.
- Members can update own row (final field-level constraints should be applied via API layer).
- `family_roles`:
- Only super_admin can manage grants.
- Families can view own role grants.
- `pledges`, `donations`:
- Members can read own.
- Treasurer and super_admin can read/write all financial records.
- `projects`, `project_updates`:
- Public read for published/public content.
- Treasurer + super_admin manage projects; event_manager can optionally manage event-linked announcements only.

## 5) Page architecture

### Public
- `/projects`: funding list, featured projects, CTA.
- `/projects/[slug]`: project details, progress, updates, donor wall.

### Member portal
- `/portal`: family dashboard summary.
- `/portal/family`: household profile (adults/children, basics).
- `/portal/pledge`: founding pledge progress and history.
- `/portal/donations`: ledger history and receipts/status.
- `/portal/projects`: open projects with donate entry points.

### Admin
- `/admin` (role-aware landing).
- `/admin/families` (super_admin + treasurer read; super_admin manage).
- `/admin/roles` (super_admin only).
- `/admin/donations` (treasurer + super_admin).
- `/admin/projects` (treasurer + super_admin).
- `/admin/events` (event_manager + super_admin; existing events manager can be adapted).

## 6) Migration map (sheet -> Supabase)

### Current sheet fields mapped
- `Email` -> `families.primary_email` (and `families.auth_user_id` linked by login email).
- `Name` -> `families.family_display_name`.
- `isAdmin` -> `family_roles.role`:
- `yes` maps to `super_admin` or `treasurer` by manual curation list during migration.
- `Donation`/`Date`/`Paid Via` multiline rows -> multiple `donations` rows.
- `Mon-YYYY` paid markers -> historical `donations` or `family_dues_status` entries (optional) after reconciliation.
- `foundingFamily` (currently implicit) -> explicit `families.founding_family_status` + `pledges` row.

### Data migration sequence
- Import families first.
- Import role grants.
- Import pledge records for founding families.
- Import donation ledger with provenance metadata (`import_batch_id`, sheet source row).
- Run verification reports and sign-off before runtime cutover.

## 7) Payment abstraction

- Introduce provider-neutral payment intent contract:
- `createIntent`, `getIntent`, `markCompleted`, `markFailed`, metadata support.
- Store completed funds only in `donations` ledger.
- Keep provider field (`manual`, `benevity`, `stripe`, `other`) to support future adapters.

## 8) UX recommendations

### Family dashboard
- Top cards: total donated, target by now, remaining, status (ahead/on-track/behind).
- Progress bar tied to founding pledge target and current date.
- Recent donations list + quick donate actions.

### Project detail page
- Cover, goal, funded amount, percent funded, supporter count.
- Donate CTA with amount presets and anonymous toggle.
- Updates timeline below funding module.

### Treasurer dashboard
- Reconciliation queue, uncategorized payments, monthly inflow summary.
- Filters by donation type, family, date range, project.
- Edit audit trail visible for corrections.

### Role-aware navigation
- Show menu groups only for granted role scopes.
- Keep one top-level `/admin` entry but route to role-specific panels.

## 9) Compatibility with current system

- Keep existing events + RSVP + CMS stack unchanged.
- Introduce new portal domain incrementally.
- Temporarily use sheet lookup fallback only where required for migration parity checks.
