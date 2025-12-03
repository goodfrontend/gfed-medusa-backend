import { InferTypeOf } from '@medusajs/framework/types';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { PRODUCT_EXTENDED_MODULE } from '../../../modules/product-extended';
import ProductExtended from '../../../modules/product-extended/models/product-extended';
import ProductExtendedModuleService from '../../../modules/product-extended/service';

type DeleteProductExtendedStepInput = {
  productExtended: InferTypeOf<typeof ProductExtended>;
};

export const deleteProductExtendedStep = createStep(
  'delete-product-extended',
  async (
    { productExtended }: DeleteProductExtendedStepInput,
    { container }
  ) => {
    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    await productExtendedModuleService.deleteProductExtendeds(
      productExtended.id
    );

    return new StepResponse(productExtended, productExtended);
  },
  async (productExtended, { container }) => {
    const productExtendedModuleService: ProductExtendedModuleService =
      container.resolve(PRODUCT_EXTENDED_MODULE);

    await productExtendedModuleService.createProductExtendeds(productExtended!);
  }
);
