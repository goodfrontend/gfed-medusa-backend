import { Migration } from '@mikro-orm/migrations';

export class Migration20260511084000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "user_profiles" ("id" text not null, "device_id" text not null, "user_id" text null, "category_affinity" jsonb not null default '{}'::jsonb, "price_sensitivity" jsonb not null default '{"score":0.5,"avg_viewed_price":0,"deal_click_rate":0}'::jsonb, "intent_signals" jsonb not null default '{"research_depth":0,"cart_to_purchase_rate":0,"return_rate":0}'::jsonb, "engagement_level" text check ("engagement_level" in ('LOW', 'MEDIUM', 'HIGH')) not null default 'MEDIUM', "lifecycle_stage" text check ("lifecycle_stage" in ('NEW', 'RETURNING', 'FREQUENT', 'LOYAL')) not null default 'NEW', "first_seen" timestamptz not null default now(), "last_seen" timestamptz not null default now(), "session_count" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), constraint "user_profiles_pkey" primary key ("id"));`
    );
    this.addSql(
      `create unique index if not exists "IDX_user_profiles_device_id" on "user_profiles" ("device_id");`
    );
    this.addSql(
      `create index if not exists "IDX_user_profiles_user_id" on "user_profiles" ("user_id");`
    );
    this.addSql(
      `create index if not exists "IDX_user_profiles_engagement_level" on "user_profiles" ("engagement_level");`
    );
    this.addSql(
      `create index if not exists "IDX_user_profiles_lifecycle_stage" on "user_profiles" ("lifecycle_stage");`
    );

    this.addSql(
      `create table if not exists "signal_events" ("id" bigserial primary key, "device_id" text not null, "user_id" text null, "signal_type" text check ("signal_type" in ('PAGE_VIEW', 'TIME_ON_PAGE', 'SCROLL_DEPTH', 'EXIT_INTENT', 'TAB_SWITCH', 'SEARCH_QUERY', 'SEARCH_RESULT_CLICK', 'SEARCH_REFINE', 'FILTER_APPLIED', 'SORT_CHANGED', 'PRODUCT_HOVER', 'QUICK_VIEW_OPEN', 'IMAGE_ZOOM', 'SIZE_GUIDE_VIEW', 'REVIEWS_VIEW', 'CART_ADD', 'CART_REMOVE', 'CART_UPDATE_QUANTITY', 'CHECKOUT_START', 'CHECKOUT_ABANDON', 'TRUST_BADGE_CLICK', 'SECURITY_INFO_VIEW', 'RETURN_POLICY_VIEW')) not null, "payload" jsonb not null default '{}'::jsonb, "url" text null, "timestamp" bigint not null, "created_at" timestamptz not null default now());`
    );
    this.addSql(
      `create index if not exists "IDX_signal_events_device_signal_created" on "signal_events" ("device_id", "signal_type", "created_at");`
    );
    this.addSql(
      `create index if not exists "IDX_signal_events_created_at" on "signal_events" ("created_at");`
    );
    this.addSql(
      `create index if not exists "IDX_signal_events_user_id" on "signal_events" ("user_id");`
    );

    this.addSql(
      `create table if not exists "conversions" ("id" bigserial primary key, "device_id" text not null, "user_id" text null, "order_id" text not null, "amount" numeric(10,2) not null, "currency" varchar(3) not null, "items" jsonb not null default '[]'::jsonb, "checkout_signal_id" text null, "created_at" timestamptz not null default now());`
    );
    this.addSql(
      `create index if not exists "IDX_conversions_device_created" on "conversions" ("device_id", "created_at");`
    );
    this.addSql(
      `create index if not exists "IDX_conversions_user_id" on "conversions" ("user_id");`
    );
    this.addSql(
      `create index if not exists "IDX_conversions_order_id" on "conversions" ("order_id");`
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "conversions" cascade;`);
    this.addSql(`drop table if exists "signal_events" cascade;`);
    this.addSql(`drop table if exists "user_profiles" cascade;`);
  }
}
