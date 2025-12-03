import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { LOYALTY_MODULE } from '../../../modules/loyalty';
import LoyaltyModuleService from '../../../modules/loyalty/service';

export type ReleasePointsStepInput = {
  customerId: string;
  pointsToRelease: number;
};

export const releasePointsStep = createStep(
  'release-points-step',
  async (
    { customerId, pointsToRelease }: ReleasePointsStepInput,
    { container }
  ) => {
    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    const updatedLoyaltyPoint = await loyaltyModuleService.releasePoints(
      customerId,
      pointsToRelease
    );

    return new StepResponse(updatedLoyaltyPoint, {
      customerId,
      pointsToRelease,
    });
  },
  async (input, { container }) => {
    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    if (input) {
      await loyaltyModuleService.lockPoints(
        input.customerId,
        input.pointsToRelease
      );
    }
  }
);
