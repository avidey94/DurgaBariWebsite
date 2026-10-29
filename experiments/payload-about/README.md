# Durga Bari About page studio

This folder contains the About page studio. The local SQLite file remains a development fallback. For shared editing, local Payload and the deployed Payload app connect to the same private `payload_cms` schema in the Durga Bari Supabase Postgres database. The main website reads only the published About page through Payload's public API.

## Run locally

Use Node 24.22.1 or newer.

1. `npm install`
2. Copy `.env.example` to `.env` and replace `PAYLOAD_SECRET` with a long random value.
3. `npm run seed`
4. `npm run dev -- -p 3200 -H 127.0.0.1`

Open [the About page](http://127.0.0.1:3200/about) and [the editor](http://127.0.0.1:3200/admin/collections/pages/1). The seed command creates a local development editor, and Payload signs into that account automatically in development.

## Shared local and production content

1. Download the database CA certificate from Supabase **Project Settings → Database**.
2. Set `PAYLOAD_POSTGRES_URL` to the project's **session pooler** connection string using the dedicated `payload_cms` database role. Set `PAYLOAD_POSTGRES_CA_PATH` to the downloaded certificate path locally. The deployed app uses `PAYLOAD_POSTGRES_CA` containing the certificate's PEM text instead.
3. Set a long `PAYLOAD_SECRET` in the deployed app. The shared database starts with `avidey94@gmail.com` as administrator and `it@thedurgacenter.org` as editor. Set `PAYLOAD_ADMIN_PASSWORD` and `PAYLOAD_EDITOR_PASSWORD` before running `npm run seed` once against a fresh shared database; the email variables can override those defaults. Initial credentials for this setup are in the ignored local `.payload-accounts` file. No development auto-login is enabled when Postgres is selected.
4. Deploy this directory as its own Vercel project. The main site's `PAYLOAD_PUBLIC_URL` must be the HTTPS URL of that project. Publishing in the page studio then updates `/about` on the main site immediately.

The `payload_cms` schema is private to the dedicated role; it is not exposed through Supabase's public API. The main site's existing member database and custom CMS are unchanged. Administrators can add editor accounts in Payload; editors can change pages but cannot manage accounts. Page Versions and Section history record their changes. The current block image fields use paths to assets bundled with the main site. Payload Media uploads are disabled on Vercel until durable object storage is connected.

Schema changes use committed Payload migrations. Automatic schema push is disabled for the shared Postgres connection so local editing cannot leave a development migration marker that blocks production startup.

## What to try

- Open the About page in the editor. The introduction is a page field. The content sections are typed, ordered Payload blocks.
- Use a section's menu to **Add Below**, or drag a section to reorder it.
- Toggle **Live Preview** to see unsaved changes. **Save Draft** keeps them separate from the published page; **Publish changes** makes them public.
- **Versions** stores full page snapshots and diffs. **Section history** records section additions, edits, moves, and removals by stable block ID. Inserting a row does not count as moving the rows below it.

The sample includes story, principles, image and story, quote, and invitation section types. Images are bundled locally and referenced by path. A production integration would connect Payload Media uploads and the existing admin identity before migrating any live page.
