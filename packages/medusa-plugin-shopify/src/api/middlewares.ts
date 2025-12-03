import { z } from 'zod';

import {
  defineMiddlewares,
  validateAndTransformQuery,
} from '@medusajs/framework/http';

import { GetProductVariantsWithCustomSchema } from './admin/product-variants-with-custom-properties/route';
import { GetProductsWithCustomSchema } from './admin/products-with-custom-properties/route';

export default defineMiddlewares({
  routes: [
    {
      method: 'POST',
      matcher: '/admin/products',
      additionalDataValidator: {
        vendor: z.string().optional(),
      },
    },
    {
      method: 'POST',
      matcher: '/admin/products/:id',
      additionalDataValidator: {
        vendor: z.string().nullish(),
      },
    },
    {
      method: 'POST',
      matcher: '/admin/products/:id/variants',
      additionalDataValidator: {
        requires_shipping: z.boolean().optional(),
      },
    },
    {
      method: 'POST',
      matcher: '/admin/products/:id/variants/:variant_id',
      additionalDataValidator: {
        requires_shipping: z.boolean().nullish(),
      },
    },
    {
      method: 'GET',
      matcher: '/admin/products-with-custom-properties',
      middlewares: [
        validateAndTransformQuery(GetProductsWithCustomSchema, {
          isList: true,
        }),
      ],
    },
    {
      method: 'GET',
      matcher: '/admin/product-variants-with-custom-properties',
      middlewares: [
        validateAndTransformQuery(GetProductVariantsWithCustomSchema, {
          isList: true,
        }),
      ],
    },
  ],
});
