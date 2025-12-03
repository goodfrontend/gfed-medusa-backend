import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { LOYALTY_MODULE } from '../../../../modules/loyalty';
import LoyaltyModuleService from '../../../../modules/loyalty/service';

export type DeleteRewardStepInput = {
  id: string;
};

export const deleteRewardStep = createStep(
  'delete-reward-step',
  async (input: DeleteRewardStepInput, { container }) => {
    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);
    const link = container.resolve('link');

    const existingReward = await loyaltyModuleService.retrieveReward(input.id);

    if (!existingReward) {
      return new StepResponse(
        {
          deleted: false,
          message: 'Reward does not exist',
        },
        null
      );
    }

    link.delete({
      [LOYALTY_MODULE]: {
        reward_id: existingReward.id,
      },
    });

    await loyaltyModuleService.deleteRewards(input.id);

    return new StepResponse(
      {
        deleted: true,
        message: 'Reward deleted',
      },
      existingReward
    );
  },
  async (input, { container }) => {
    if (!input) return;

    const loyaltyModuleService: LoyaltyModuleService =
      container.resolve(LOYALTY_MODULE);

    await loyaltyModuleService.createRewards({
      id: input.id,
      points_cost: input.points_cost,
    });
  }
);
