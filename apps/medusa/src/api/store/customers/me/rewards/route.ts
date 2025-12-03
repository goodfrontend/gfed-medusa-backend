import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework';

import { LOYALTY_MODULE } from '../../../../../modules/loyalty';
import LoyaltyModuleService from '../../../../../modules/loyalty/service';

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve('query');
  const loyaltyModuleService: LoyaltyModuleService =
    req.scope.resolve(LOYALTY_MODULE);

  const loyaltyPoints = await loyaltyModuleService.getPoints(
    req.auth_context.actor_id
  );

  const { data: rewards, metadata } = await query.graph({
    entity: 'reward',
    fields: ['*', 'product.*'],
    filters: {
      points_cost: {
        $lte: loyaltyPoints.points,
      },
    },
  });

  const { skip, take, count } = { ...metadata };

  res.json({ rewards, skip, take, count });
};
