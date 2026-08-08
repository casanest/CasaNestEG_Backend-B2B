import { Migration } from '@mikro-orm/migrations';

export class Migration20260804005102 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "test" add column if not exists "ip_address" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "test" drop column if exists "ip_address";`);
  }

}
