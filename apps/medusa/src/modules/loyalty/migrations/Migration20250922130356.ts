import { Migration } from '@mikro-orm/migrations';

export class Migration20250922130356 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "reward" ("id" text not null, "points_cost" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "reward_pkey" primary key ("id"));`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_reward_deleted_at" ON "reward" (deleted_at) WHERE deleted_at IS NULL;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "reward" cascade;`);
  }
}
