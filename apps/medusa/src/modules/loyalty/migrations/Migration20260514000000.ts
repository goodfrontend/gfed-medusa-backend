import { Migration } from '@mikro-orm/migrations';

export class Migration20260514000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "user_profiles" drop column if exists "brand_affinity";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "user_profiles" add column if not exists "brand_affinity" jsonb not null default '{}'::jsonb;`);
  }

}
