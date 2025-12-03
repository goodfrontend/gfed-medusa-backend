import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { LOYALTY_MODULE } from '../../../../modules/loyalty';
import LoyaltyModuleService from '../../../../modules/loyalty/service';

export type UpdateRewardStepInput = {
  id: string;
  points_cost: number;
};

export const updateRewardStep = createStep(
  'update-reward-step',
  async (input: UpdateRewardStepInput, { container }) => {
    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    const existingReward = await loyaltyModuleService.retrieveReward(input.id);

    if (!existingReward) {
      return new StepResponse(
        {
          message: 'Reward does not exist',
        },
        null
      );
    }

    const updatedReward = await loyaltyModuleService.updateRewards(input);

    return new StepResponse(
      {
        updated: updatedReward,
        message: 'Reward updated',
      },
      existingReward
    );
  },
  async (input, { container }) => {
    if (!input) return;

    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    await loyaltyModuleService.updateRewards({
      id: input.id,
      points_cost: input.points_cost,
    });
  }
);
