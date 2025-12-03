import type {
  FilterableProductTypeProps,
  ProductTypeDTO,
} from '@medusajs/framework/types';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

export type GetExistingProductTypesInput = {
  filters?: FilterableProductTypeProps;
};

export const getExistingProductTypesStep = createStep(
  'get-existing-product-types',
  async ({ filters }: GetExistingProductTypesInput, { container }) => {
    const productModuleService = container.resolve('product');
    const logger = container.resolve('logger');
    const productTypes: ProductTypeDTO[] = [];
    const take = 100;

    const activityId = logger.activity(
      'Retrieving existing Product Types in Medusa database...'
    );

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const typesResponse = await productModuleService.listProductTypes(
        filters,
        {
          take,
          skip,
        }
      );

      productTypes.push(...typesResponse);
      skip = skip + take;
      hasMore = typesResponse.length === take;
    }

    logger.success(
      activityId,
      `Successfully retrieved ${productTypes.length} existing Product Types from Medusa database!`
    );

    return new StepResponse({ productTypes });
  }
);
