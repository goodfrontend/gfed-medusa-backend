import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import type { Knex } from '@mikro-orm/knex';

import { mergeProfileToUser } from '../../../../lib/personalization';
import type { PostPersonalizationSyncLoginBodyType } from './validators';

export async function POST(
  req: MedusaRequest<PostPersonalizationSyncLoginBodyType>,
  res: MedusaResponse
) {
  const db = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION);
  const profile = await mergeProfileToUser(
    db,
    req.validatedBody.device_id,
    req.validatedBody.user_id
  );

  return res.status(200).json({
    success: true,
    profile,
  });
}
