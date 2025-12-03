import { CustomerDTO, PromotionDTO } from '@medusajs/framework/types';
import { MedusaError } from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { LOYALTY_MODULE } from '../../../../modules/loyalty';
import LoyaltyModuleService from '../../../../modules/loyalty/service';

export type GetCartLoyaltyPromoAmountStepInput = {
  cart: {
    id: string;
    customer: CustomerDTO;
    promotions?: PromotionDTO[];
    total: number;
  };
};

export const getCartLoyaltyPromoAmountStep = createStep(
  'get-cart-loyalty-promo-amount',
  async ({ cart }: GetCartLoyaltyPromoAmountStepInput, { container }) => {
    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);
    const loyaltyPoints = await loyaltyModuleService.getPoints(
      cart.customer.id
    );

    if (loyaltyPoints.points <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Customer has no loyalty points'
      );
    }

    const promoDiscountAmount =
      await loyaltyModuleService.calculateAmountFromPoints(
        loyaltyPoints.points
      );

    const amount = Math.min(promoDiscountAmount, cart.total);

    return new StepResponse(amount);
  }
);
