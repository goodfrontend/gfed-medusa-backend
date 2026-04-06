import { SubscriberArgs, type SubscriberConfig } from '@medusajs/framework';

import {
  getEventStringIds,
  syncProductsByVariantIds,
} from './utils/algolia-sync';

export default async function handleProductVariantEvents({
  event: { data },
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const variantIds = getEventStringIds(
    data,
    'id',
    'ids',
    'variant_id',
    'variant_ids'
  );
  const fallbackProductIds = getEventStringIds(
    data,
    'product_id',
    'product_ids'
  );

  await syncProductsByVariantIds(container, variantIds, fallbackProductIds);
}

export const config: SubscriberConfig = {
  event: [
    'product-variant.created',
    'product-variant.updated',
    'product-variant.deleted',
  ],
};
