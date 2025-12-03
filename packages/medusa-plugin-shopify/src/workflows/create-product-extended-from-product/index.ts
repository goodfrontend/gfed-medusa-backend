import { ProductDTO } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from '@medusajs/framework/workflows-sdk';
import { createRemoteLinkStep } from '@medusajs/medusa/core-flows';

import { PRODUCT_EXTENDED_MODULE } from '../../modules/product-extended';
import { createProductExtendedStep } from './steps/create-product-extended';

export type CreateProductExtendedFromProductWorkflowInput = {
  product: ProductDTO;
  additional_data?: {
    vendor?: string;
  };
};

export const createProductExtendedFromProductWorkflow = createWorkflow(
  'create-product-extended-from-product',
  (input: CreateProductExtendedFromProductWorkflowInput) => {
    const productExtendedVendor = transform(
      {
        input,
      },
      (data) => data.input.additional_data?.vendor || ''
    );

    const productExtended = createProductExtendedStep({
      vendor: productExtendedVendor,
    });

    when(
      { productExtended },
      ({ productExtended }) => productExtended !== undefined
    ).then(() => {
      createRemoteLinkStep([
        {
          [Modules.PRODUCT]: {
            product_id: input.product.id,
          },
          [PRODUCT_EXTENDED_MODULE]: {
            product_extended_id: productExtended.id,
          },
        },
      ]);
    });

    return new WorkflowResponse({
      productExtended,
    });
  }
);
