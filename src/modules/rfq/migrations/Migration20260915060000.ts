import { Migration } from '@mikro-orm/migrations';

export class Migration20260915060000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "rfq_item" add column if not exists "variant_id" text null;`);
    this.addSql(`alter table if exists "rfq_item" add column if not exists "variant_title" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "rfq_item" drop column if exists "variant_id";`);
    this.addSql(`alter table if exists "rfq_item" drop column if exists "variant_title";`);
  }

}
