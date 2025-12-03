import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { PRODUCT_EXTENDED_MODULE } from '../../../modules/product-extended';
import ProductExtendedModuleService from '../../../modules/product-extended/service';

type UpdateProductExtendedStepInput = {
  id: string;
  vendor: string;
};

export const updateProductExtendedStep = createStep(
  'update-product-extended',
  async ({ id, vendor }: UpdateProductExtendedStepInput, { container }) => {
    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    const prevData =
      await productExtendedModuleService.retrieveProductExtended(id);

    const productExtended =
      await productExtendedModuleService.updateProductExtendeds({
        id,
        vendor,
      });

    return new StepResponse(productExtended, prevData);
  },
  async (prevData, { container }) => {
    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    await productExtendedModuleService.updateProductExtendeds(prevData!);
  }
);
