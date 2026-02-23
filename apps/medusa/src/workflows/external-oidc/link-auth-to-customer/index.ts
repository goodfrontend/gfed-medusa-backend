import {
  WorkflowResponse,
  createWorkflow,
} from '@medusajs/framework/workflows-sdk';
import { setAuthAppMetadataStep } from '@medusajs/medusa/core-flows';

import { retrieveAuthIdentityStep } from './steps/retrieve-auth-identity';

type LinkAuthToCustomerWorkflowInput = {
  authIdentityId: string;
  customerId: string;
};

export const linkAuthToCustomerWorkflow = createWorkflow(
  'link-auth-to-customer',
  (input: LinkAuthToCustomerWorkflowInput) => {
    const data = setAuthAppMetadataStep({
      authIdentityId: input.authIdentityId,
      actorType: 'customer',
      value: input.customerId,
    });

    const updatedAuthIdentity = retrieveAuthIdentityStep({
      authIdentityId: data.id,
    });

    return new WorkflowResponse(updatedAuthIdentity);
  }
);
