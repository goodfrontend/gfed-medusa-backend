import { ProductVariantDTO } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from '@medusajs/framework/workflows-sdk';
import { createRemoteLinkStep } from '@medusajs/medusa/core-flows';

import { PRODUCT_EXTENDED_MODULE } from '../../modules/product-extended';
import { createProductVariantExtendedStep } from './steps/create-product-variant-extended';

export type CreateProductVariantExtendedFromProductWorkflowInput = {
  variant: ProductVariantDTO;
  additional_data?: {
    requires_shipping?: boolean;
  };
};

export const createProductVariantExtendedFromProductWorkflow = createWorkflow(
  'create-product-variant-extended-from-product',
  (input: CreateProductVariantExtendedFromProductWorkflowInput) => {
    const productExtendedRequiresShipping = transform(
      {
        input,
      },
      (data) => data.input.additional_data?.requires_shipping ?? undefined
    );

    const productVariantExtended = createProductVariantExtendedStep({
      requires_shipping: productExtendedRequiresShipping,
    });

    when(
      { productVariantExtended },
      ({ productVariantExtended }) => productVariantExtended !== undefined
    ).then(() => {
      createRemoteLinkStep([
        {
          [Modules.PRODUCT]: {
            product_variant_id: input.variant.id,
          },
          [PRODUCT_EXTENDED_MODULE]: {
            product_variant_extended_id: productVariantExtended.id,
          },
        },
      ]);
    });

    return new WorkflowResponse({
      productVariantExtended,
    });
  }
);
