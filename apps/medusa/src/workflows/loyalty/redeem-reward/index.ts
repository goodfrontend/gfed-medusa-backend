import { type ProductDTO } from '@medusajs/framework/types';
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from '@medusajs/framework/workflows-sdk';
import {
  addToCartWorkflow,
  useQueryGraphStep,
} from '@medusajs/medusa/core-flows';

import { lockPointsStep } from '../steps/lock-points';
import { validateVariantRedeemableStep } from './steps/validate-variant-redeemable';

type RedeemRewardWorkflowInput = {
  cart_id: string;
  variant_id: string;
  reward_id: string;
  quantity?: number;
};

export const redeemRewardWorkflow = createWorkflow(
  'redeem-reward',
  (input: RedeemRewardWorkflowInput) => {
    const { data: carts } = useQueryGraphStep({
      entity: 'cart',
      fields: ['*', 'items.*'],
      filters: {
        id: input.cart_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: 'cart-query' });

    const { data: rewards } = useQueryGraphStep({
      entity: 'reward',
      fields: ['id', 'points_cost', 'product.id'],
      filters: {
        id: input.reward_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: 'reward-query' });

    const { data: products } = useQueryGraphStep({
      entity: 'product',
      fields: ['id', 'variants.id'],
      filters: {
        id: rewards[0].product!.id,
      },
      options: {
        throwIfKeyNotFound: true,
        throwIfRelationNotFound: true,
      },
    }).config({ name: 'product-query' });

    validateVariantRedeemableStep({
      product: products[0] as unknown as ProductDTO,
      variant_id: input.variant_id,
    });

    const itemToAdd = transform({ input, rewards }, (data) => ({
      variant_id: data.input.variant_id,
      quantity: data.input.quantity ?? 1,
      unit_price: 0,
      metadata: {
        reward_points_cost: data.rewards[0].points_cost,
      },
    }));

    addToCartWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        items: [itemToAdd],
      },
    });

    lockPointsStep({
      customerId: carts[0].customer_id!,
      pointsToLock: rewards[0].points_cost,
    });

    const { data: updatedCarts } = useQueryGraphStep({
      entity: 'cart',
      fields: ['*', 'items.*'],
      filters: {
        id: input.cart_id,
      },
    }).config({ name: 'updated-cart-query' });

    return new WorkflowResponse(updatedCarts[0]);
  }
);
