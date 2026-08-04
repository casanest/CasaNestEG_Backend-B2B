import { Migration } from '@mikro-orm/migrations';

export class Migration20260803040124 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "rfq" ("id" text not null, "customer_name" text not null, "customer_email" text not null, "customer_phone" text not null, "company_name" text null, "message" text not null, "status" text check ("status" in ('pending', 'quoted', 'closed')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rfq_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rfq_deleted_at" ON "rfq" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rfq_item" ("id" text not null, "rfq_id" text not null, "product_id" text not null, "product_title" text not null, "quantity" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rfq_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rfq_item_deleted_at" ON "rfq_item" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "rfq" cascade;`);

    this.addSql(`drop table if exists "rfq_item" cascade;`);
  }

}
