import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload_cms"."enum_pages_blocks_feature_slot_feature" AS ENUM('upcomingEvents', 'visit', 'memberPortal', 'livestream', 'contactForm', 'donationMethods');
  CREATE TYPE "payload_cms"."enum__pages_v_blocks_feature_slot_feature" AS ENUM('upcomingEvents', 'visit', 'memberPortal', 'livestream', 'contactForm', 'donationMethods');
  CREATE TABLE "payload_cms"."pages_blocks_feature_slot" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"feature" "payload_cms"."enum_pages_blocks_feature_slot_feature",
  	"eyebrow" varchar,
  	"headline" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload_cms"."_pages_v_blocks_feature_slot" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"feature" "payload_cms"."enum__pages_v_blocks_feature_slot_feature",
  	"eyebrow" varchar,
  	"headline" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "payload_cms"."pages" ALTER COLUMN "slug" DROP DEFAULT;
  ALTER TABLE "payload_cms"."pages" ALTER COLUMN "title" DROP DEFAULT;
  ALTER TABLE "payload_cms"."_pages_v" ALTER COLUMN "version_slug" DROP DEFAULT;
  ALTER TABLE "payload_cms"."_pages_v" ALTER COLUMN "version_title" DROP DEFAULT;
  ALTER TABLE "payload_cms"."pages_blocks_principles" ADD COLUMN "headline" varchar;
  ALTER TABLE "payload_cms"."_pages_v_blocks_principles" ADD COLUMN "headline" varchar;
  ALTER TABLE "payload_cms"."pages_blocks_feature_slot" ADD CONSTRAINT "pages_blocks_feature_slot_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_cms"."_pages_v_blocks_feature_slot" ADD CONSTRAINT "_pages_v_blocks_feature_slot_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_feature_slot_order_idx" ON "payload_cms"."pages_blocks_feature_slot" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_slot_parent_id_idx" ON "payload_cms"."pages_blocks_feature_slot" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_slot_path_idx" ON "payload_cms"."pages_blocks_feature_slot" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_feature_slot_order_idx" ON "payload_cms"."_pages_v_blocks_feature_slot" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_slot_parent_id_idx" ON "payload_cms"."_pages_v_blocks_feature_slot" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_slot_path_idx" ON "payload_cms"."_pages_v_blocks_feature_slot" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_cms"."pages_blocks_feature_slot" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_cms"."_pages_v_blocks_feature_slot" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload_cms"."pages_blocks_feature_slot" CASCADE;
  DROP TABLE "payload_cms"."_pages_v_blocks_feature_slot" CASCADE;
  ALTER TABLE "payload_cms"."pages" ALTER COLUMN "slug" SET DEFAULT 'about';
  ALTER TABLE "payload_cms"."pages" ALTER COLUMN "title" SET DEFAULT 'About Durga Bari';
  ALTER TABLE "payload_cms"."_pages_v" ALTER COLUMN "version_slug" SET DEFAULT 'about';
  ALTER TABLE "payload_cms"."_pages_v" ALTER COLUMN "version_title" SET DEFAULT 'About Durga Bari';
  ALTER TABLE "payload_cms"."pages_blocks_principles" DROP COLUMN "headline";
  ALTER TABLE "payload_cms"."_pages_v_blocks_principles" DROP COLUMN "headline";
  DROP TYPE "payload_cms"."enum_pages_blocks_feature_slot_feature";
  DROP TYPE "payload_cms"."enum__pages_v_blocks_feature_slot_feature";`)
}
