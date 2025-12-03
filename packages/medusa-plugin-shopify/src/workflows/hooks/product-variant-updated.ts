import { updateProductVariantsWorkflow } from '@medusajs/medusa/core-flows';

import {
  UpdateProductVariantExtendedFromProductStepInput,
  updateProductVariantExtendedFromProductWorkflow,
} from '../update-product-variant-extended-from-product-variant';

updateProductVariantsWorkflow.hooks.productVariantsUpdated(
  async ({ product_variants, additional_data }, { container }) => {
    const workflow = updateProductVariantExtendedFromProductWorkflow(container);

    if (additional_data) {
      for (const productVariant of product_variants) {
        await workflow.run({
          input: {
            variant: productVariant,
            additional_data,
          } as UpdateProductVariantExtendedFromProductStepInput,
        });
      }
    }
  }
);
