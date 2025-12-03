import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { PRODUCT_EXTENDED_MODULE } from '../../../modules/product-extended';
import ProductExtendedModuleService from '../../../modules/product-extended/service';

type UpdateProductVariantExtendedStepInput = {
  id: string;
  requires_shipping: boolean;
};

export const updateProductVariantExtendedStep = createStep(
  'update-product-variant-extended',
  async (
    { id, requires_shipping }: UpdateProductVariantExtendedStepInput,
    { container }
  ) => {
    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    const prevData =
      await productExtendedModuleService.retrieveProductVariantExtended(id);

    const productVariantExtended =
      await productExtendedModuleService.updateProductVariantExtendeds({
        id,
        requires_shipping,
      });

    return new StepResponse(productVariantExtended, prevData);
  },
  async (prevData, { container }) => {
    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    await productExtendedModuleService.updateProductVariantExtendeds(prevData!);
  }
);
