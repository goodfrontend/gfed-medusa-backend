import z from 'zod';

export const CartRedeemReward = z.object({
  reward_id: z.string(),
  variant_id: z.string(),
  quantity: z.number().optional(),
});

export const CartUnredeemReward = z.object({
  line_item_id: z.string(),
});
