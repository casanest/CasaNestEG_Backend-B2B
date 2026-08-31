import { Migration } from '@mikro-orm/migrations';

export class Migration20260831190542 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "package" add column if not exists "is_in_homepage" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "package" drop column if exists "is_in_homepage";`);
  }

}
