import { SubscriberArgs, type SubscriberConfig } from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

import { deleteProductsFromAlgoliaWorkflow } from '../workflows/delete-products-from-algolia';
import { syncProductsWorkflow } from '../workflows/sync-products';

type QueryService = {
  graph: <T = Record<string, unknown>>(
    input: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<{
    data: T[];
    metadata?: Record<string, unknown>;
  }>;
};

type ProductStatusRecord = {
  id?: string;
  status?: string | null;
};

export default async function handleProductEvents({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(
    ContainerRegistrationKeys.QUERY
  ) as unknown as QueryService;
  const { data: products } = await query.graph<ProductStatusRecord>({
    entity: 'product',
    fields: ['id', 'status'],
    filters: {
      id: data.id,
    },
  });
  const product = products[0];

  if (product?.status !== 'published') {
    await deleteProductsFromAlgoliaWorkflow(container).run({
      input: {
        ids: [data.id],
      },
    });
    return;
  }

  await syncProductsWorkflow(container).run({
    input: {
      filters: {
        id: data.id,
      },
    },
  });
}

export const config: SubscriberConfig = {
  event: ['product.created', 'product.updated'],
};
