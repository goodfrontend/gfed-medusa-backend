import { Migration } from '@mikro-orm/migrations';

export class Migration20260514000100 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "signal_events" drop constraint if exists "signal_events_signal_type_check";`);
    this.addSql(`alter table if exists "signal_events" add constraint "signal_events_signal_type_check" check ("signal_type" in ('PAGE_VIEW', 'TIME_ON_PAGE', 'SCROLL_DEPTH', 'EXIT_INTENT', 'TAB_SWITCH', 'SEARCH_QUERY', 'SEARCH_RESULT_CLICK', 'SEARCH_REFINE', 'FILTER_APPLIED', 'SORT_CHANGED', 'PRODUCT_HOVER', 'PRODUCT_VIEW', 'QUICK_VIEW_OPEN', 'IMAGE_ZOOM', 'SIZE_GUIDE_VIEW', 'REVIEWS_VIEW', 'CART_ADD', 'CART_REMOVE', 'CART_UPDATE_QUANTITY', 'CHECKOUT_START', 'CHECKOUT_ABANDON', 'TRUST_BADGE_CLICK', 'SECURITY_INFO_VIEW', 'RETURN_POLICY_VIEW'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "signal_events" drop constraint if exists "signal_events_signal_type_check";`);
    this.addSql(`alter table if exists "signal_events" add constraint "signal_events_signal_type_check" check ("signal_type" in ('PAGE_VIEW', 'TIME_ON_PAGE', 'SCROLL_DEPTH', 'EXIT_INTENT', 'TAB_SWITCH', 'SEARCH_QUERY', 'SEARCH_RESULT_CLICK', 'SEARCH_REFINE', 'FILTER_APPLIED', 'SORT_CHANGED', 'PRODUCT_HOVER', 'QUICK_VIEW_OPEN', 'IMAGE_ZOOM', 'SIZE_GUIDE_VIEW', 'REVIEWS_VIEW', 'CART_ADD', 'CART_REMOVE', 'CART_UPDATE_QUANTITY', 'CHECKOUT_START', 'CHECKOUT_ABANDON', 'TRUST_BADGE_CLICK', 'SECURITY_INFO_VIEW', 'RETURN_POLICY_VIEW'));`);
  }

}
