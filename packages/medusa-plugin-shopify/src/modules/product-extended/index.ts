import { Module } from '@medusajs/framework/utils';

import ProductExtendedModuleService from './service';

export const PRODUCT_EXTENDED_MODULE = 'productExtended';

export default Module(PRODUCT_EXTENDED_MODULE, {
  service: ProductExtendedModuleService,
});
