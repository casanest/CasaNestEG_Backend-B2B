import { Migration } from '@mikro-orm/migrations';

export class Migration20260831150000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "appointment" ADD COLUMN IF NOT EXISTS "company_name" text null;`);
    this.addSql(`ALTER TABLE "appointment" ADD COLUMN IF NOT EXISTS "subject" text null;`);

    this.addSql(`CREATE TABLE IF NOT EXISTS "appointment_attachment" ("id" text not null, "appointment_id" text not null, "file_name" text not null, "object_key" text not null, "mime_type" text not null, "size" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "appointment_attachment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_appointment_attachment_deleted_at" ON "appointment_attachment" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_appointment_attachment_appointment_id" ON "appointment_attachment" (appointment_id);`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "appointment" DROP COLUMN IF EXISTS "company_name";`);
    this.addSql(`ALTER TABLE "appointment" DROP COLUMN IF EXISTS "subject";`);
    this.addSql(`DROP TABLE IF EXISTS "appointment_attachment" CASCADE;`);
  }

}
