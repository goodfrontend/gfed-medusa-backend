import { ProductDTO } from '@medusajs/framework/types';
import {
  ContainerRegistrationKeys,
  QueryContext,
} from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { ALGOLIA_MODULE } from '../../../modules/algolia';
import {
  AlgoliaBrowseMarket,
  buildAlgoliaBrowseProductRecord,
  buildAlgoliaProductRecord,
} from '../../../modules/algolia/product-record';
import AlgoliaModuleService from '../../../modules/algolia/service';
import { PRODUCT_BROWSE_FIELDS } from '../constants';

type QueryService = {
  graph: <T = Record<string, unknown>>(
    input: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<{
    data: T[];
    metadata?: Record<string, unknown>;
  }>;
};

export type SyncProductsStepInput = {
  products: ProductDTO[];
  browseMarkets: AlgoliaBrowseMarket[];
};

function isAlgoliaRecord(
  record: Record<string, unknown> | null
): record is Record<string, unknown> {
  return Boolean(record);
}

export const syncProductsStep = createStep(
  'sync-products',
  async ({ products, browseMarkets }: SyncProductsStepInput, { container }) => {
    const productIds = products.map((product) => product.id);

    if (!productIds.length) {
      return new StepResponse(undefined, {
        productIds: [],
        browseIndexNames: [],
        existingProducts: [],
        existingBrowseProducts: [],
      });
    }

    const algoliaModuleService: AlgoliaModuleService =
      container.resolve(ALGOLIA_MODULE);
    const query = container.resolve(
      ContainerRegistrationKeys.QUERY
    ) as unknown as QueryService;
    const productRecords = products.map(buildAlgoliaProductRecord);
    const existingProducts = (
      await algoliaModuleService.retrieveFromIndex(productIds, 'product')
    ).results.filter(isAlgoliaRecord);
    const browseProductsByMarket = await Promise.all(
      browseMarkets.map(async (market) => {
        const { primaryIndexName } =
          await algoliaModuleService.configureBrowseIndex(
            'product',
            market.market_key
          );
        const { data } = await query.graph<ProductDTO>({
          entity: 'product',
          fields: PRODUCT_BROWSE_FIELDS,
          filters: {
            id: productIds,
            status: 'published',
          },
          context: {
            variants: {
              calculated_price: QueryContext({
                region_id: market.region_id,
                currency_code: market.currency_code,
              }),
            },
          },
        });
        const browseRecords = data.map((product) =>
          buildAlgoliaBrowseProductRecord(product, market)
        );
        const existingRecords = (
          await algoliaModuleService.retrieveFromIndex(
            productIds,
            'product',
            primaryIndexName,
            true
          )
        ).results.filter(isAlgoliaRecord);

        return {
          indexName: primaryIndexName,
          records: browseRecords,
          existingRecords,
        };
      })
    );

    await algoliaModuleService.indexData(productRecords, 'product');
    await Promise.all(
      browseProductsByMarket.map(({ indexName, records }) =>
        algoliaModuleService.indexData(records, 'product', indexName)
      )
    );

    return new StepResponse(undefined, {
      productIds,
      browseIndexNames: browseProductsByMarket.map(
        ({ indexName }) => indexName
      ),
      existingProducts,
      existingBrowseProducts: browseProductsByMarket.map(
        ({ indexName, existingRecords }) => ({
          indexName,
          records: existingRecords,
        })
      ),
    });
  },
  async (input, { container }) => {
    if (!input) {
      return;
    }

    const algoliaModuleService: AlgoliaModuleService =
      container.resolve(ALGOLIA_MODULE);

    if (input.productIds?.length) {
      await algoliaModuleService.deleteFromIndex(input.productIds, 'product');
      await Promise.all(
        (input.browseIndexNames ?? []).map((indexName: string) =>
          algoliaModuleService.deleteFromIndex(
            input.productIds,
            'product',
            indexName,
            true
          )
        )
      );
    }

    if (input.existingProducts?.length) {
      await algoliaModuleService.indexData(input.existingProducts, 'product');
    }

    if (input.existingBrowseProducts?.length) {
      await Promise.all(
        input.existingBrowseProducts.map(
          ({
            indexName,
            records,
          }: {
            indexName: string;
            records: Record<string, unknown>[];
          }) =>
            records.length
              ? algoliaModuleService.indexData(records, 'product', indexName)
              : Promise.resolve()
        )
      );
    }
  }
);
