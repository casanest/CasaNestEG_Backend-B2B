import { Migration } from '@mikro-orm/migrations';

export class Migration20260831190542 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_custom" drop column if exists "sub_collection_id";`);

    this.addSql(`alter table if exists "product_custom" add column if not exists "is_in_homepage" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_custom" drop column if exists "is_in_homepage";`);

    this.addSql(`alter table if exists "product_custom" add column if not exists "sub_collection_id" text null;`);
  }

}
