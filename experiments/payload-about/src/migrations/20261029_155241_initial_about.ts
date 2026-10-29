import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload_cms"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload_cms"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload_cms"."enum_row_activity_action" AS ENUM('added', 'edited', 'moved', 'removed');
  CREATE TABLE "payload_cms"."users_sessions" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "created_at" timestamp(3) with time zone,
    "expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "payload_cms"."users" (
    "id" serial PRIMARY KEY NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "email" varchar NOT NULL,
    "reset_password_token" varchar,
    "reset_password_expiration" timestamp(3) with time zone,
    "salt" varchar,
    "hash" varchar,
    "reset_password_requested_at" timestamp(3) with time zone,
    "login_attempts" numeric DEFAULT 0,
    "lock_until" timestamp(3) with time zone
  );

  CREATE TABLE "payload_cms"."media" (
    "id" serial PRIMARY KEY NOT NULL,
    "alt" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "url" varchar,
    "thumbnail_u_r_l" varchar,
    "filename" varchar,
    "mime_type" varchar,
    "filesize" numeric,
    "width" numeric,
    "height" numeric,
    "focal_x" numeric,
    "focal_y" numeric
  );

  CREATE TABLE "payload_cms"."pages_blocks_story" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "headline" varchar,
    "body" varchar,
    "block_name" varchar
  );

  CREATE TABLE "payload_cms"."pages_blocks_principles_items" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "body" varchar
  );

  CREATE TABLE "payload_cms"."pages_blocks_principles" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "block_name" varchar
  );

  CREATE TABLE "payload_cms"."pages_blocks_image_story" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "headline" varchar,
    "body" varchar,
    "image_url" varchar,
    "image_alt" varchar,
    "block_name" varchar
  );

  CREATE TABLE "payload_cms"."pages_blocks_quote" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "quote" varchar,
    "attribution" varchar,
    "block_name" varchar
  );

  CREATE TABLE "payload_cms"."pages_blocks_call_to_action" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "headline" varchar,
    "body" varchar,
    "link_label" varchar,
    "link_url" varchar,
    "block_name" varchar
  );

  CREATE TABLE "payload_cms"."pages" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar DEFAULT 'about',
    "title" varchar DEFAULT 'About Durga Bari',
    "hero_eyebrow" varchar,
    "hero_headline" varchar,
    "hero_lead" varchar,
    "hero_image_url" varchar,
    "hero_image_alt" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "payload_cms"."enum_pages_status" DEFAULT 'draft'
  );

  CREATE TABLE "payload_cms"."_pages_v_blocks_story" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "headline" varchar,
    "body" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "payload_cms"."_pages_v_blocks_principles_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "body" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "payload_cms"."_pages_v_blocks_principles" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "payload_cms"."_pages_v_blocks_image_story" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "eyebrow" varchar,
    "headline" varchar,
    "body" varchar,
    "image_url" varchar,
    "image_alt" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "payload_cms"."_pages_v_blocks_quote" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "quote" varchar,
    "attribution" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "payload_cms"."_pages_v_blocks_call_to_action" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "headline" varchar,
    "body" varchar,
    "link_label" varchar,
    "link_url" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "payload_cms"."_pages_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_slug" varchar DEFAULT 'about',
    "version_title" varchar DEFAULT 'About Durga Bari',
    "version_hero_eyebrow" varchar,
    "version_hero_headline" varchar,
    "version_hero_lead" varchar,
    "version_hero_image_url" varchar,
    "version_hero_image_alt" varchar,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "payload_cms"."enum__pages_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "payload_cms"."row_activity" (
    "id" serial PRIMARY KEY NOT NULL,
    "page_slug" varchar NOT NULL,
    "row_id" varchar NOT NULL,
    "row_type" varchar NOT NULL,
    "action" "payload_cms"."enum_row_activity_action" NOT NULL,
    "from_position" numeric,
    "to_position" numeric,
    "actor" varchar,
    "summary" varchar NOT NULL,
    "snapshot" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_cms"."payload_kv" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "data" jsonb NOT NULL
  );

  CREATE TABLE "payload_cms"."payload_locked_documents" (
    "id" serial PRIMARY KEY NOT NULL,
    "global_slug" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_cms"."payload_locked_documents_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer,
    "media_id" integer,
    "pages_id" integer,
    "row_activity_id" integer
  );

  CREATE TABLE "payload_cms"."payload_preferences" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "value" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_cms"."payload_preferences_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload_cms"."payload_migrations" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "batch" numeric,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_cms"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."pages_blocks_story" ADD CONSTRAINT "pages_blocks_story_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."pages_blocks_principles_items" ADD CONSTRAINT "pages_blocks_principles_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."pages_blocks_principles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."pages_blocks_principles" ADD CONSTRAINT "pages_blocks_principles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."pages_blocks_image_story" ADD CONSTRAINT "pages_blocks_image_story_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."pages_blocks_quote" ADD CONSTRAINT "pages_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."pages_blocks_call_to_action" ADD CONSTRAINT "pages_blocks_call_to_action_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."_pages_v_blocks_story" ADD CONSTRAINT "_pages_v_blocks_story_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."_pages_v_blocks_principles_items" ADD CONSTRAINT "_pages_v_blocks_principles_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."_pages_v_blocks_principles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."_pages_v_blocks_principles" ADD CONSTRAINT "_pages_v_blocks_principles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."_pages_v_blocks_image_story" ADD CONSTRAINT "_pages_v_blocks_image_story_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."_pages_v_blocks_quote" ADD CONSTRAINT "_pages_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."_pages_v_blocks_call_to_action" ADD CONSTRAINT "_pages_v_blocks_call_to_action_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_cms"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_cms"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload_cms"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload_cms"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "payload_cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_row_activity_fk" FOREIGN KEY ("row_activity_id") REFERENCES "payload_cms"."row_activity"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_cms"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload_cms"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "payload_cms"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload_cms"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload_cms"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload_cms"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload_cms"."users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "payload_cms"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload_cms"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload_cms"."media" USING btree ("filename");
  CREATE INDEX "pages_blocks_story_order_idx" ON "payload_cms"."pages_blocks_story" USING btree ("_order");
  CREATE INDEX "pages_blocks_story_parent_id_idx" ON "payload_cms"."pages_blocks_story" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_story_path_idx" ON "payload_cms"."pages_blocks_story" USING btree ("_path");
  CREATE INDEX "pages_blocks_principles_items_order_idx" ON "payload_cms"."pages_blocks_principles_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_principles_items_parent_id_idx" ON "payload_cms"."pages_blocks_principles_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_principles_order_idx" ON "payload_cms"."pages_blocks_principles" USING btree ("_order");
  CREATE INDEX "pages_blocks_principles_parent_id_idx" ON "payload_cms"."pages_blocks_principles" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_principles_path_idx" ON "payload_cms"."pages_blocks_principles" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_story_order_idx" ON "payload_cms"."pages_blocks_image_story" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_story_parent_id_idx" ON "payload_cms"."pages_blocks_image_story" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_story_path_idx" ON "payload_cms"."pages_blocks_image_story" USING btree ("_path");
  CREATE INDEX "pages_blocks_quote_order_idx" ON "payload_cms"."pages_blocks_quote" USING btree ("_order");
  CREATE INDEX "pages_blocks_quote_parent_id_idx" ON "payload_cms"."pages_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_quote_path_idx" ON "payload_cms"."pages_blocks_quote" USING btree ("_path");
  CREATE INDEX "pages_blocks_call_to_action_order_idx" ON "payload_cms"."pages_blocks_call_to_action" USING btree ("_order");
  CREATE INDEX "pages_blocks_call_to_action_parent_id_idx" ON "payload_cms"."pages_blocks_call_to_action" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_call_to_action_path_idx" ON "payload_cms"."pages_blocks_call_to_action" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "payload_cms"."pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "payload_cms"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "payload_cms"."pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "payload_cms"."pages" USING btree ("_status");
  CREATE INDEX "_pages_v_blocks_story_order_idx" ON "payload_cms"."_pages_v_blocks_story" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_story_parent_id_idx" ON "payload_cms"."_pages_v_blocks_story" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_story_path_idx" ON "payload_cms"."_pages_v_blocks_story" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_principles_items_order_idx" ON "payload_cms"."_pages_v_blocks_principles_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_principles_items_parent_id_idx" ON "payload_cms"."_pages_v_blocks_principles_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_principles_order_idx" ON "payload_cms"."_pages_v_blocks_principles" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_principles_parent_id_idx" ON "payload_cms"."_pages_v_blocks_principles" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_principles_path_idx" ON "payload_cms"."_pages_v_blocks_principles" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_story_order_idx" ON "payload_cms"."_pages_v_blocks_image_story" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_story_parent_id_idx" ON "payload_cms"."_pages_v_blocks_image_story" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_story_path_idx" ON "payload_cms"."_pages_v_blocks_image_story" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_quote_order_idx" ON "payload_cms"."_pages_v_blocks_quote" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_quote_parent_id_idx" ON "payload_cms"."_pages_v_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_quote_path_idx" ON "payload_cms"."_pages_v_blocks_quote" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_call_to_action_order_idx" ON "payload_cms"."_pages_v_blocks_call_to_action" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_call_to_action_parent_id_idx" ON "payload_cms"."_pages_v_blocks_call_to_action" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_call_to_action_path_idx" ON "payload_cms"."_pages_v_blocks_call_to_action" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "payload_cms"."_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "payload_cms"."_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "payload_cms"."_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "payload_cms"."_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "payload_cms"."_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "payload_cms"."_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "payload_cms"."_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "payload_cms"."_pages_v" USING btree ("latest");
  CREATE INDEX "row_activity_page_slug_idx" ON "payload_cms"."row_activity" USING btree ("page_slug");
  CREATE INDEX "row_activity_row_id_idx" ON "payload_cms"."row_activity" USING btree ("row_id");
  CREATE INDEX "row_activity_updated_at_idx" ON "payload_cms"."row_activity" USING btree ("updated_at");
  CREATE INDEX "row_activity_created_at_idx" ON "payload_cms"."row_activity" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_cms"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_cms"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_cms"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_cms"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_cms"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_cms"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_cms"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_cms"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_cms"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_cms"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_row_activity_id_idx" ON "payload_cms"."payload_locked_documents_rels" USING btree ("row_activity_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_cms"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_cms"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_cms"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_cms"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_cms"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_cms"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_cms"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_cms"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_cms"."payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload_cms"."users_sessions" CASCADE;
  DROP TABLE "payload_cms"."users" CASCADE;
  DROP TABLE "payload_cms"."media" CASCADE;
  DROP TABLE "payload_cms"."pages_blocks_story" CASCADE;
  DROP TABLE "payload_cms"."pages_blocks_principles_items" CASCADE;
  DROP TABLE "payload_cms"."pages_blocks_principles" CASCADE;
  DROP TABLE "payload_cms"."pages_blocks_image_story" CASCADE;
  DROP TABLE "payload_cms"."pages_blocks_quote" CASCADE;
  DROP TABLE "payload_cms"."pages_blocks_call_to_action" CASCADE;
  DROP TABLE "payload_cms"."pages" CASCADE;
  DROP TABLE "payload_cms"."_pages_v_blocks_story" CASCADE;
  DROP TABLE "payload_cms"."_pages_v_blocks_principles_items" CASCADE;
  DROP TABLE "payload_cms"."_pages_v_blocks_principles" CASCADE;
  DROP TABLE "payload_cms"."_pages_v_blocks_image_story" CASCADE;
  DROP TABLE "payload_cms"."_pages_v_blocks_quote" CASCADE;
  DROP TABLE "payload_cms"."_pages_v_blocks_call_to_action" CASCADE;
  DROP TABLE "payload_cms"."_pages_v" CASCADE;
  DROP TABLE "payload_cms"."row_activity" CASCADE;
  DROP TABLE "payload_cms"."payload_kv" CASCADE;
  DROP TABLE "payload_cms"."payload_locked_documents" CASCADE;
  DROP TABLE "payload_cms"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_cms"."payload_preferences" CASCADE;
  DROP TABLE "payload_cms"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload_cms"."payload_migrations" CASCADE;
  DROP TYPE "payload_cms"."enum_pages_status";
  DROP TYPE "payload_cms"."enum__pages_v_version_status";
  DROP TYPE "payload_cms"."enum_row_activity_action";`)
}
