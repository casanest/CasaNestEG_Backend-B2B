import { Migration } from '@mikro-orm/migrations';

export class Migration20260825091057 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "project_category" drop constraint if exists "project_category_slug_unique";`);
    this.addSql(`alter table if exists "project" drop constraint if exists "project_slug_unique";`);
    this.addSql(`create table if not exists "project" ("id" text not null, "category_id" text not null, "slug" text not null, "title_en" text not null, "title_ar" text not null, "location_en" text not null, "location_ar" text not null, "hero_image_url" text not null, "project_date" timestamptz not null, "is_in_homepage" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "project_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_project_slug_unique" ON "project" (slug) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_project_deleted_at" ON "project" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "project_category" ("id" text not null, "slug" text not null, "name_en" text not null, "name_ar" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "project_category_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_project_category_slug_unique" ON "project_category" (slug) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_project_category_deleted_at" ON "project_category" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "project_gallery_image" ("id" text not null, "project_id" text not null, "image_url" text not null, "display_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "project_gallery_image_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_project_gallery_image_deleted_at" ON "project_gallery_image" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "project_metric" ("id" text not null, "project_id" text not null, "label_en" text not null, "label_ar" text not null, "value_en" text not null, "value_ar" text not null, "display_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "project_metric_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_project_metric_deleted_at" ON "project_metric" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "project_sub_paragraph" ("id" text not null, "project_id" text not null, "heading_en" text not null, "heading_ar" text not null, "text_en" text not null, "text_ar" text not null, "image_url" text null, "display_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "project_sub_paragraph_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_project_sub_paragraph_deleted_at" ON "project_sub_paragraph" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "project" cascade;`);

    this.addSql(`drop table if exists "project_category" cascade;`);

    this.addSql(`drop table if exists "project_gallery_image" cascade;`);

    this.addSql(`drop table if exists "project_metric" cascade;`);

    this.addSql(`drop table if exists "project_sub_paragraph" cascade;`);
  }

}
