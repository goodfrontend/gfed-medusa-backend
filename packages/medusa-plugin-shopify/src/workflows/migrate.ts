import {
  WorkflowResponse,
  createWorkflow,
} from '@medusajs/framework/workflows-sdk';

import { importCollectionsWorkflow } from './import-collections';
import { importProductTagsWorkflow } from './import-product-tags';
import { importProductTypesWorkflow } from './import-product-types';
import { importProductsWorkflow } from './import-products';
import { extractShopifyCollectionsStep } from './steps/extract-shopify-collections';
import { extractShopifyProductsStep } from './steps/extract-shopify-products';

export const migrateWorkflowId = 'migrate-shopify-data';

export type MigrateShopifyDataWorkflowInput = {
  hardLimitProducts: number;
  hardLimitCollections: number;
};

export const migrateShopifyDataWorkflow = createWorkflow(
  migrateWorkflowId,
  ({
    hardLimitProducts,
    hardLimitCollections,
  }: MigrateShopifyDataWorkflowInput) => {
    // Extract available Shopify data
    const { products } = extractShopifyProductsStep(hardLimitProducts);
    const { collections } = extractShopifyCollectionsStep(hardLimitCollections);

    // Import entities to Medusa
    importProductTypesWorkflow.runAsStep({
      input: {
        products,
      },
    });

    importProductTagsWorkflow.runAsStep({
      input: {
        products,
      },
    });

    importCollectionsWorkflow.runAsStep({
      input: {
        collections,
      },
    });

    importProductsWorkflow.runAsStep({
      input: {
        products,
      },
    });

    return new WorkflowResponse({ collections });
  }
);
