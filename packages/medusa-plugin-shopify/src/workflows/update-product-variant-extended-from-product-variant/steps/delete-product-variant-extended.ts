import { InferTypeOf } from '@medusajs/framework/types';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { PRODUCT_EXTENDED_MODULE } from '../../../modules/product-extended';
import ProductVariantExtended from '../../../modules/product-extended/models/product-variant-extended';
import ProductExtendedModuleService from '../../../modules/product-extended/service';

type DeleteProductVariantExtendedStepInput = {
  productVariantExtended: InferTypeOf<typeof ProductVariantExtended>;
};

export const deleteProductVariantExtendedStep = createStep(
  'delete-product-variant-extended',
  async (
    { productVariantExtended }: DeleteProductVariantExtendedStepInput,
    { container }
  ) => {
    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    await productExtendedModuleService.deleteProductVariantExtendeds(
      productVariantExtended.id
    );

    return new StepResponse(productVariantExtended, productVariantExtended);
  },
  async (productVariantExtended, { container }) => {
    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    await productExtendedModuleService.createProductVariantExtendeds(
      productVariantExtended!
    );
  }
);
