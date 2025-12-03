import type { CartDTO } from '@medusajs/framework/types';
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from '@medusajs/framework/workflows-sdk';
import {
  deleteLineItemsWorkflow,
  useQueryGraphStep,
} from '@medusajs/medusa/core-flows';

import { releasePointsStep } from '../steps/release-points';

type UnredeemRewardWorkflowInput = {
  cart_id: string;
  line_item_id: string;
};

export const unredeemRewardWorkflow = createWorkflow(
  'unredeem-reward',
  (input: UnredeemRewardWorkflowInput) => {
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

    const pointsToRelease = transform({ carts, input }, (data) => {
      return (data.carts[0] as unknown as CartDTO)?.items?.find(
        (item) => item?.id === data.input.line_item_id
      )?.metadata?.reward_points_cost as unknown as number;
    });

    deleteLineItemsWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        ids: [input.line_item_id],
      },
    });

    releasePointsStep({
      customerId: carts[0].customer_id!,
      pointsToRelease,
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
