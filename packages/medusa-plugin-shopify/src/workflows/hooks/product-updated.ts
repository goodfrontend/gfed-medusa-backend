import { updateProductsWorkflow } from '@medusajs/medusa/core-flows';

import {
  UpdateProductExtendedFromProductStepInput,
  updateProductExtendedFromProductWorkflow,
} from '../update-product-extended-from-product';
import {
  UpdateProductVariantExtendedFromProductStepInput,
  updateProductVariantExtendedFromProductWorkflow,
} from '../update-product-variant-extended-from-product-variant';

updateProductsWorkflow.hooks.productsUpdated(
  async ({ products, additional_data }, { container }) => {
    const workflow = updateProductExtendedFromProductWorkflow(container);
    const variantWorkflow =
      updateProductVariantExtendedFromProductWorkflow(container);

    for (const product of products) {
      const productId = product.id;
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
        } as UpdateProductExtendedFromProductStepInput,
      });

      if (additional_data?.isFromMigration) {
        for (const variant of product.variants) {
          const variantId = variant.id;
          const additionalVariantsData = variantId
            ? (
                additional_data as {
                  variants: Record<string, Record<string, unknown>>;
                }
              ).variants[variantId]
            : {};

          await variantWorkflow.run({
            input: {
              variant,
              additional_data: additionalVariantsData,
            } as UpdateProductVariantExtendedFromProductStepInput,
          });
        }
      }
    }
  }
);
