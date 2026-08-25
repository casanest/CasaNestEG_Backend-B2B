import { Migration } from '@mikro-orm/migrations';

export class Migration20260825095704 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "project" add constraint "project_category_id_foreign" foreign key ("category_id") references "project_category" ("id") on update cascade;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_project_category_id" ON "project" (category_id) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "project_gallery_image" add constraint "project_gallery_image_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_project_gallery_image_project_id" ON "project_gallery_image" (project_id) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "project_metric" add constraint "project_metric_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_project_metric_project_id" ON "project_metric" (project_id) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "project_sub_paragraph" add constraint "project_sub_paragraph_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_project_sub_paragraph_project_id" ON "project_sub_paragraph" (project_id) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "project" drop constraint if exists "project_category_id_foreign";`);

    this.addSql(`alter table if exists "project_gallery_image" drop constraint if exists "project_gallery_image_project_id_foreign";`);

    this.addSql(`alter table if exists "project_metric" drop constraint if exists "project_metric_project_id_foreign";`);

    this.addSql(`alter table if exists "project_sub_paragraph" drop constraint if exists "project_sub_paragraph_project_id_foreign";`);

    this.addSql(`drop index if exists "IDX_project_category_id";`);

    this.addSql(`drop index if exists "IDX_project_gallery_image_project_id";`);

    this.addSql(`drop index if exists "IDX_project_metric_project_id";`);

    this.addSql(`drop index if exists "IDX_project_sub_paragraph_project_id";`);
  }

}
