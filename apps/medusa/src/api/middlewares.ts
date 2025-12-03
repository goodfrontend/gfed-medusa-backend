import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework/http';
import { createFindParams } from '@medusajs/medusa/api/utils/validators';

import {
  AdminCreateReward,
  AdminDeleteReward,
  AdminUpdateReward,
} from './admin/rewards/validators';
import {
  CartRedeemReward,
  CartUnredeemReward,
} from './store/carts/[id]/redeem-reward/validators';
import { PostStoreCreateWishlistItem } from './store/customers/me/wishlists/items/validators';

export const GetRewardsSchema = createFindParams();

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
      matcher: '/store/customers/me/wishlists/items',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostStoreCreateWishlistItem)],
    },
  ],
});
