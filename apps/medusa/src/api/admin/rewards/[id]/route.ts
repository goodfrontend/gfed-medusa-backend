import { MedusaRequest, MedusaResponse } from '@medusajs/framework';

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const rewardId = req.params.id;
  const query = req.scope.resolve('query');

  const { data: rewards } = await query.graph({
    entity: 'reward',
    fields: ['*', 'product.*'],
    filters: {
      id: rewardId,
    },
  });

  res.json(rewards[0]);
};
