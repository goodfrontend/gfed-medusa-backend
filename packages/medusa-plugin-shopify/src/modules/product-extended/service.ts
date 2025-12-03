import { MedusaService } from '@medusajs/framework/utils';

import ProductExtended from './models/product-extended';
import ProductVariantExtended from './models/product-variant-extended';

export default class ProductExtendedModuleService extends MedusaService({
  ProductExtended,
  ProductVariantExtended,
}) {}
