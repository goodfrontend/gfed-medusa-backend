import type {
  FilterableProductProps,
  ProductDTO,
} from '@medusajs/framework/types';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

export type GetExistingProductsInput = {
  filters?: FilterableProductProps;
};

export const getExistingProductsStep = createStep(
  'get-existing-products',
  async ({ filters }: GetExistingProductsInput, { container }) => {
    const productModuleService = container.resolve('product');
    const logger = container.resolve('logger');
    const existingProducts: ProductDTO[] = [];
    const take = 100;

    const activityId = logger.activity(
      'Retrieving existing Products in Medusa database...'
    );

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const productsResponse = await productModuleService.listProducts(
        filters,
        {
          relations: ['options', 'images', 'variants'],
          take,
          skip,
        }
      );

      existingProducts.push(...productsResponse);
      skip = skip + take;
      hasMore = productsResponse.length === take;
    }

    logger.success(
      activityId,
      `Successfully retrieved ${existingProducts.length} existing Products from Medusa database!`
    );

    return new StepResponse({ existingProducts });
  }
);
