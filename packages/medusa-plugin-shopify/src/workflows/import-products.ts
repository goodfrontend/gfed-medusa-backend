import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from '@medusajs/framework/workflows-sdk';
import {
  createProductsWorkflow,
  updateProductsWorkflow,
  useQueryGraphStep,
} from '@medusajs/medusa/core-flows';

import { ShopifyProduct } from '../modules/shopify/types';
import { getExistingProductTagsStep } from './steps/get-existing-product-tags';
import { getExistingProductTypesStep } from './steps/get-existing-product-types';
import { getExistingProductsStep } from './steps/get-existing-products';
import { prepareProductsForImportStep } from './steps/prepare-products-for-import';

export type ImportProductsWorkflowInput = {
  products: ShopifyProduct[];
};

export const importProductsWorkflowId = 'import-shopify-products';

export const importProductsWorkflow = createWorkflow(
  {
    name: importProductsWorkflowId,
  },
  ({ products }: ImportProductsWorkflowInput) => {
    const { tags: productTags } = getExistingProductTagsStep({});
    const { productTypes } = getExistingProductTypesStep({});
    const { data: stores } = useQueryGraphStep({
      entity: 'store',
      fields: ['supported_currencies.*', 'default_sales_channel_id'],
      pagination: {
        take: 1,
        skip: 0,
      },
    });

    const { data: shippingProfiles } = useQueryGraphStep({
      entity: 'shipping_profile',
      fields: ['id'],
      pagination: {
        take: 1,
        skip: 0,
      },
    }).config({ name: 'get-shipping-profiles' });

    const externalIdFilters = transform(
      {
        products,
      },
      (data) => {
        return data.products.map((product) => product.id.toString());
      }
    );

    const { existingProducts } = getExistingProductsStep({
      filters: {
        external_id: externalIdFilters,
      },
    });

    const {
      productsToCreate,
      productsToUpdate,
      productsToCreateAdditionalData,
      productsToUpdateAdditionalData,
      variantsToCreateAdditionalData,
      variantsToUpdateAdditionalData,
    } = prepareProductsForImportStep({
      products,
      stores,
      shippingProfiles,
      existingProducts,
      productTags,
      productTypes,
    });

    createProductsWorkflow.runAsStep({
      input: {
        products: productsToCreate,
        additional_data: {
          isFromMigration: true,
          products: productsToCreateAdditionalData,
          variants: variantsToCreateAdditionalData,
        },
      },
    });

    updateProductsWorkflow.runAsStep({
      input: {
        products: productsToUpdate,
        additional_data: {
          isFromMigration: true,
          products: productsToUpdateAdditionalData,
          variants: variantsToUpdateAdditionalData,
        },
      },
    });

    return new WorkflowResponse({ done: true });
  }
);
