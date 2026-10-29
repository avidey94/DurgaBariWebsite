import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload_cms"."enum_users_role" AS ENUM('administrator', 'editor');
  ALTER TABLE "payload_cms"."users" ADD COLUMN "role" "payload_cms"."enum_users_role" DEFAULT 'editor' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_cms"."users" DROP COLUMN "role";
  DROP TYPE "payload_cms"."enum_users_role";`)
}
