import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework/http';
import { createFindParams } from '@medusajs/medusa/api/utils/validators';
import rateLimit from 'express-rate-limit';

import {
  AdminGetPersonalizationExportQuery,
} from './admin/personalization/export/validators';
import {
  AdminCreateReward,
  AdminDeleteReward,
  AdminUpdateReward,
} from './admin/rewards/validators';
import { PostPersonalizationConversionBody } from './webhooks/personalization/conversions/validators';
import { PostPersonalizationSignalsBody } from './webhooks/personalization/signals/validators';
import { PostPersonalizationSyncLoginBody } from './webhooks/personalization/sync-login/validators';
import {
  CartRedeemReward,
  CartUnredeemReward,
} from './store/carts/[id]/redeem-reward/validators';
import { StoreGetCollectionsWithProductsParams } from './store/collections-with-products/validators';
import { PostStoreCreateWishlistItem } from './store/customers/me/wishlists/items/validators';
import { validateWebhookSignature } from '../utils/webhook-auth';

const DEFAULT_STORE_COLLECTION_FIELDS = [
  'id',
  'title',
  'handle',
  'created_at',
  'updated_at',
];

export const GetRewardsSchema = createFindParams();
const personalizationWebhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded' },
});

export default defineMiddlewares({
  routes: [
    {
      matcher: '/admin/rewards',
      method: 'POST',
      middlewares: [validateAndTransformBody(AdminCreateReward)],
    },
    {
      matcher: '/admin/rewards',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(GetRewardsSchema, {
          defaults: ['id', 'points_cost', 'product.*'],
          isList: true,
        }),
      ],
    },
    {
      matcher: '/admin/rewards',
      method: 'DELETE',
      middlewares: [validateAndTransformBody(AdminDeleteReward)],
    },
    {
      matcher: '/admin/rewards',
      method: 'PATCH',
      middlewares: [validateAndTransformBody(AdminUpdateReward)],
    },
    {
      matcher: '/store/carts/:id/redeem-reward',
      method: 'POST',
      middlewares: [validateAndTransformBody(CartRedeemReward)],
    },
    {
      matcher: '/store/carts/:id/redeem-reward',
      method: 'DELETE',
      middlewares: [validateAndTransformBody(CartUnredeemReward)],
    },
    {
      matcher: '/store/collections-with-products',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(StoreGetCollectionsWithProductsParams, {
          defaults: DEFAULT_STORE_COLLECTION_FIELDS,
          defaultLimit: 10,
          isList: true,
        }),
      ],
    },
    {
      matcher: '/store/customers/me/wishlists/items',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostStoreCreateWishlistItem)],
    },
    {
      matcher: '/admin/personalization/export',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(AdminGetPersonalizationExportQuery, {}),
      ],
    },
    {
      matcher: '/webhooks/personalization/signals',
      method: 'POST',
      middlewares: [
        personalizationWebhookLimiter,
        validateWebhookSignature,
        validateAndTransformBody(PostPersonalizationSignalsBody),
      ],
    },
    {
      matcher: '/webhooks/personalization/conversions',
      method: 'POST',
      middlewares: [
        personalizationWebhookLimiter,
        validateWebhookSignature,
        validateAndTransformBody(PostPersonalizationConversionBody),
      ],
    },
    {
      matcher: '/webhooks/personalization/sync-login',
      method: 'POST',
      middlewares: [
        personalizationWebhookLimiter,
        validateWebhookSignature,
        validateAndTransformBody(PostPersonalizationSyncLoginBody),
      ],
    },
  ],
});
