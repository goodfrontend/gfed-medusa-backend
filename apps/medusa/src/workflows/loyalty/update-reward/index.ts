import {
  WorkflowResponse,
  createWorkflow,
  when,
} from '@medusajs/framework/workflows-sdk';
import { useQueryGraphStep } from '@medusajs/medusa/core-flows';

import { linkProductToRewardStep } from '../steps/link-product-to-reward';
import { updateRewardStep } from './steps/update-reward';

type UpdateRewardWorkflowInput = {
  id: string;
  points_cost?: number;
  product_id?: string;
};

export const updateRewardWorkflow = createWorkflow(
  'update-reward',
  (input: UpdateRewardWorkflowInput) => {
    when(input, (data) => data.points_cost !== undefined).then(() => {
      updateRewardStep({
        id: input.id,
        points_cost: input.points_cost!,
      });
    });

    when(input, (data) => data.product_id !== undefined).then(() => {
      linkProductToRewardStep({
        reward_id: input.id,
        product_id: input.product_id!,
      });
    });

    const updated = useQueryGraphStep({
      entity: 'reward',
      fields: ['*', 'product.*'],
      filters: { id: input.id },
    });

    return new WorkflowResponse(updated.data[0]);
  }
);
