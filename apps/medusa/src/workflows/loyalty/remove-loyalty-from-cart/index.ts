import { PromotionActions } from '@medusajs/framework/utils';
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from '@medusajs/framework/workflows-sdk';
import {
  updateCartPromotionsWorkflow,
  updateCartsStep,
  updatePromotionsStep,
  useQueryGraphStep,
} from '@medusajs/medusa/core-flows';

import { CartData } from '../../../utils/loyalty';
import { getCartLoyaltyPromoStep } from '../steps/get-cart-loyalty-promo';
import { releasePointsStep } from '../steps/release-points';

type WorkflowInput = {
  cart_id: string;
};

const fields = [
  'id',
  'customer.*',
  'promotions.*',
  'promotions.application_method.*',
  'promotions.rules.*',
  'promotions.rules.values.*',
  'currency_code',
  'total',
  'metadata',
];

const returnedFields = [
  '*',
  'customer.*',
  'promotions.*',
  'promotions.application_method.*',
  'promotions.rules.*',
  'promotions.rules.values.*',
  'items.*',
  'metadata.*',
];

export const removeLoyaltyFromCartWorkflow = createWorkflow(
  'remove-loyalty-from-cart',
  (input: WorkflowInput) => {
    const { data: carts } = useQueryGraphStep({
      entity: 'cart',
      fields,
      filters: {
        id: input.cart_id,
      },
    });

    const loyaltyPromo = getCartLoyaltyPromoStep({
      cart: carts[0] as unknown as CartData,
      throwErrorOn: 'not-found',
    });

    releasePointsStep({
      customerId: carts[0].customer_id!,
      pointsToRelease: loyaltyPromo.application_method!.value!,
    });

    updateCartPromotionsWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        promo_codes: [loyaltyPromo.code!],
        action: PromotionActions.REMOVE,
      },
    });

    const newMetadata = transform(
      {
        carts,
      },
      (data) => {
        const metadata = data.carts[0].metadata || {};

        return {
          ...metadata,
          loyalty_promo_id: null,
        };
      }
    );

    updateCartsStep([
      {
        id: input.cart_id,
        metadata: newMetadata,
      },
    ]);

    updatePromotionsStep([
      {
        id: loyaltyPromo.id,
        status: 'inactive',
      },
    ]);

    // Retrieve cart with updated promotions
    const { data: updatedCarts } = useQueryGraphStep({
      entity: 'cart',
      fields: returnedFields,
      filters: { id: input.cart_id },
    }).config({ name: 'retrieve-cart' });

    return new WorkflowResponse(updatedCarts[0]);
  }
);
