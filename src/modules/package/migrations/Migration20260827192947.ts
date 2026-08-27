import { Migration } from '@mikro-orm/migrations';

export class Migration20260827192947 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "package" drop constraint if exists "package_slug_unique";`);
    this.addSql(`create table if not exists "package" ("id" text not null, "slug" text not null, "name_en" text not null, "name_ar" text not null, "description_en" text null, "description_ar" text null, "image_url" text null, "is_published" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "package_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_package_slug_unique" ON "package" (slug) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_package_deleted_at" ON "package" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "package_title" ("id" text not null, "name_en" text not null, "name_ar" text not null, "display_order" integer not null default 0, "package_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "package_title_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_package_title_package_id" ON "package_title" (package_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_package_title_deleted_at" ON "package_title" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "package_title" add constraint "package_title_package_id_foreign" foreign key ("package_id") references "package" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "package_title" drop constraint if exists "package_title_package_id_foreign";`);

    this.addSql(`drop table if exists "package" cascade;`);

    this.addSql(`drop table if exists "package_title" cascade;`);
  }

}
