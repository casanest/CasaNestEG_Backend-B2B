import { Migration } from '@mikro-orm/migrations';

export class Migration20260912105122 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_custom" add column if not exists "show_document" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_custom" drop column if exists "show_document";`);
  }

}
