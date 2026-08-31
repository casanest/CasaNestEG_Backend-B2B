import { Migration } from '@mikro-orm/migrations';

export class Migration20260831025624 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "social_media" ("id" text not null, "platform" text not null, "url" text not null, "label" text null, "display_order" integer not null default 0, "is_published" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "social_media_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_social_media_deleted_at" ON "social_media" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "social_media" cascade;`);
  }

}
