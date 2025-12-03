import { createProductsWorkflow } from '@medusajs/medusa/core-flows';

import {
  CreateProductExtendedFromProductWorkflowInput,
  createProductExtendedFromProductWorkflow,
} from '../create-product-extended-from-product';
import {
  CreateProductVariantExtendedFromProductWorkflowInput,
  createProductVariantExtendedFromProductWorkflow,
} from '../create-product-variant-extended-from-product-variant';

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    const workflow = createProductExtendedFromProductWorkflow(container);
    const variantWorkflow =
      createProductVariantExtendedFromProductWorkflow(container);

    for (const product of products) {
      const productId = product.external_id;
      const additionalDataValue =
        additional_data?.isFromMigration && productId
          ? (
              additional_data as {
                products: Record<string, Record<string, unknown>>;
              }
            )?.products?.[productId]
          : additional_data;

      await workflow.run({
        input: {
          product,
          additional_data: additionalDataValue,
        } as CreateProductExtendedFromProductWorkflowInput,
      });

      if (additional_data?.isFromMigration) {
        for (const variant of product.variants) {
          const variantId = variant.metadata?.external_id;
          const additionalVariantsData = variantId
            ? (
                additional_data as {
                  variants: Record<string, Record<string, unknown>>;
                }
              ).variants[variantId as string]
            : {};

          await variantWorkflow.run({
            input: {
              variant,
              additional_data: additionalVariantsData,
            } as CreateProductVariantExtendedFromProductWorkflowInput,
          });
        }
      }
    }
  }
);
