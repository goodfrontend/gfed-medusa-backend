import { InferTypeOf, ProductVariantDTO } from '@medusajs/framework/types';
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
import ProductVariantExtended from '../../modules/product-extended/models/product-variant-extended';
import { createProductVariantExtendedStep } from '../create-product-variant-extended-from-product-variant/steps/create-product-variant-extended';
import { deleteProductVariantExtendedStep } from './steps/delete-product-variant-extended';
import { updateProductVariantExtendedStep } from './steps/update-product-variant-extended';

export type UpdateProductVariantExtendedFromProductStepInput = {
  variant: ProductVariantDTO;
  additional_data?: {
    requires_shipping?: boolean;
  };
};

export const updateProductVariantExtendedFromProductWorkflow = createWorkflow(
  'update-product-variant-extended-from-product',
  (input: UpdateProductVariantExtendedFromProductStepInput) => {
    const { data: variants } = useQueryGraphStep({
      entity: 'product_variant',
      fields: ['product_variant_extended.*'],
      filters: {
        id: input.variant.id,
      },
    });

    const created = when(
      'create-product-variant-product-variant-extended-link',
      {
        input,
        variants,
      },
      (data) =>
        Boolean(
          !data.variants[0].product_variant_extended &&
            (data.input.additional_data?.requires_shipping !== null ||
              data.input.additional_data?.requires_shipping !== undefined)
        )
    ).then(() => {
      const productVariantExtended = createProductVariantExtendedStep({
        requires_shipping: input.additional_data!.requires_shipping,
      });

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

      return productVariantExtended;
    });

    const deleted = when(
      'delete-product-variant-product-variant-extended-link',
      {
        input,
        variants,
      },
      (data) =>
        Boolean(
          data.variants[0].product_variant_extended &&
            (data.input.additional_data?.requires_shipping === null ||
              data.input.additional_data?.requires_shipping === undefined)
        )
    ).then(() => {
      deleteProductVariantExtendedStep({
        productVariantExtended: variants[0]
          .product_variant_extended as InferTypeOf<
          typeof ProductVariantExtended
        >,
      });

      dismissRemoteLinkStep({
        [PRODUCT_EXTENDED_MODULE]: {
          product_variant_extended: variants[0].product_variant_extended!.id,
        },
      });

      return variants[0].product_variant_extended!.id;
    });

    const updated = when(
      {
        input,
        variants,
      },
      (data) =>
        Boolean(
          data.variants[0].product_variant_extended &&
            (data.input.additional_data?.requires_shipping !== null ||
              data.input.additional_data?.requires_shipping !== undefined)
        )
    ).then(() => {
      return updateProductVariantExtendedStep({
        id: variants[0].product_variant_extended!.id,
        requires_shipping: input.additional_data!.requires_shipping as boolean,
      });
    });

    return new WorkflowResponse({
      created,
      updated,
      deleted,
    });
  }
);
