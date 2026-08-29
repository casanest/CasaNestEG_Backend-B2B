import { Migration } from '@mikro-orm/migrations';

export class Migration20260829175759 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "testimonial" ("id" text not null, "name_en" text not null, "name_ar" text not null, "image_url" text null, "quote_en" text not null, "quote_ar" text not null, "position_en" text not null, "position_ar" text not null, "display_order" integer not null default 0, "is_published" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "testimonial_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_testimonial_deleted_at" ON "testimonial" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "testimonial" cascade;`);
  }

}
