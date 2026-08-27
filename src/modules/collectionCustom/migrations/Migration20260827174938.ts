import { Migration } from '@mikro-orm/migrations';

export class Migration20260827174938 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "collection_custom" ("id" text not null, "collection_id" text not null, "image_url" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "collection_custom_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_collection_custom_deleted_at" ON "collection_custom" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "collection_custom" cascade;`);
  }

}
