import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { PRODUCT_EXTENDED_MODULE } from '../../../modules/product-extended';
import ProductExtendedModuleService from '../../../modules/product-extended/service';

type CreateProductExtendedStepInput = {
  vendor?: string;
};

export const createProductExtendedStep = createStep(
  'create-product-extended',
  async (data: CreateProductExtendedStepInput, { container }) => {
    if (data.vendor === null || data.vendor === undefined) {
      return;
    }

    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    const productExtended =
      await productExtendedModuleService.createProductExtendeds(data);

    return new StepResponse(productExtended, productExtended);
  },
  async (productExtended, { container }) => {
    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    await productExtendedModuleService.deleteProductExtendeds(
      productExtended!.id
    );
  }
);
