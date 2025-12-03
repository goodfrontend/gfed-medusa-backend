import type {
  FilterableProductCollectionProps,
  ProductCollectionDTO,
} from '@medusajs/framework/types';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

type GetExistingProductCollectionsInput = {
  filters?: FilterableProductCollectionProps;
};

export const getExistingProductCollectionsStep = createStep(
  'get-existing-product-collections',
  async ({ filters }: GetExistingProductCollectionsInput, { container }) => {
    const productModuleService = container.resolve('product');
    const logger = container.resolve('logger');
    const collections: ProductCollectionDTO[] = [];
    const take = 100;

    logger.info(
      `Retrieving existing collections in database for filters ${JSON.stringify(filters)}...`
    );

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const collectionsResponse =
        await productModuleService.listProductCollections(filters, {
          relations: ['products'],
          take,
          skip,
        });

      collections.push(...collectionsResponse);
      skip = skip + take;
      hasMore = collectionsResponse.length === take;
    }

    logger.info(
      `Successfully retrieved ${collections.length} existing Collections in Medusa database!`
    );

    return new StepResponse({ collections });
  }
);
