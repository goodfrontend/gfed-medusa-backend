import { Modules } from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { LOYALTY_MODULE } from '../../../modules/loyalty';

export type LinkProductToRewardStepInput = {
  reward_id: string;
  product_id: string;
};

export const linkProductToRewardStep = createStep(
  'link-product-to-reward-step',
  async (input: LinkProductToRewardStepInput, { container }) => {
    const link = container.resolve('link');

    if (input.product_id) {
      link.create({
        [LOYALTY_MODULE]: {
          reward_id: input.reward_id,
        },
        [Modules.PRODUCT]: {
          product_id: input.product_id,
        },
      });
    }

    return new StepResponse(true, {
      reward_id: input.reward_id,
      product_id: input.product_id,
    });
  },
  async (input, { container }) => {
    const { reward_id, product_id } = { ...input };

    if (!reward_id || !product_id) return;

    const link = container.resolve('link');

    link.dismiss({
      [LOYALTY_MODULE]: {
        reward_id,
      },
      [Modules.PRODUCT]: {
        product_id,
      },
    });
  }
);
