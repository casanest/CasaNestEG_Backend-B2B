import { Migration } from '@mikro-orm/migrations';

export class Migration20260830170000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "rfq" ADD COLUMN IF NOT EXISTS "city" text NULL;`);
    this.addSql(`ALTER TABLE "rfq" ADD COLUMN IF NOT EXISTS "address" text NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "rfq" DROP COLUMN IF EXISTS "city";`);
    this.addSql(`ALTER TABLE "rfq" DROP COLUMN IF EXISTS "address";`);
  }

}
