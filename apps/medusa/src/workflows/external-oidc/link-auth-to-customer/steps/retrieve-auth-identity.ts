import { IAuthModuleService } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

export type RetrieveAuthIdentityStepInput = {
  authIdentityId: string;
};

export const retrieveAuthIdentityStep = createStep(
  'retrieve-auth-identity-step',
  async ({ authIdentityId }: RetrieveAuthIdentityStepInput, { container }) => {
    const authModuleService: IAuthModuleService = container.resolve(
      Modules.AUTH
    );

    const authIdentity =
      await authModuleService.retrieveAuthIdentity(authIdentityId);

    return new StepResponse(authIdentity);
  }
);
