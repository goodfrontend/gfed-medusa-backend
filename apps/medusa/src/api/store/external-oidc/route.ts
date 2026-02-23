import * as jose from 'jose';
import z from 'zod';

import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import {
  IAuthModuleService,
  ICustomerModuleService,
} from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { generateJwtTokenForAuthIdentity } from '@medusajs/medusa/api/auth/utils/generate-jwt-token';

import Auth0ProviderService from '@/modules/external-oidc/service';
import { linkAuthToCustomerWorkflow } from '@/workflows/external-oidc/link-auth-to-customer';

import { AuthSchema } from './validators';

type PostAuthType = z.infer<typeof AuthSchema>;

export const POST = async (
  req: MedusaRequest<PostAuthType>,
  res: MedusaResponse
) => {
  const { idToken } = req.body;
  const { http } = req.scope.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  ).projectConfig;

  const authModuleService: IAuthModuleService = req.scope.resolve(Modules.AUTH);
  const customerModuleService: ICustomerModuleService = req.scope.resolve(
    Modules.CUSTOMER
  );

  // 1️⃣ Get payload from provided auth idToken
  const jwks = jose.createRemoteJWKSet(
    new URL(`${process.env.AUTH_ISSUER}/.well-known/jwks.json`)
  );

  const { payload } = await jose.jwtVerify(idToken, jwks, {
    issuer: process.env.AUTH_ISSUER,
    audience: process.env.AUTH_CLIENT_ID,
  });

  const payloadEmail = payload.email as string;
  const payloadFirstName = payload.given_name
    ? (payload.given_name as string)
    : undefined;
  const payloadLastName = payload.family_name
    ? (payload.family_name as string)
    : undefined;
  const payloadSub = payload.sub;

  // 2️⃣ Make sure that customer exists by finding an existing customer or creating a new one
  const customersList = await customerModuleService.listCustomers({
    email: payloadEmail,
  });

  let customer = customersList[0];

  if (!customer) {
    customer = await customerModuleService.createCustomers({
      first_name: payloadFirstName,
      last_name: payloadLastName,
      email: payloadEmail,
      has_account: true,
    });
  }

  // 3️⃣ Find or create an AuthIdentity for this customer
  const authIdentitiesList = await authModuleService.listAuthIdentities({
    provider_identities: {
      entity_id: customer.id,
    },
  });

  let authIdentity = authIdentitiesList[0];
  let authIdentityLinked = authIdentity;

  if (!authIdentity) {
    authIdentity = await authModuleService.createAuthIdentities({
      provider_identities: [
        {
          provider: Auth0ProviderService.identifier,
          entity_id: customer.id,
          provider_metadata: {
            email: payloadEmail,
            sub: payloadSub,
          },
        },
      ],
    });

    const linkedRes = await linkAuthToCustomerWorkflow(req.scope).run({
      input: {
        authIdentityId: authIdentity.id,
        customerId: customer.id,
      },
    });

    authIdentityLinked = linkedRes.result;
  }

  // 4️⃣ Generate Medusa JWT for the current authenticated customer
  const jwt = generateJwtTokenForAuthIdentity(
    {
      authIdentity: authIdentityLinked,
      actorType: 'customer',
    },
    {
      secret: http.jwtSecret!,
      expiresIn: http.jwtExpiresIn,
      options: http.jwtOptions,
    }
  );

  return res.status(200).json({ token: jwt });
};
