import {
  WorkflowResponse,
  createWorkflow,
} from '@medusajs/framework/workflows-sdk';

import { DeleteRewardStepInput, deleteRewardStep } from './steps/delete-reward';

type DeleteRewardWorkflowInput = DeleteRewardStepInput;

export const deleteRewardWorkflow = createWorkflow(
  'delete-reward',
  (input: DeleteRewardWorkflowInput) => {
    const result = deleteRewardStep(input);

    return new WorkflowResponse(result);
  }
);
