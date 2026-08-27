import { Migration } from '@mikro-orm/migrations';

export class Migration20260827174949 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "sub_collection" ("id" text not null, "collection_id" text not null, "name_en" text not null, "name_ar" text not null, "description_en" text null, "description_ar" text null, "image_url" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "sub_collection_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_sub_collection_deleted_at" ON "sub_collection" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "sub_collection" cascade;`);
  }

}
