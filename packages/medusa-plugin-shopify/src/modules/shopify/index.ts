import { Module } from '@medusajs/framework/utils';

import ShopifyModuleService from './service';

export const SHOPIFY_MODULE = 'shopify';

export default Module(SHOPIFY_MODULE, {
  service: ShopifyModuleService,
});
