import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from '@medusajs/framework/workflows-sdk';

import { sanitizeHandle } from '../lib/utils';
import { ShopifyCollection } from '../modules/shopify/types';
import { getExistingProductCollectionsStep } from './steps/get-existing-product-collections';
import { prepareCollectionsForImportStep } from './steps/prepare-collections-for-import';
import { upsertCollectionsStep } from './steps/upsert-collections';

export type ImportCollectionsWorkflowInput = {
  collections: ShopifyCollection[];
};

export const importCollectionsWorkflowId = 'import-collections';

export const importCollectionsWorkflow = createWorkflow(
  {
    name: importCollectionsWorkflowId,
  },
  ({ collections }: ImportCollectionsWorkflowInput) => {
    const { collectionHandles } = transform({ collections }, (data) => {
      return {
        collectionHandles: data.collections?.map((c) =>
          sanitizeHandle(c.handle)
        ),
      };
    });

    const { collections: existingCollections } =
      getExistingProductCollectionsStep({
        filters: {
          handle: collectionHandles,
        },
      });

    const { collectionsToCreate, collectionsToUpdate } =
      prepareCollectionsForImportStep({
        collections,
        existingCollections,
      });

    upsertCollectionsStep(collectionsToCreate).config({
      name: 'create-collections-step',
    });

    upsertCollectionsStep(collectionsToUpdate).config({
      name: 'update-collections-step',
    });

    return new WorkflowResponse({ done: true });
  }
);
