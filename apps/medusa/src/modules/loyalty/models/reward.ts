import { model } from '@medusajs/framework/utils';

const Reward = model.define('reward', {
  id: model.id().primaryKey(),
  points_cost: model.number(),
});

export default Reward;
