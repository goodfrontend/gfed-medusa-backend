import { defineLink } from '@medusajs/framework/utils';
import ProductModule from '@medusajs/medusa/product';

import LoyaltyModule from '../modules/loyalty';

export default defineLink(
  LoyaltyModule.linkable.reward,
  ProductModule.linkable.product
);
