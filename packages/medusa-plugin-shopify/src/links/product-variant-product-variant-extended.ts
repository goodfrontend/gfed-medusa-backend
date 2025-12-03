import { defineLink } from '@medusajs/framework/utils';
import ProductModule from '@medusajs/medusa/product';

import ProductExtendedModule from '../modules/product-extended';

export default defineLink(
  ProductModule.linkable.productVariant,
  ProductExtendedModule.linkable.productVariantExtended
);
