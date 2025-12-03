import z from 'zod';

import { MedusaRequest, MedusaResponse } from '@medusajs/framework';

import { redeemRewardWorkflow } from '../../../../../workflows/loyalty/redeem-reward';
import { unredeemRewardWorkflow } from '../../../../../workflows/loyalty/unredeem-reward';
import { CartRedeemReward, CartUnredeemReward } from './validators';

type CartRedeemRewardType = z.infer<typeof CartRedeemReward>;
type CartUnredeemRewardType = z.infer<typeof CartUnredeemReward>;

export const POST = async (
  req: MedusaRequest<CartRedeemRewardType>,
  res: MedusaResponse
) => {
  const cartId = req.params.id;

  const data = await redeemRewardWorkflow(req.scope).run({
    input: {
      cart_id: cartId,
      ...req.validatedBody,
    },
  });

  res.json(data.result);
};

export const DELETE = async (
  req: MedusaRequest<CartUnredeemRewardType>,
  res: MedusaResponse
) => {
  const cartId = req.params.id;

  const data = await unredeemRewardWorkflow(req.scope).run({
    input: {
      cart_id: cartId,
      ...req.validatedBody,
    },
  });

  res.json(data.result);
};
