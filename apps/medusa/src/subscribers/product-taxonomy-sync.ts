import { SubscriberArgs, type SubscriberConfig } from '@medusajs/framework';

import {
  getEventStringIds,
  runAlgoliaFullSync,
  syncProductsByCategoryIds,
  syncProductsByCollectionIds,
} from './utils/algolia-sync';

export default async function handleProductTaxonomyEvents({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const taxonomyIds = getEventStringIds(event.data, 'id', 'ids');

  if (event.name.startsWith('product-category.')) {
    if (event.name.endsWith('.deleted')) {
      await runAlgoliaFullSync(container);
      return;
    }

    await syncProductsByCategoryIds(container, taxonomyIds);
    return;
  }

  if (event.name.startsWith('product-collection.')) {
    if (event.name.endsWith('.deleted')) {
      await runAlgoliaFullSync(container);
      return;
    }

    await syncProductsByCollectionIds(container, taxonomyIds);
  }
}

export const config: SubscriberConfig = {
  event: [
    'product-category.created',
    'product-category.updated',
    'product-category.deleted',
    'product-collection.created',
    'product-collection.updated',
    'product-collection.deleted',
  ],
};
