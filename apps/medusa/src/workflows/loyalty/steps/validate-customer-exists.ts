import { CustomerDTO } from '@medusajs/framework/types';
import { MedusaError } from '@medusajs/framework/utils';
import { createStep } from '@medusajs/framework/workflows-sdk';

export type ValidateCustomerExistsStepInput = {
  customer: CustomerDTO | null | undefined;
};

export const validateCustomerExistsStep = createStep(
  'validate-customer-exists',
  async ({ customer }: ValidateCustomerExistsStepInput) => {
    if (!customer) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Customer not found'
      );
    }

    if (!customer.has_account) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Customer must have an account to earn or manage points'
      );
    }
  }
);
