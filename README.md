# Durgabari Donation Portal

Production-grade minimal scaffold for a nonprofit donation portal using Next.js App Router, Tailwind, Supabase auth integration points, pluggable data providers, and Stripe-ready payment scaffolding.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase auth integration points (magic link + password)
- Provider architecture for finance data
- Mock provider enabled by default (no external accounts required)

## Quick Start (Local, No Accounts Required)

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Keep default local-friendly values in `.env.local`:

- `DATA_PROVIDER=mock`
- `DEV_LOGIN_EMAIL=ananya@example.org` (or your own email)

4. Run the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

- `/portal` works immediately using mock data + dev auth bypass
- `/admin` is available if your effective user email is in `ADMIN_EMAILS`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run format
npm run format:check
```

## Routes

### Pages

- `/` public homepage
- `/login` auth UI (magic link + password + dev bypass notice)
- `/portal` member portal
- `/admin` admin-only family search/list

### API

- `GET /api/donations` current user donation records
- `GET /api/admin/families?q=...` admin-only list/search
- `POST /api/auth/login` supabase auth entrypoint (magic link/password)
- `POST /api/auth/logout` clears session cookie
- `POST /api/payments/checkout` Stripe checkout scaffold endpoint

## Architecture

### Auth and RBAC

- Local bypass: `DEV_LOGIN_EMAIL` (if set, auth is bypassed in server checks)
- Session cookie fallback: `durgabari_portal_email`
- Admin role rule: user is admin if `email ∈ ADMIN_EMAILS` (comma-separated env var)

### Data Providers

`lib/data/provider.ts` defines a provider interface:

- `MockProvider` (default): reads from `data/mock-families.json`
- `GoogleSheetsProvider` (stub): env-wired but intentionally unimplemented today

Provider selection:

- `DATA_PROVIDER=mock` (default)
- `DATA_PROVIDER=google-sheets` (later)

### Stripe Integration Points

- `lib/payments/stripe.ts` contains checkout service contract + stub
- `/api/payments/checkout` is wired for request validation and future Stripe session creation

## Connect Supabase Later

1. Create Supabase project.
2. Add values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Disable dev bypass for real auth testing:

```bash
DEV_LOGIN_EMAIL=
```

4. In Supabase auth settings, set redirect URL(s), e.g.:

- `http://localhost:3000/login`
- your future production URL login page

## Connect Google Sheets Later

1. Set `DATA_PROVIDER=google-sheets`.
2. Add:

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_CLIENT_EMAIL=...
GOOGLE_SHEETS_PRIVATE_KEY=...
```

3. Implement methods in `lib/data/google-sheets-provider.ts` to map rows into `FamilyProfile`.

## Add Stripe Later

1. Add env vars:

```bash
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

2. Implement real session creation in `lib/payments/stripe.ts`.
3. Add webhook route for recurring updates if needed.

## Deploy to Vercel Later

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import project in Vercel.
3. Set all required env vars in Vercel Project Settings.
4. Deploy.

Recommended production defaults:

- `DEV_LOGIN_EMAIL` empty
- Supabase configured
- `DATA_PROVIDER` set to your real provider
- Stripe keys configured when payments are enabled
