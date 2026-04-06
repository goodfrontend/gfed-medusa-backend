import { SubscriberArgs } from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

import { ALGOLIA_MODULE } from '../../modules/algolia';
import AlgoliaModuleService from '../../modules/algolia/service';
import { syncProductsWorkflow } from '../../workflows/sync-products';

type QueryService = {
  graph: <T = Record<string, unknown>>(
    input: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<{
    data: T[];
    metadata?: Record<string, unknown>;
  }>;
};

type SubscriberContainer = SubscriberArgs['container'];

type QueryProductVariant = {
  id?: string;
  product_id?: string | null;
  product?: {
    id?: string | null;
  } | null;
};

type QueryInventoryItem = {
  id?: string;
  variants?:
    | {
        id?: string;
        product_id?: string | null;
        product?: {
          id?: string | null;
        } | null;
      }[]
    | null;
};

type QueryInventoryLevel = {
  id?: string;
  inventory_item_id?: string | null;
  inventory_item?: QueryInventoryItem | null;
};

type QueryPriceSet = {
  id?: string;
  variant?: {
    id?: string;
    product_id?: string | null;
    product?: {
      id?: string | null;
    } | null;
  } | null;
};

type QueryProductCategory = {
  id?: string;
  products?:
    | {
        id?: string | null;
      }[]
    | null;
};

type QueryProductCollection = {
  id?: string;
  products?:
    | {
        id?: string | null;
      }[]
    | null;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  return value == null ? [] : [value];
}

function uniqueStrings(values: unknown[]) {
  return Array.from(
    new Set(values.filter((value): value is string => isNonEmptyString(value)))
  );
}

function getDataField(
  data: Record<string, unknown> | undefined,
  key: string
): unknown[] {
  if (!data || !(key in data)) {
    return [];
  }

  return toArray(data[key]);
}

function getQuery(container: SubscriberContainer) {
  return container.resolve(
    ContainerRegistrationKeys.QUERY
  ) as unknown as QueryService;
}

function getAlgoliaModuleService(container: SubscriberContainer) {
  return container.resolve(ALGOLIA_MODULE) as AlgoliaModuleService;
}

export async function runAlgoliaFullSync(container: SubscriberContainer) {
  const logger = container.resolve('logger');

  let hasMore = true;
  let offset = 0;
  const limit = 50;
  let totalIndexed = 0;

  logger.info('Starting product indexing...');

  while (hasMore) {
    const {
      result: { products, metadata },
    } = await syncProductsWorkflow(container).run({
      input: {
        limit,
        offset,
      },
    });

    hasMore = offset + limit < (metadata?.count ?? 0);
    offset += limit;
    totalIndexed += products.length;
  }

  logger.info(`Successfully indexed ${totalIndexed} products`);
}

export async function syncProductsByIds(
  container: SubscriberContainer,
  productIds: string[]
) {
  const ids = uniqueStrings(productIds);

  if (!ids.length) {
    return;
  }

  await syncProductsWorkflow(container).run({
    input: {
      filters: {
        id: ids,
      },
    },
  });
}

export async function deleteBrowseIndicesForMarketKeys(
  container: SubscriberContainer,
  marketKeys: string[]
) {
  const keys = uniqueStrings(marketKeys);

  if (!keys.length) {
    return;
  }

  const algoliaModuleService = getAlgoliaModuleService(container);

  await Promise.all(
    keys.map((marketKey) =>
      algoliaModuleService.deleteBrowseIndexFamily('product', marketKey, true)
    )
  );
}

export async function syncProductsByVariantIds(
  container: SubscriberContainer,
  variantIds: string[],
  fallbackProductIds: string[] = []
) {
  const ids = uniqueStrings(variantIds);

  if (!ids.length) {
    return syncProductsByIds(container, fallbackProductIds);
  }

  const query = getQuery(container);
  const { data } = await query.graph<QueryProductVariant>({
    entity: 'product_variant',
    fields: ['id', 'product_id', 'product.id'],
    filters: {
      id: ids,
    },
  });

  const productIds = uniqueStrings([
    ...fallbackProductIds,
    ...data.map((variant) => variant.product_id),
    ...data.map((variant) => variant.product?.id),
  ]);

  if (productIds.length) {
    await syncProductsByIds(container, productIds);
    return;
  }

  await runAlgoliaFullSync(container);
}

export async function syncProductsByInventoryItemIds(
  container: SubscriberContainer,
  inventoryItemIds: string[]
) {
  const ids = uniqueStrings(inventoryItemIds);

  if (!ids.length) {
    return;
  }

  const query = getQuery(container);
  const { data } = await query.graph<QueryInventoryItem>({
    entity: 'inventory_item',
    fields: ['id', 'variants.id', 'variants.product_id', 'variants.product.id'],
    filters: {
      id: ids,
    },
  });

  const productIds = uniqueStrings(
    data.flatMap((inventoryItem) =>
      (inventoryItem.variants ?? []).flatMap((variant) => [
        variant.product_id,
        variant.product?.id,
      ])
    )
  );

  if (productIds.length) {
    await syncProductsByIds(container, productIds);
    return;
  }

  await runAlgoliaFullSync(container);
}

export async function syncProductsByInventoryLevelIds(
  container: SubscriberContainer,
  inventoryLevelIds: string[]
) {
  const ids = uniqueStrings(inventoryLevelIds);

  if (!ids.length) {
    return;
  }

  const query = getQuery(container);
  const { data } = await query.graph<QueryInventoryLevel>({
    entity: 'inventory_level',
    fields: [
      'id',
      'inventory_item_id',
      'inventory_item.id',
      'inventory_item.variants.id',
      'inventory_item.variants.product_id',
      'inventory_item.variants.product.id',
    ],
    filters: {
      id: ids,
    },
  });

  const productIds = uniqueStrings(
    data.flatMap((inventoryLevel) =>
      (inventoryLevel.inventory_item?.variants ?? []).flatMap((variant) => [
        variant.product_id,
        variant.product?.id,
      ])
    )
  );

  if (productIds.length) {
    await syncProductsByIds(container, productIds);
    return;
  }

  const inventoryItemIds = uniqueStrings([
    ...data.map((inventoryLevel) => inventoryLevel.inventory_item_id),
    ...data.map((inventoryLevel) => inventoryLevel.inventory_item?.id),
  ]);

  if (inventoryItemIds.length) {
    await syncProductsByInventoryItemIds(container, inventoryItemIds);
    return;
  }

  await runAlgoliaFullSync(container);
}

export async function syncProductsByPriceSetIds(
  container: SubscriberContainer,
  priceSetIds: string[]
) {
  const ids = uniqueStrings(priceSetIds);

  if (!ids.length) {
    return;
  }

  const query = getQuery(container);
  const { data } = await query.graph<QueryPriceSet>({
    entity: 'price_set',
    fields: ['id', 'variant.id', 'variant.product_id', 'variant.product.id'],
    filters: {
      id: ids,
    },
  });

  const productIds = uniqueStrings(
    data.flatMap((priceSet) => [
      priceSet.variant?.product_id,
      priceSet.variant?.product?.id,
    ])
  );

  if (productIds.length) {
    await syncProductsByIds(container, productIds);
    return;
  }

  await runAlgoliaFullSync(container);
}

export async function syncProductsByCategoryIds(
  container: SubscriberContainer,
  categoryIds: string[]
) {
  const ids = uniqueStrings(categoryIds);

  if (!ids.length) {
    return;
  }

  const query = getQuery(container);
  const { data } = await query.graph<QueryProductCategory>({
    entity: 'product_category',
    fields: ['id', 'products.id'],
    filters: {
      id: ids,
    },
  });

  const productIds = uniqueStrings(
    data.flatMap((category) =>
      (category.products ?? []).map((product) => product.id)
    )
  );

  if (productIds.length) {
    await syncProductsByIds(container, productIds);
  }
}

export async function syncProductsByCollectionIds(
  container: SubscriberContainer,
  collectionIds: string[]
) {
  const ids = uniqueStrings(collectionIds);

  if (!ids.length) {
    return;
  }

  const query = getQuery(container);
  const { data } = await query.graph<QueryProductCollection>({
    entity: 'product_collection',
    fields: ['id', 'products.id'],
    filters: {
      id: ids,
    },
  });

  const productIds = uniqueStrings(
    data.flatMap((collection) =>
      (collection.products ?? []).map((product) => product.id)
    )
  );

  if (productIds.length) {
    await syncProductsByIds(container, productIds);
  }
}

export function getEventStringIds(
  data: Record<string, unknown> | undefined,
  ...keys: string[]
) {
  return uniqueStrings(keys.flatMap((key) => getDataField(data, key)));
}
