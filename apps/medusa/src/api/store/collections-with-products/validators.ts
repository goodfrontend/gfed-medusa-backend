import { z } from '@medusajs/framework/zod';
import { createFindParams } from '@medusajs/medusa/api/utils/validators';

const StoreGetCollectionsWithProductsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
});

export const StoreGetCollectionsWithProductsParams = createFindParams({
  offset: 0,
  limit: 10,
  order: '-created_at',
}).merge(StoreGetCollectionsWithProductsParamsFields);

export type StoreGetCollectionsWithProductsParamsType = z.infer<
  typeof StoreGetCollectionsWithProductsParams
>;
