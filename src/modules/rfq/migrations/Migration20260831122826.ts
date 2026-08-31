import { Migration } from '@mikro-orm/migrations';

export class Migration20260831122826 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "rfq_comment" ("id" text not null, "rfq_id" text not null, "author" text null, "body" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rfq_comment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rfq_comment_deleted_at" ON "rfq_comment" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "rfq" drop constraint if exists "rfq_status_check";`);

    this.addSql(`alter table if exists "rfq" add column if not exists "city" text null, add column if not exists "address" text null;`);
    this.addSql(`alter table if exists "rfq" add constraint "rfq_status_check" check("status" in ('pending', 'quoted', 'closed', 'done'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "rfq_comment" cascade;`);

    this.addSql(`alter table if exists "rfq" drop constraint if exists "rfq_status_check";`);

    this.addSql(`alter table if exists "rfq" drop column if exists "city", drop column if exists "address";`);

    this.addSql(`alter table if exists "rfq" add constraint "rfq_status_check" check("status" in ('pending', 'quoted', 'closed'));`);
  }

}
