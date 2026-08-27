import { Migration } from '@mikro-orm/migrations';

export class Migration20260827174957 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_custom" add column if not exists "sub_collection_id" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_custom" drop column if exists "sub_collection_id";`);
  }

}
