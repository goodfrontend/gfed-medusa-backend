import { createProductVariantsWorkflow } from '@medusajs/medusa/core-flows';

import {
  CreateProductVariantExtendedFromProductWorkflowInput,
  createProductVariantExtendedFromProductWorkflow,
} from '../create-product-variant-extended-from-product-variant';

createProductVariantsWorkflow.hooks.productVariantsCreated(
  async ({ product_variants, additional_data }, { container }) => {
    const workflow = createProductVariantExtendedFromProductWorkflow(container);

    if (additional_data) {
      for (const productVariant of product_variants) {
        await workflow.run({
          input: {
            variant: productVariant,
            additional_data,
          } as CreateProductVariantExtendedFromProductWorkflowInput,
        });
      }
    }
  }
);
