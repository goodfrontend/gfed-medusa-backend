import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { LOYALTY_MODULE } from '../../../../modules/loyalty';
import LoyaltyModuleService from '../../../../modules/loyalty/service';

export type RetrieveLoyaltyPointStepInput = {
  customerId: string;
};

export const retrieveLoyaltyPointStep = createStep(
  'retrieve-loyalty-point-step',
  async ({ customerId }: RetrieveLoyaltyPointStepInput, { container }) => {
    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    const loyaltyPoints = await loyaltyModuleService.listLoyaltyPoints({
      customer_id: customerId,
    });

    if (!loyaltyPoints || loyaltyPoints.length < 1) {
      const newLoyaltyPoints = await loyaltyModuleService.createLoyaltyPoints({
        customer_id: customerId,
      });

      return new StepResponse(newLoyaltyPoints);
    }

    return new StepResponse(loyaltyPoints[0]);
  }
);
