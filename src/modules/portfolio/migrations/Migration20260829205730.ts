import { Migration } from '@mikro-orm/migrations';

export class Migration20260829205730 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "project" add column if not exists "quote_en" text null, add column if not exists "quote_ar" text null, add column if not exists "position_en" text null, add column if not exists "position_ar" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "project" drop column if exists "quote_en", drop column if exists "quote_ar", drop column if exists "position_en", drop column if exists "position_ar";`);
  }

}
