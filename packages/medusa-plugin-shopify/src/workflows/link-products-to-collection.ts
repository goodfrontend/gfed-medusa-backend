import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from '@medusajs/framework/workflows-sdk';
import { batchLinkProductsToCollectionWorkflow } from '@medusajs/medusa/core-flows';

import { ShopifyCollection } from '../modules/shopify/types';
import { retrieveOrCreateCollectionWorkflow } from './retrieve-or-create-collection';
import { extractShopifyProductsInCollectionStep } from './steps/extract-shopify-products-in-collection';
import { getExistingProductsStep } from './steps/get-existing-products';
import { logMessageStep } from './steps/log-message';

type LinkProductsToCollectionWorkflowInput = {
  collection: ShopifyCollection;
  hardLimit?: number;
};

export const linkProductsToCollectionWorkflow = createWorkflow(
  'link-products-to-collection',
  ({ collection, hardLimit }: LinkProductsToCollectionWorkflowInput) => {
    const { collection: medusaCollection } =
      retrieveOrCreateCollectionWorkflow.runAsStep({
        input: {
          collection,
        },
      });

    const medusaCollectionId = transform(
      { medusaCollection },
      (data) => data.medusaCollection?.id
    );

    const { products: productsInCollection } =
      extractShopifyProductsInCollectionStep({
        collection,
        hardLimit,
      });

    const step1Message = transform(
      { productsInCollection, collection },
      (data) =>
        `Retrieved ${data.productsInCollection.length} products in Shopify collection ${data.collection.handle}`
    );

    logMessageStep({ message: step1Message }).config({
      name: 'step-1-message',
    });

    const externalIdFilters = transform({ productsInCollection }, (data) =>
      data.productsInCollection
        .map((p) => p.id.toString())
        .filter((id) => Boolean(id))
    );

    const step2Message = transform(
      { externalIdFilters },
      (data) =>
        `Retrieving products from Medusa with ${data.externalIdFilters.length} external ID filters`
    );

    logMessageStep({ message: step2Message }).config({
      name: 'step-2-message',
    });

    const { existingProducts } = getExistingProductsStep({
      filters: {
        external_id: externalIdFilters,
      },
    });

    const step3Message = transform(
      { existingProducts, collection },
      (data) =>
        `Retrieved ${data.existingProducts.length} existing products from Medusa matching products in Shopify collection ${data.collection.handle}`
    );

    logMessageStep({ message: step3Message }).config({
      name: 'step-3-message',
    });

    const productsInCollectionIds = transform({ existingProducts }, (data) =>
      data.existingProducts.map((existingProduct) => existingProduct.id)
    );

    batchLinkProductsToCollectionWorkflow.runAsStep({
      input: {
        id: medusaCollectionId,
        add: productsInCollectionIds,
      },
    });

    return new WorkflowResponse({ done: true });
  }
);
