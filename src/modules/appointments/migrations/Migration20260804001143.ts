import { Migration } from '@mikro-orm/migrations';

export class Migration20260804001143 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "appointment" ("id" text not null, "customer_name" text not null, "customer_email" text not null, "customer_phone" text not null, "customer_address" text null, "notes" text null, "status" text check ("status" in ('pending', 'contacted', 'scheduled', 'completed', 'cancelled')) not null default 'pending', "admin_notes" text null, "interview_report" text null, "appointment_date" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "appointment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_appointment_deleted_at" ON "appointment" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "appointment" cascade;`);
  }

}
