import { Migration } from '@mikro-orm/migrations';

export class Migration20260829210350 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "project_sub_paragraph" add column if not exists "image_url_2" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "project_sub_paragraph" drop column if exists "image_url_2";`);
  }

}
