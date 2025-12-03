import { Migration } from '@mikro-orm/migrations';

export class Migration20250923094420 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "loyalty_point" add column if not exists "locked_points" integer not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "loyalty_point" drop column if exists "locked_points";`);
  }

}
