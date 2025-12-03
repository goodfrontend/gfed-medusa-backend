import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { PRODUCT_EXTENDED_MODULE } from '../../../modules/product-extended';
import ProductExtendedModuleService from '../../../modules/product-extended/service';

type CreateProductVariantExtendedStepInput = {
  requires_shipping?: boolean;
};

export const createProductVariantExtendedStep = createStep(
  'create-product-variant-extended',
  async (data: CreateProductVariantExtendedStepInput, { container }) => {
    if (
      data.requires_shipping === null ||
      data.requires_shipping === undefined
    ) {
      return;
    }

    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    const productExtended =
      await productExtendedModuleService.createProductVariantExtendeds(data);

    return new StepResponse(productExtended, productExtended);
  },
  async (productExtended, { container }) => {
    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    await productExtendedModuleService.deleteProductVariantExtendeds(
      productExtended!.id
    );
  }
);
