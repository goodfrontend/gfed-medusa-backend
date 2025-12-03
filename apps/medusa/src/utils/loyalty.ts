import {
  CartDTO,
  CustomerDTO,
  OrderLineItemDTO,
  PromotionDTO,
} from '@medusajs/framework/types';
import { OrderDTO } from '@medusajs/framework/types';
import { transform } from '@medusajs/framework/workflows-sdk';

export type CartData = CartDTO & {
  promotions?: PromotionDTO[];
  customer?: CustomerDTO;
  items?: OrderLineItemDTO[];
  metadata: {
    loyalty_promo_id?: string;
  };
};

/**
 * Returns the promotion applied to the cart that is redeemed
 * in exchange of loyalty points.
 *
 * @param cart - Cart data including promotions, customer, and loyalty promo ID
 * @returns Promotion related to the loyalty redemption applied to cart
 */
export function getCartLoyaltyPromotion(
  cart: CartData
): PromotionDTO | undefined {
  if (!cart?.metadata?.loyalty_promo_id) {
    return;
  }

  return cart.promotions?.find(
    (promotion) => promotion.id === cart.metadata.loyalty_promo_id
  );
}

export type OrderData = OrderDTO & {
  promotion?: PromotionDTO[];
  customer?: CustomerDTO;
  cart?: CartData;
};

export const CUSTOMER_ID_PROMOTION_RULE_ATTRIBUTE = 'customer_id';

/**
 * Checks whether an order's cart has a loyalty promotion (customer
 * redeemed points during checkout).
 *
 * @param order - Order data including promotions, customer info, and cart data
 * @returns
 */
export function orderHasLoyaltyPromotion(order: OrderData): boolean {
  const loyaltyPromotion = getCartLoyaltyPromotion(
    order.cart as unknown as CartData
  );

  return (
    loyaltyPromotion?.rules?.some((rule) => {
      return (
        rule?.attribute === CUSTOMER_ID_PROMOTION_RULE_ATTRIBUTE &&
        (rule?.values?.some((value) => value.value === order.customer?.id) ||
          false)
      );
    }) || false
  );
}

export function orderHasRedeemedReward(order: OrderData): boolean {
  return Boolean(
    order.cart?.items?.find(
      (item) =>
        item.metadata?.reward_points_cost &&
        (item.metadata.reward_points_cost as number) > 0
    )
  );
}

export function getOrderRewardCost(order: OrderData): number {
  const rewardItems = transform({ order }, (data) => {
    return data.order.cart?.items?.filter(
      (item) =>
        item.metadata?.reward_points_cost &&
        (item.metadata.reward_points_cost as number) > 0
    );
  });

  if (!rewardItems) return 0;

  const rewardsCostList = transform({ rewardItems }, (data) => {
    return data.rewardItems?.map(
      (item) => item.metadata?.reward_points_cost as number
    );
  });

  const rewardsTotal = transform({ rewardsCostList }, (data) =>
    data.rewardsCostList?.reduce((acc, curr) => acc + curr, 0)
  );

  return rewardsTotal;
}
