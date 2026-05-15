import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import type { Knex } from '@mikro-orm/knex';

import { recordConversion } from '../lib/personalization';

type OrderPlacedPayload = {
  id: string;
};

type OrderLineItem = {
  product_id?: string | null;
  variant_id?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
};

export default async function orderPersonalizationHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedPayload>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const db = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION);

  const { data: orders } = await query.graph({
    entity: 'order',
    fields: [
      'id',
      'customer_id',
      'currency_code',
      'total',
      'items.variant_id',
      'items.product_id',
      'items.quantity',
      'items.unit_price',
    ],
    filters: {
      id: data.id,
    },
  });

  const order = orders[0];
  if (!order) return;

  const profile = order.customer_id
    ? await db('user_profiles').where({ user_id: order.customer_id }).first()
    : null;
  const deviceId = profile?.device_id;

  if (!deviceId) return;

  await recordConversion(db, {
    device_id: deviceId,
    user_id: order.customer_id ?? undefined,
    order_id: order.id,
    amount: Number(order.total ?? 0),
    currency: String(order.currency_code ?? '').toUpperCase(),
    items: (order.items ?? []).map((item: OrderLineItem | null | undefined) => ({
      product_id: item?.product_id ?? 'unknown',
      variant_id: item?.variant_id ?? undefined,
      quantity: Number(item?.quantity ?? 0),
      price: Number(item?.unit_price ?? 0),
    })),
  });
}

export const config: SubscriberConfig = {
  event: 'order.placed',
};
