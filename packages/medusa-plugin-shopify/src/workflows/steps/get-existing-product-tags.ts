import type {
  FilterableProductTagProps,
  ProductTagDTO,
} from '@medusajs/framework/types';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

export type GetExistingProductTagsInput = {
  filters?: FilterableProductTagProps;
};

export const getExistingProductTagsStep = createStep(
  'get-existing-product-tags',
  async ({ filters }: GetExistingProductTagsInput, { container }) => {
    const productModuleService = container.resolve('product');
    const logger = container.resolve('logger');
    const tags: ProductTagDTO[] = [];
    const take = 100;

    const activityId = logger.activity(
      `Retrieving existing Product Tags in Medusa database...`
    );

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const tagsResponse = await productModuleService.listProductTags(filters, {
        take,
        skip,
      });

      tags.push(...tagsResponse);
      skip = skip + take;
      hasMore = tagsResponse.length === take;
    }

    logger.success(
      activityId,
      `Successfully retrieved ${tags.length} existing Product Tags in Medusa database!`
    );

    return new StepResponse({ tags });
  }
);
