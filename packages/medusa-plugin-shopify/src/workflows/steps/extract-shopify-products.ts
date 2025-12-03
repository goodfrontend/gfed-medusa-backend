import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { SHOPIFY_MODULE } from '../../modules/shopify';
import ShopifyModuleService from '../../modules/shopify/service';

export const extractShopifyProductsStep = createStep(
  'extract-shopify-products',
  async (hardLimit: number, { container }) => {
    const shopifyModuleService: ShopifyModuleService =
      container.resolve(SHOPIFY_MODULE);
    const logger = container.resolve('logger');

    const activityId = logger.activity('Extracting products from Shopify...');

    const response =
      await shopifyModuleService.extractShopifyProducts(hardLimit);

    logger.success(
      activityId,
      `Successfully extracted ${response.length} products from Shopify!`
    );

    return new StepResponse({ products: response });
  }
);
