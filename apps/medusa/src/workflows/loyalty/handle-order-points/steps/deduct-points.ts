import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { LOYALTY_MODULE } from '../../../../modules/loyalty';
import LoyaltyModuleService from '../../../../modules/loyalty/service';

type DeductPointsInput = {
  customer_id: string;
  points: number;
};

export const deductPointsStep = createStep(
  'deduct-points',
  async ({ customer_id, points }: DeductPointsInput, { container }) => {
    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    await loyaltyModuleService.releasePoints(customer_id, points);

    const result = await loyaltyModuleService.deductPoints(customer_id, points);

    return new StepResponse(result, {
      customer_id,
      points,
    });
  },
  async (data, { container }) => {
    if (!data) {
      return;
    }

    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    // Restore points in case of failure
    await loyaltyModuleService.addPoints(data.customer_id, data.points);
  }
);
