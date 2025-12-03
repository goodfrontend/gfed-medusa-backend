import type {
  CreateProductCollectionDTO,
  ProductCollectionDTO,
} from '@medusajs/framework/types';
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from '@medusajs/framework/workflows-sdk';

import { sanitizeHandle } from '../lib/utils';
import { ShopifyCollection } from '../modules/shopify/types';
import { getExistingProductCollectionsStep } from './steps/get-existing-product-collections';
import { upsertCollectionsStep } from './steps/upsert-collections';

type RetrieveOrCreateCollectionWorkflowInput = {
  collection: ShopifyCollection;
};

export const retrieveOrCreateCollectionWorkflow = createWorkflow(
  'retrieve-or-create-collection',
  ({ collection }: RetrieveOrCreateCollectionWorkflowInput) => {
    const collectionHandle = transform({ collection }, (data) =>
      sanitizeHandle(data.collection.handle)
    );

    const { collections: dbCollections } = getExistingProductCollectionsStep({
      filters: {
        handle: collectionHandle,
      },
    });

    const collectionData: CreateProductCollectionDTO = transform(
      { collection, dbCollections },
      (data) => {
        const dbCollection = data.dbCollections[0];

        return {
          title: data.collection.title,
          handle: data.collection.handle,
          ...(dbCollection?.id
            ? {
                id: dbCollection.id,
              }
            : null),
        };
      }
    );

    const { collections: upsertedCollections } = upsertCollectionsStep([
      collectionData,
    ]);

    const upsertedCollection: ProductCollectionDTO = transform(
      { upsertedCollections },
      (data) => data.upsertedCollections[0]
    );

    return new WorkflowResponse({ collection: upsertedCollection });
  }
);
