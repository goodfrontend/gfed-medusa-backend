import { SubscriberArgs, type SubscriberConfig } from '@medusajs/framework';

import {
  getEventStringIds,
  runAlgoliaFullSync,
  syncProductsByInventoryItemIds,
  syncProductsByInventoryLevelIds,
} from './utils/algolia-sync';

export default async function handleInventoryEvents({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const inventoryItemIds = getEventStringIds(
    event.data,
    'inventory_item_id',
    'inventory_item_ids'
  );

  if (event.name.startsWith('inventory-item.')) {
    const ids = inventoryItemIds.length
      ? inventoryItemIds
      : getEventStringIds(event.data, 'id', 'ids');

    if (ids.length) {
      await syncProductsByInventoryItemIds(container, ids);
      return;
    }

    await runAlgoliaFullSync(container);
    return;
  }

  const inventoryLevelIds = getEventStringIds(event.data, 'id', 'ids');

  if (inventoryLevelIds.length) {
    await syncProductsByInventoryLevelIds(container, inventoryLevelIds);
    return;
  }

  if (inventoryItemIds.length) {
    await syncProductsByInventoryItemIds(container, inventoryItemIds);
    return;
  }

  await runAlgoliaFullSync(container);
}

export const config: SubscriberConfig = {
  event: [
    'inventory-item.created',
    'inventory-item.updated',
    'inventory-item.deleted',
    'inventory-level.created',
    'inventory-level.updated',
    'inventory-level.deleted',
  ],
};
