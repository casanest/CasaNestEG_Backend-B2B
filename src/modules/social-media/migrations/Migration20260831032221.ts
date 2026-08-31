import { Migration } from '@mikro-orm/migrations';

export class Migration20260831032221 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "social_media" add column if not exists "description" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "social_media" drop column if exists "description";`);
  }

}
