import { z } from 'zod';

export const PostPersonalizationConversionBody = z.object({
  device_id: z.string().min(1),
  user_id: z.string().min(1).optional(),
  order_id: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().length(3),
  checkout_signal_id: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().min(1),
        variant_id: z.string().optional(),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative(),
      })
    )
    .default([]),
});

export type PostPersonalizationConversionBodyType = z.infer<
  typeof PostPersonalizationConversionBody
>;
