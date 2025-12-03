import { Migration } from '@mikro-orm/migrations';

export class Migration20250904112029 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "product_extended" ("id" text not null, "vendor" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_extended_pkey" primary key ("id"));`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_extended_deleted_at" ON "product_extended" (deleted_at) WHERE deleted_at IS NULL;`
    );

    this.addSql(
      `create table if not exists "product_variant_extended" ("id" text not null, "requires_shipping" boolean not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_variant_extended_pkey" primary key ("id"));`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_variant_extended_deleted_at" ON "product_variant_extended" (deleted_at) WHERE deleted_at IS NULL;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_extended" cascade;`);

    this.addSql(`drop table if exists "product_variant_extended" cascade;`);
  }
}
