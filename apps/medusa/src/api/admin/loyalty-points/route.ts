import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';

import { LOYALTY_MODULE } from '../../../modules/loyalty';
import LoyaltyModuleService from '../../../modules/loyalty/service';

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.query.customer_id;
  const loyaltyModuleService: LoyaltyModuleService =
    req.scope.resolve(LOYALTY_MODULE);

  if (!customerId) res.json({ points: null });

  const points = await loyaltyModuleService.listLoyaltyPoints({
    customer_id: customerId,
  });

  res.json(points[0]);
}
