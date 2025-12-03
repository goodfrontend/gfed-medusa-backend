import z from 'zod';

import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';

import { createRewardWorkflow } from '../../../workflows/loyalty/create-reward';
import { deleteRewardWorkflow } from '../../../workflows/loyalty/delete-reward';
import { updateRewardWorkflow } from '../../../workflows/loyalty/update-reward';
import {
  AdminCreateReward,
  AdminDeleteReward,
  AdminUpdateReward,
} from './validators';

type PostAdminCreateRewardType = z.infer<typeof AdminCreateReward>;
type AdminDeleteRewardType = z.infer<typeof AdminDeleteReward>;
type AdminUpdateRewardType = z.infer<typeof AdminUpdateReward>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateRewardType>,
  res: MedusaResponse
) => {
  const { result } = await createRewardWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ reward: result });
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve('query');

  const { data: rewards, metadata } = await query.graph({
    entity: 'reward',
    ...req.queryConfig,
  });

  const { skip, take, count } = { ...metadata };

  res.json({ rewards, skip, take, count });
};

export const DELETE = async (
  req: MedusaRequest<AdminDeleteRewardType>,
  res: MedusaResponse
) => {
  const data = await deleteRewardWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json(data.result);
};

export const PATCH = async (
  req: MedusaRequest<AdminUpdateRewardType>,
  res: MedusaResponse
) => {
  const data = await updateRewardWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json(data.result);
};
