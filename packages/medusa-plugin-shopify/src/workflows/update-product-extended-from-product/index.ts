import { InferTypeOf, ProductDTO } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import {
  WorkflowResponse,
  createWorkflow,
  when,
} from '@medusajs/framework/workflows-sdk';
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from '@medusajs/medusa/core-flows';

import { PRODUCT_EXTENDED_MODULE } from '../../modules/product-extended';
import ProductExtended from '../../modules/product-extended/models/product-extended';
import { createProductExtendedStep } from '../create-product-extended-from-product/steps/create-product-extended';
import { deleteProductExtendedStep } from './steps/delete-product-extended';
import { updateProductExtendedStep } from './steps/update-product-extended';

export type UpdateProductExtendedFromProductStepInput = {
  product: ProductDTO;
  additional_data?: {
    vendor?: string;
  };
};

export const updateProductExtendedFromProductWorkflow = createWorkflow(
  'update-product-extended-from-product',
  (input: UpdateProductExtendedFromProductStepInput) => {
    const { data: products } = useQueryGraphStep({
      entity: 'product',
      fields: ['product_extended.*'],
      filters: {
        id: input.product.id,
      },
    });

    const created = when(
      'create-product-product-extended-link',
      {
        input,
        products,
      },
      (data) =>
        Boolean(
          !data.products[0].product_extended &&
            (data.input.additional_data?.vendor?.length ?? 0) > 0
        )
    ).then(() => {
      const productExtended = createProductExtendedStep({
        vendor: input.additional_data!.vendor,
      });

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

      return productExtended;
    });

    const deleted = when(
      'delete-product-product-extended-link',
      {
        input,
        products,
      },
      (data) =>
        Boolean(
          data.products[0].product_extended &&
            (data.input.additional_data?.vendor === null ||
              data.input.additional_data?.vendor?.length === 0)
        )
    ).then(() => {
      deleteProductExtendedStep({
        productExtended: products[0].product_extended as InferTypeOf<
          typeof ProductExtended
        >,
      });

      dismissRemoteLinkStep({
        [PRODUCT_EXTENDED_MODULE]: {
          product_extended: products[0].product_extended!.id,
        },
      });

      return products[0].product_extended!.id;
    });

    const updated = when(
      {
        input,
        products,
      },
      (data) =>
        Boolean(
          data.products[0].product_extended &&
            (data.input?.additional_data?.vendor?.length ?? 0) > 0
        )
    ).then(() => {
      return updateProductExtendedStep({
        id: products[0].product_extended!.id,
        vendor: input.additional_data!.vendor as string,
      });
    });

    return new WorkflowResponse({
      created,
      updated,
      deleted,
    });
  }
);
