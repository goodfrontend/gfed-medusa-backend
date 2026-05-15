import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import type { Knex } from '@mikro-orm/knex';

import {
  recordConversion,
  type IncomingConversion,
} from '../../../../lib/personalization';
import type { PostPersonalizationConversionBodyType } from './validators';

export async function POST(
  req: MedusaRequest<PostPersonalizationConversionBodyType>,
  res: MedusaResponse
) {
  const db = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION);
  await recordConversion(db, req.validatedBody as IncomingConversion);

  return res.status(201).json({ success: true });
}
