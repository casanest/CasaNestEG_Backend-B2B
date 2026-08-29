import { Migration } from '@mikro-orm/migrations';

export class Migration20260829203614 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "banner" drop constraint if exists "banner_type_check";`);

    this.addSql(`alter table if exists "banner" add constraint "banner_type_check" check("type" in ('hero', 'past_customer', 'partners'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "banner" drop constraint if exists "banner_type_check";`);

    this.addSql(`alter table if exists "banner" add constraint "banner_type_check" check("type" in ('hero', 'past_customer'));`);
  }

}
