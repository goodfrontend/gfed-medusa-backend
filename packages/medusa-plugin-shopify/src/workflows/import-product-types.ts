import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from '@medusajs/framework/workflows-sdk';
import { createProductTypesWorkflow } from '@medusajs/medusa/core-flows';

import { ShopifyProduct } from '../modules/shopify/types';
import { getExistingProductTypesStep } from './steps/get-existing-product-types';
import { logMessageStep } from './steps/log-message';

export type ImportProductTypesWorkflowInput = {
  products: ShopifyProduct[];
};

export const importProductTypesWorkflowId = 'import-product-types';

export const importProductTypesWorkflow = createWorkflow(
  {
    name: importProductTypesWorkflowId,
  },
  ({ products }: ImportProductTypesWorkflowInput) => {
    logMessageStep({
      message: 'Importing Product Types to Medusa database...',
    }).config({ name: 'import-product-types-start' });

    const productTypes = transform({ products }, (data) => {
      const productTypesArray = data.products.map(
        (product) => product.product_type
      );
      const uniqueProductTypes = [...new Set(productTypesArray)];

      return uniqueProductTypes.map((type) => ({ value: type }));
    });

    const { productTypes: existingProductTypes } = getExistingProductTypesStep(
      {}
    );

    const productTypesToCreate = transform(
      { productTypes, existingProductTypes },
      (data) => {
        return data.productTypes.filter((productType) => {
          const existingType = data.existingProductTypes.find(
            (existing) => existing.value === productType.value
          );

          return !existingType;
        });
      }
    );

    createProductTypesWorkflow.runAsStep({
      input: {
        product_types: productTypesToCreate,
      },
    });

    logMessageStep({
      message: transform(
        { productTypesToCreate },
        (data) =>
          `Successfully imported ${data.productTypesToCreate.length} Product Types to Medusa database!`
      ),
    }).config({ name: 'import-product-types-end' });

    return new WorkflowResponse({ done: true });
  }
);
