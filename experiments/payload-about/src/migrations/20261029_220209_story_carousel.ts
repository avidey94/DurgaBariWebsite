import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload_cms"."pages_blocks_story_carousel_cards" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "label" varchar,
     "headline" varchar,
     "body" varchar,
     "image_url" varchar,
     "image_alt" varchar,
     "link_label" varchar,
     "link_url" varchar
  );

  CREATE TABLE "payload_cms"."pages_blocks_story_carousel" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "eyebrow" varchar,
     "headline" varchar,
     "introduction" varchar,
     "block_name" varchar
  );

  CREATE TABLE "payload_cms"."_pages_v_blocks_story_carousel_cards" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "label" varchar,
     "headline" varchar,
     "body" varchar,
     "image_url" varchar,
     "image_alt" varchar,
     "link_label" varchar,
     "link_url" varchar,
     "_uuid" varchar
  );

  CREATE TABLE "payload_cms"."_pages_v_blocks_story_carousel" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "eyebrow" varchar,
     "headline" varchar,
     "introduction" varchar,
     "_uuid" varchar,
     "block_name" varchar
  );

  ALTER TABLE "payload_cms"."pages_blocks_story_carousel_cards" ADD CONSTRAINT "pages_blocks_story_carousel_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."pages_blocks_story_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."pages_blocks_story_carousel" ADD CONSTRAINT "pages_blocks_story_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."_pages_v_blocks_story_carousel_cards" ADD CONSTRAINT "_pages_v_blocks_story_carousel_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."_pages_v_blocks_story_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."_pages_v_blocks_story_carousel" ADD CONSTRAINT "_pages_v_blocks_story_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_story_carousel_cards_order_idx" ON "payload_cms"."pages_blocks_story_carousel_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_story_carousel_cards_parent_id_idx" ON "payload_cms"."pages_blocks_story_carousel_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_story_carousel_order_idx" ON "payload_cms"."pages_blocks_story_carousel" USING btree ("_order");
  CREATE INDEX "pages_blocks_story_carousel_parent_id_idx" ON "payload_cms"."pages_blocks_story_carousel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_story_carousel_path_idx" ON "payload_cms"."pages_blocks_story_carousel" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_story_carousel_cards_order_idx" ON "payload_cms"."_pages_v_blocks_story_carousel_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_story_carousel_cards_parent_id_idx" ON "payload_cms"."_pages_v_blocks_story_carousel_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_story_carousel_order_idx" ON "payload_cms"."_pages_v_blocks_story_carousel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_story_carousel_parent_id_idx" ON "payload_cms"."_pages_v_blocks_story_carousel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_story_carousel_path_idx" ON "payload_cms"."_pages_v_blocks_story_carousel" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload_cms"."pages_blocks_story_carousel_cards" CASCADE;
  DROP TABLE "payload_cms"."pages_blocks_story_carousel" CASCADE;
  DROP TABLE "payload_cms"."_pages_v_blocks_story_carousel_cards" CASCADE;
  DROP TABLE "payload_cms"."_pages_v_blocks_story_carousel" CASCADE;`)
}
