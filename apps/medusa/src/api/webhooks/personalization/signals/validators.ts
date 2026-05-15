import { z } from 'zod';

export const PersonalizationSignal = z.object({
  device_id: z.string().min(1),
  user_id: z.string().min(1).optional(),
  signal_type: z.enum([
    'PAGE_VIEW',
    'TIME_ON_PAGE',
    'SCROLL_DEPTH',
    'EXIT_INTENT',
    'TAB_SWITCH',
    'SEARCH_QUERY',
    'SEARCH_RESULT_CLICK',
    'SEARCH_REFINE',
    'FILTER_APPLIED',
    'SORT_CHANGED',
    'PRODUCT_HOVER',
    'PRODUCT_VIEW',
    'QUICK_VIEW_OPEN',
    'IMAGE_ZOOM',
    'SIZE_GUIDE_VIEW',
    'REVIEWS_VIEW',
    'CART_ADD',
    'CART_REMOVE',
    'CART_UPDATE_QUANTITY',
    'CHECKOUT_START',
    'CHECKOUT_ABANDON',
    'TRUST_BADGE_CLICK',
    'SECURITY_INFO_VIEW',
    'RETURN_POLICY_VIEW',
  ]),
  payload: z.record(z.unknown()).optional(),
  url: z.string().optional(),
  timestamp: z.number().int().nonnegative(),
});

export const PostPersonalizationSignalsBody = z.object({
  signals: z.array(PersonalizationSignal).min(1).max(500),
});

export type PostPersonalizationSignalsBodyType = z.infer<
  typeof PostPersonalizationSignalsBody
>;
