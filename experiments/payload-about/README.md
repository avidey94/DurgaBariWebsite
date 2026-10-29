# Durga Bari About page studio

This folder is a local Payload proof of concept. It uses its own SQLite file and does not write to the existing site CMS or member database.

## Run locally

Use Node 24.22.1 or newer.

1. `npm install`
2. Copy `.env.example` to `.env` and replace `PAYLOAD_SECRET` with a long random value.
3. `npm run seed`
4. `npm run dev -- -p 3200 -H 127.0.0.1`

Open [the About page](http://127.0.0.1:3200/about) and [the editor](http://127.0.0.1:3200/admin/collections/pages/1). The seed command creates a local development editor, and Payload signs into that account automatically in development.

## What to try

- Open the About page in the editor. The introduction is a page field. The content sections are typed, ordered Payload blocks.
- Use a section's menu to **Add Below**, or drag a section to reorder it.
- Toggle **Live Preview** to see unsaved changes. **Save Draft** keeps them separate from the published page; **Publish changes** makes them public.
- **Versions** stores full page snapshots and diffs. **Section history** records section additions, edits, moves, and removals by stable block ID. Inserting a row does not count as moving the rows below it.

The sample includes story, principles, image and story, quote, and invitation section types. Images are bundled locally and referenced by path. A production integration would connect Payload Media uploads and the existing admin identity before migrating any live page.
