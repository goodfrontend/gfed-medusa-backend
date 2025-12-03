import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from '@medusajs/framework/workflows-sdk';
import { createProductTagsWorkflow } from '@medusajs/medusa/core-flows';

import { ShopifyProduct } from '../modules/shopify/types';
import { getExistingProductTagsStep } from './steps/get-existing-product-tags';
import { logMessageStep } from './steps/log-message';

export type ImportProductTagsWorkflowInput = {
  products: ShopifyProduct[];
};

export const importProductTagsWorkflowId = 'import-product-tags';

export const importProductTagsWorkflow = createWorkflow(
  {
    name: importProductTagsWorkflowId,
  },
  ({ products }: ImportProductTagsWorkflowInput) => {
    logMessageStep({
      message: 'Importing Product Tags to Medusa database...',
    }).config({ name: 'import-product-tags-start' });

    const { productTags, tagValues } = transform({ products }, (data) => {
      const productTagsFlat = data.products.flatMap((product) => product.tags);
      const uniqueProductTagsFlat = [...new Set(productTagsFlat)];

      const productTagsData = uniqueProductTagsFlat.map((tag) => ({
        value: tag,
      }));

      return {
        productTags: productTagsData,
        tagValues: productTagsData.map((tag) => tag.value),
      };
    });

    const { tags: existingProductTags } = getExistingProductTagsStep({
      filters: {
        value: tagValues,
      },
    });

    const productTagsToCreate = transform(
      { productTags, existingProductTags },
      (data) =>
        data.productTags.filter(
          (tag) =>
            !data.existingProductTags.find(
              (existingTag) => existingTag.value === tag.value
            )
        )
    );

    createProductTagsWorkflow
      .runAsStep({
        input: {
          product_tags: productTagsToCreate,
        },
      })
      .config({ skipOnPermanentFailure: true });

    logMessageStep({
      message: transform(
        { productTagsToCreate },
        (data) =>
          `Successfully imported ${data.productTagsToCreate.length} Product Tags to Medusa database!`
      ),
    }).config({ name: 'import-product-tags-end' });

    return new WorkflowResponse({ done: true });
  }
);
