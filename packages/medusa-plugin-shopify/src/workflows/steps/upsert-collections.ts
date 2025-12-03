import type { UpsertProductCollectionDTO } from '@medusajs/framework/types';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

export const upsertCollectionsStep = createStep(
  'upsert-collections',
  async (collections: UpsertProductCollectionDTO[], { container }) => {
    const productService = container.resolve('product');

    const collectionsResponse =
      await productService.upsertProductCollections(collections);

    return new StepResponse({ collections: collectionsResponse });
  }
);
