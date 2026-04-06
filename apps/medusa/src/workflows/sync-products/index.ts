import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from '@medusajs/framework/workflows-sdk';
import { useQueryGraphStep } from '@medusajs/medusa/core-flows';

import {
  AlgoliaBrowseMarket,
  buildAlgoliaBrowseMarket,
} from '../../modules/algolia/product-record';
import { PRODUCT_ALGOLIA_FIELDS } from './constants';
import { SyncProductsStepInput, syncProductsStep } from './steps/sync-products';

type SyncProductsWorkflowInput = {
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
};

type RegionSource = {
  id: string;
  name?: string | null;
  currency_code?: string | null;
  countries?: { iso_2?: string | null }[] | null;
};

export const syncProductsWorkflow = createWorkflow(
  'sync-products',
  ({ filters, limit, offset }: SyncProductsWorkflowInput) => {
    const { data, metadata } = useQueryGraphStep({
      entity: 'product',
      fields: PRODUCT_ALGOLIA_FIELDS,
      pagination: {
        take: limit,
        skip: offset,
      },
      filters: {
        status: 'published',
        ...filters,
      },
    }).config({ name: 'published-products-query' });

    const { data: regions } = useQueryGraphStep({
      entity: 'region',
      fields: ['id', 'name', 'currency_code', 'countries.iso_2'],
    }).config({ name: 'browse-markets-query' });

    const browseMarkets = transform({ regions }, ({ regions }) =>
      (regions as RegionSource[])
        .map(buildAlgoliaBrowseMarket)
        .filter((market): market is AlgoliaBrowseMarket => Boolean(market))
    );

    syncProductsStep({
      products: data,
      browseMarkets,
    } as SyncProductsStepInput);

    return new WorkflowResponse({
      products: data,
      metadata,
    });
  }
);
