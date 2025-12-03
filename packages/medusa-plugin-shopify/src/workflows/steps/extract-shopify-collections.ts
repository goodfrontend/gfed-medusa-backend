import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { SHOPIFY_MODULE } from '../../modules/shopify';
import ShopifyModuleService from '../../modules/shopify/service';

export const extractShopifyCollectionsStep = createStep(
  'extract-shopify-collections',
  async (hardLimit: number, { container }) => {
    const shopifyModuleService: ShopifyModuleService =
      container.resolve(SHOPIFY_MODULE);
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

    const activityId = logger.activity(
      'Extracting collections from Shopify...'
    );

    const response =
      await shopifyModuleService.extractShopifyCollections(hardLimit);

    logger.success(
      activityId,
      `Successfully extracted ${response.length} collections from Shopify!`
    );

    return new StepResponse({ collections: response });
  }
);
