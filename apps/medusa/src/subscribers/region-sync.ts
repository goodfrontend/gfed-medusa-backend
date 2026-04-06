import { SubscriberArgs, type SubscriberConfig } from '@medusajs/framework';

import {
  deleteBrowseIndicesForMarketKeys,
  getEventStringIds,
  runAlgoliaFullSync,
} from './utils/algolia-sync';

export default async function handleRegionEvents({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  if (event.name === 'region.deleted') {
    const marketKeys = getEventStringIds(event.data, 'id', 'ids');

    if (marketKeys.length) {
      await deleteBrowseIndicesForMarketKeys(container, marketKeys);
      return;
    }
  }

  await runAlgoliaFullSync(container);
}

export const config: SubscriberConfig = {
  event: ['region.created', 'region.updated', 'region.deleted'],
};
