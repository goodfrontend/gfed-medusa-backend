import type { Knex } from '@mikro-orm/knex';

import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

import type { StoreGetCollectionsWithProductsParamsType } from './validators';

const DEFAULT_LIMIT = 10;

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    return [value];
  }

  return [];
};

export async function GET(
  req: MedusaRequest<StoreGetCollectionsWithProductsParamsType>,
  res: MedusaResponse
) {
  const db = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION);

  const ids = toStringArray(req.filterableFields.id);
  const handles = toStringArray(req.filterableFields.handle);
  const titles = toStringArray(req.filterableFields.title);
  const search =
    typeof req.filterableFields.q === 'string'
      ? req.filterableFields.q.trim()
      : '';

  const offset = req.queryConfig.pagination.skip ?? 0;
  const limit = req.queryConfig.pagination.take ?? DEFAULT_LIMIT;

  const productsPerCollection = db('product as p')
    .select('p.collection_id')
    .count('* as product_count')
    .whereNull('p.deleted_at')
    .where('p.status', 'published')
    .groupBy('p.collection_id')
    .as('ppc');

  const baseQuery = db('product_collection as pc')
    .join(productsPerCollection, 'ppc.collection_id', 'pc.id')
    .whereNull('pc.deleted_at');

  if (ids.length) {
    baseQuery.whereIn('pc.id', ids);
  }

  if (handles.length) {
    baseQuery.whereIn('pc.handle', handles);
  }

  if (titles.length) {
    baseQuery.whereIn('pc.title', titles);
  }

  if (search) {
    baseQuery.andWhere((builder: Knex.QueryBuilder) => {
      builder
        .whereILike('pc.title', `%${search}%`)
        .orWhereILike('pc.handle', `%${search}%`);
    });
  }

  const countRows = await baseQuery
    .clone()
    .countDistinct<{ count: string }[]>({ count: 'pc.id' });

  const count = Number(countRows[0]?.count ?? 0);

  const collections = await baseQuery
    .clone()
    .select(
      'pc.id',
      'pc.title',
      'pc.handle',
      'pc.created_at',
      'pc.updated_at',
      db.raw('CAST(ppc.product_count AS INTEGER) as product_count')
    )
    .orderBy('ppc.product_count', 'desc')
    .orderBy('pc.created_at', 'desc')
    .offset(offset)
    .limit(limit);

  res.json({
    collections,
    count,
    offset,
    limit,
  });
}
