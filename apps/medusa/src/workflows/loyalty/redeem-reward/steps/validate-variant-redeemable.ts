import { ProductDTO } from '@medusajs/framework/types';
import { MedusaError } from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

export type ValidateVariantRedeemableStepInput = {
  product: ProductDTO;
  variant_id: string;
};

export const validateVariantRedeemableStep = createStep(
  'validate-variant-redeemable',
  async ({ product, variant_id }: ValidateVariantRedeemableStepInput) => {
    const isRedeemable = Boolean(
      product.variants.find((variant) => variant.id === variant_id)
    );

    if (!isRedeemable) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'The product variant is not redeemable'
      );
    }

    return new StepResponse(true);
  }
);
