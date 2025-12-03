import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { LOYALTY_MODULE } from '../../../modules/loyalty';
import LoyaltyModuleService from '../../../modules/loyalty/service';

export type LockPointsStepInput = {
  customerId: string;
  pointsToLock: number;
};

export const lockPointsStep = createStep(
  'lock-points-step',
  async ({ customerId, pointsToLock }: LockPointsStepInput, { container }) => {
    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    const updatedLoyaltyPoint = await loyaltyModuleService.lockPoints(
      customerId,
      pointsToLock
    );

    return new StepResponse(updatedLoyaltyPoint, { customerId, pointsToLock });
  },
  async (input, { container }) => {
    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    if (input) {
      await loyaltyModuleService.releasePoints(
        input?.customerId,
        input?.pointsToLock
      );
    }
  }
);
