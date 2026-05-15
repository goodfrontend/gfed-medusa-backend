import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import type { Knex } from '@mikro-orm/knex';

import {
  applySignals,
  type IncomingSignal,
} from '../../../../lib/personalization';
import type { PostPersonalizationSignalsBodyType } from './validators';

export async function POST(
  req: MedusaRequest<PostPersonalizationSignalsBodyType>,
  res: MedusaResponse
) {
  const db = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION);
  const processed = await applySignals(db, req.validatedBody.signals as IncomingSignal[]);

  return res.status(201).json({
    success: true,
    processed,
  });
}
