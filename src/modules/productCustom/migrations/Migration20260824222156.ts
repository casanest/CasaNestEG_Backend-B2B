import { Migration } from '@mikro-orm/migrations';

export class Migration20260824222156 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_custom" ("id" text not null, "product_id" text not null, "document_url" text null, "moq" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_custom_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_custom_deleted_at" ON "product_custom" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_custom" cascade;`);
  }

}
