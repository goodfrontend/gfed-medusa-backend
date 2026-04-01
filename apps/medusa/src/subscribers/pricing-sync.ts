import { SubscriberArgs, type SubscriberConfig } from '@medusajs/framework';

import {
  getEventStringIds,
  runAlgoliaFullSync,
  syncProductsByPriceSetIds,
} from './utils/algolia-sync';

export default async function handlePricingEvents({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  if (event.name.startsWith('price-set.')) {
    const priceSetIds = getEventStringIds(
      event.data,
      'id',
      'ids',
      'price_set_id',
      'price_set_ids'
    );

    if (priceSetIds.length) {
      await syncProductsByPriceSetIds(container, priceSetIds);
      return;
    }
  }

  await runAlgoliaFullSync(container);
}

export const config: SubscriberConfig = {
  event: [
    'price-list.created',
    'price-list.updated',
    'price-list.deleted',
    'price-set.created',
    'price-set.updated',
    'price-set.deleted',
  ],
};
