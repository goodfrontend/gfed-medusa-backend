import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { LOYALTY_MODULE } from '../../../../modules/loyalty';
import LoyaltyModuleService from '../../../../modules/loyalty/service';

export type CreateRewardStepInput = {
  points_cost: number;
};

export const createRewardStep = createStep(
  'create-reward-step',
  async (input: CreateRewardStepInput, { container }) => {
    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    const reward = await loyaltyModuleService.createRewards(input);

    return new StepResponse(reward, reward.id);
  },
  async (rewardId, { container }) => {
    if (!rewardId) return;

    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    await loyaltyModuleService.deleteRewards(rewardId);
  }
);
