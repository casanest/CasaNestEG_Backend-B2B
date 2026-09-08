import { Migration } from '@mikro-orm/migrations';

export class Migration20260908070000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "rfq" alter column "message" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`update "rfq" set "message" = '' where "message" is null;`);
    this.addSql(`alter table if exists "rfq" alter column "message" set not null;`);
  }

}
