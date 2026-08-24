import { Migration } from '@mikro-orm/migrations';

export class Migration20260811085523 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "rfq_attachment" ("id" text not null, "rfq_id" text not null, "file_name" text not null, "object_key" text not null, "mime_type" text not null, "size" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rfq_attachment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rfq_attachment_deleted_at" ON "rfq_attachment" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "rfq_attachment" cascade;`);
  }

}
