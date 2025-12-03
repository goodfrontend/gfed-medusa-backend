import type {
  ProductCollectionDTO,
  UpsertProductCollectionDTO,
} from '@medusajs/framework/types';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { sanitizeHandle } from '../../lib/utils';
import { ShopifyCollection } from '../../modules/shopify/types';

type PrepareCollectionsForImportStepInput = {
  collections: ShopifyCollection[];
  existingCollections: ProductCollectionDTO[];
};

export const prepareCollectionsForImportStep = createStep(
  'prepare-collections-for-import',
  async ({
    collections,
    existingCollections,
  }: PrepareCollectionsForImportStepInput) => {
    const collectionsToCreate = new Map<string, UpsertProductCollectionDTO>();
    const collectionsToUpdate = new Map<string, UpsertProductCollectionDTO>();

    collections.forEach((shopifyCollection) => {
      const collectionHandle = sanitizeHandle(shopifyCollection.handle);
      const collectionTitle = shopifyCollection.title;
      const collectionId = shopifyCollection.id.toString();

      const existingCollection = existingCollections.find(
        (existingCollection) =>
          existingCollection.handle === collectionHandle ||
          existingCollection.metadata?.external_id ===
            shopifyCollection.id.toString()
      );

      const collectionData: UpsertProductCollectionDTO = {
        title: collectionTitle,
        handle: collectionHandle,
        metadata: {
          external_id: collectionId,
        },
        ...(existingCollection?.id
          ? {
              id: existingCollection.id,
            }
          : null),
      };

      if (existingCollection?.id) {
        collectionsToUpdate.set(existingCollection.id, collectionData);
      } else {
        collectionsToCreate.set(
          shopifyCollection.id.toString(),
          collectionData
        );
      }
    });

    return new StepResponse({
      collectionsToCreate: Array.from(collectionsToCreate.values()),
      collectionsToUpdate: Array.from(collectionsToUpdate.values()),
    });
  }
);
