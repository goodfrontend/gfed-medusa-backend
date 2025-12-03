import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { SHOPIFY_MODULE } from '../../modules/shopify';
import ShopifyModuleService from '../../modules/shopify/service';
import { ShopifyCollection } from '../../modules/shopify/types';

type ExtractShopifyProductsInCollectionInput = {
  collection: ShopifyCollection;
  hardLimit?: number;
};

export const extractShopifyProductsInCollectionStep = createStep(
  'extract-shopify-products-in-collection',
  async (
    { collection, hardLimit }: ExtractShopifyProductsInCollectionInput,
    { container }
  ) => {
    const shopifyModuleService: ShopifyModuleService =
      container.resolve(SHOPIFY_MODULE);
    const logger = container.resolve('logger');

    const activityId = logger.activity(
      `Extracting list of products in collection ${collection.handle} (Shopify ID: ${collection.id})`
    );

    const response =
      await shopifyModuleService.extractShopifyProductsInCollection({
        collectionHandle: collection.handle,
        hardLimit,
      });

    logger.success(
      activityId,
      `Successfully extracted ${response.length} products from collection ${collection.handle} (Shopify ID: ${collection.id})!`
    );

    return new StepResponse({ products: response });
  }
);
