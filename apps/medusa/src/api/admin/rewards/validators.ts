import { z } from 'zod';

export const AdminCreateReward = z.object({
  points_cost: z.number(),
  product_id: z.string().optional(),
});

export const AdminDeleteReward = z.object({
  id: z.string(),
});

export const AdminUpdateReward = z.object({
  id: z.string(),
  points_cost: z.number().optional(),
  product_id: z.string().optional(),
});
