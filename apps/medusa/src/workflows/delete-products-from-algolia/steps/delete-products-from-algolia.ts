import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { ALGOLIA_MODULE } from '../../../modules/algolia';
import { buildAlgoliaBrowseMarket } from '../../../modules/algolia/product-record';
import AlgoliaModuleService from '../../../modules/algolia/service';

export type DeleteProductsFromAlgoliaWorkflow = {
  ids: string[];
};

type QueryService = {
  graph: <T = Record<string, unknown>>(
    input: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<{
    data: T[];
    metadata?: Record<string, unknown>;
  }>;
};

type RegionSource = {
  id: string;
  name?: string | null;
  currency_code?: string | null;
  countries?: { iso_2?: string | null }[] | null;
};

function isAlgoliaRecord(
  record: Record<string, unknown> | null
): record is Record<string, unknown> {
  return Boolean(record);
}

export const deleteProductsFromAlgoliaStep = createStep(
  'delete-products-from-algolia-step',
  async ({ ids }: DeleteProductsFromAlgoliaWorkflow, { container }) => {
    if (!ids.length) {
      return new StepResponse(undefined, {
        ids: [],
        browseIndexNames: [],
        existingRecords: [],
        existingBrowseRecords: [],
      });
    }

    const algoliaModuleService: AlgoliaModuleService =
      container.resolve(ALGOLIA_MODULE);
    const query = container.resolve(
      ContainerRegistrationKeys.QUERY
    ) as unknown as QueryService;

    const existingRecords = await algoliaModuleService.retrieveFromIndex(
      ids,
      'product'
    );
    const { data: regions } = await query.graph<RegionSource>({
      entity: 'region',
      fields: ['id', 'name', 'currency_code', 'countries.iso_2'],
    });
    const browseMarkets = regions
      .map(buildAlgoliaBrowseMarket)
      .filter((market): market is NonNullable<typeof market> =>
        Boolean(market)
      );
    const existingBrowseRecords = await Promise.all(
      browseMarkets.map(async (market) => {
        const indexName = algoliaModuleService.getBrowseIndexName(
          'product',
          market.market_key
        );
        const response = await algoliaModuleService.retrieveFromIndex(
          ids,
          'product',
          indexName,
          true
        );

        return {
          indexName,
          records: response.results.filter(isAlgoliaRecord),
        };
      })
    );

    await algoliaModuleService.deleteFromIndex(ids, 'product');
    await Promise.all(
      existingBrowseRecords.map(({ indexName }) =>
        algoliaModuleService.deleteFromIndex(ids, 'product', indexName, true)
      )
    );

    return new StepResponse(undefined, {
      ids,
      browseIndexNames: existingBrowseRecords.map(({ indexName }) => indexName),
      existingRecords: existingRecords.results.filter(isAlgoliaRecord),
      existingBrowseRecords,
    });
  },
  async (input, { container }) => {
    if (!input) {
      return;
    }
    const algoliaModuleService: AlgoliaModuleService =
      container.resolve(ALGOLIA_MODULE);

    if (input.existingRecords?.length) {
      await algoliaModuleService.indexData(input.existingRecords, 'product');
    }

    if (input.existingBrowseRecords?.length) {
      await Promise.all(
        input.existingBrowseRecords.map(
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
