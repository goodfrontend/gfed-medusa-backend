import { type ProductDTO } from '@medusajs/framework/types';

export type Reward = {
  id: string;
  points_cost: number;
  product: ProductDTO;
};
