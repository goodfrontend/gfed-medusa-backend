import crypto from 'crypto';
import type { Knex } from '@mikro-orm/knex';

type SignalType =
  | 'PAGE_VIEW'
  | 'TIME_ON_PAGE'
  | 'SCROLL_DEPTH'
  | 'EXIT_INTENT'
  | 'TAB_SWITCH'
  | 'SEARCH_QUERY'
  | 'SEARCH_RESULT_CLICK'
  | 'SEARCH_REFINE'
  | 'FILTER_APPLIED'
  | 'SORT_CHANGED'
  | 'PRODUCT_HOVER'
  | 'PRODUCT_VIEW'
  | 'QUICK_VIEW_OPEN'
  | 'IMAGE_ZOOM'
  | 'SIZE_GUIDE_VIEW'
  | 'REVIEWS_VIEW'
  | 'CART_ADD'
  | 'CART_REMOVE'
  | 'CART_UPDATE_QUANTITY'
  | 'CHECKOUT_START'
  | 'CHECKOUT_ABANDON'
  | 'TRUST_BADGE_CLICK'
  | 'SECURITY_INFO_VIEW'
  | 'RETURN_POLICY_VIEW';

type CategoryAffinity = Record<
  string,
  {
    views?: number;
    purchases?: number;
    last_viewed?: number;
    score?: number;
  }
>;

type PriceSensitivity = {
  score: number;
  avg_viewed_price: number;
  deal_click_rate: number;
};

type IntentSignals = {
  research_depth: number;
  cart_to_purchase_rate: number;
  return_rate: number;
  dominant_intent?: string;
};

export type UserProfileRecord = {
  id: string;
  device_id: string;
  user_id: string | null;
  category_affinity: CategoryAffinity;
  price_sensitivity: PriceSensitivity;
  intent_signals: IntentSignals;
  engagement_level: 'LOW' | 'MEDIUM' | 'HIGH';
  lifecycle_stage: 'NEW' | 'RETURNING' | 'FREQUENT' | 'LOYAL';
  first_seen: string;
  last_seen: string;
  session_count: number;
  created_at: string;
  updated_at: string;
};

export type IncomingSignal = {
  device_id: string;
  user_id?: string;
  signal_type: SignalType;
  payload?: Record<string, unknown>;
  url?: string;
  timestamp: number;
};

export type IncomingConversion = {
  device_id: string;
  user_id?: string;
  order_id: string;
  amount: number;
  currency: string;
  items: Array<{
    product_id: string;
    variant_id?: string;
    quantity: number;
    price: number;
  }>;
  checkout_signal_id?: string;
};

const PROFILE_DEFAULTS = {
  category_affinity: {},
  price_sensitivity: {
    score: 0.5,
    avg_viewed_price: 0,
    deal_click_rate: 0,
  } as PriceSensitivity,
  intent_signals: {
    research_depth: 0,
    cart_to_purchase_rate: 0,
    return_rate: 0,
  } as IntentSignals,
  engagement_level: 'MEDIUM' as const,
  lifecycle_stage: 'NEW' as const,
  session_count: 0,
};

const randomId = () => crypto.randomUUID();

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value === 'object' && value !== null) return value as T;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const serializeProfileRow = (row: Record<string, unknown>): UserProfileRecord => ({
  id: String(row.id ?? ''),
  device_id: String(row.device_id ?? ''),
  user_id: row.user_id ? String(row.user_id) : null,
  category_affinity: parseJson(row.category_affinity, {}),
  price_sensitivity: parseJson(
    row.price_sensitivity,
    PROFILE_DEFAULTS.price_sensitivity
  ),
  intent_signals: parseJson(row.intent_signals, PROFILE_DEFAULTS.intent_signals),
  engagement_level: (row.engagement_level as UserProfileRecord['engagement_level']) ?? 'MEDIUM',
  lifecycle_stage: (row.lifecycle_stage as UserProfileRecord['lifecycle_stage']) ?? 'NEW',
  first_seen: String(row.first_seen ?? new Date().toISOString()),
  last_seen: String(row.last_seen ?? new Date().toISOString()),
  session_count: Number(row.session_count ?? 0),
  created_at: String(row.created_at ?? new Date().toISOString()),
  updated_at: String(row.updated_at ?? new Date().toISOString()),
});

const deriveEngagementLevel = (
  sessionCount: number
): UserProfileRecord['engagement_level'] => {
  if (sessionCount >= 20) return 'HIGH';
  if (sessionCount <= 3) return 'LOW';
  return 'MEDIUM';
};

const deriveLifecycleStage = (
  categoryAffinity: CategoryAffinity
): UserProfileRecord['lifecycle_stage'] => {
  const totalPurchases = Object.values(categoryAffinity).reduce(
    (sum, entry) => sum + (entry.purchases ?? 0),
    0
  );

  if (totalPurchases >= 5) return 'LOYAL';
  if (totalPurchases >= 2) return 'FREQUENT';
  if (totalPurchases >= 1) return 'RETURNING';
  return 'NEW';
};

const updateProfileFromSignal = (
  profile: UserProfileRecord,
  signal: IncomingSignal
): UserProfileRecord => {
  const next = {
    ...profile,
    category_affinity: { ...profile.category_affinity },
    price_sensitivity: { ...profile.price_sensitivity },
    intent_signals: { ...profile.intent_signals },
  };

  const payload = signal.payload ?? {};
  const category = typeof payload.category === 'string' ? payload.category : null;
  const price =
    typeof payload.price === 'number' && Number.isFinite(payload.price)
      ? payload.price
      : null;

  if (signal.signal_type === 'PAGE_VIEW') {
    next.session_count += 1;
  }

  if (category) {
    const prev = next.category_affinity[category] ?? {};
    next.category_affinity[category] = {
      views: (prev.views ?? 0) + 1,
      purchases: prev.purchases ?? 0,
      last_viewed: signal.timestamp,
      score: Math.min(1, (prev.score ?? 0) + 0.05),
    };
  }

  if (price !== null) {
    const prevAvg = next.price_sensitivity.avg_viewed_price;
    next.price_sensitivity.avg_viewed_price =
      prevAvg === 0 ? price : Number(((prevAvg + price) / 2).toFixed(2));
  }

  if (signal.signal_type === 'SEARCH_QUERY') {
    next.intent_signals.research_depth = Number(
      (next.intent_signals.research_depth + 0.1).toFixed(2)
    );
  }

  next.last_seen = new Date().toISOString();
  next.engagement_level = deriveEngagementLevel(next.session_count);
  next.lifecycle_stage = deriveLifecycleStage(next.category_affinity);

  return next;
};

export async function getOrCreateProfile(
  db: Knex,
  deviceId: string,
  userId?: string
): Promise<UserProfileRecord> {
  const existing = await db('user_profiles').where({ device_id: deviceId }).first();

  if (existing) {
    return serializeProfileRow(existing);
  }

  const now = new Date().toISOString();
  const [created] = await db('user_profiles')
    .insert({
      id: randomId(),
      device_id: deviceId,
      user_id: userId ?? null,
      category_affinity: JSON.stringify(PROFILE_DEFAULTS.category_affinity),
      price_sensitivity: JSON.stringify(PROFILE_DEFAULTS.price_sensitivity),
      intent_signals: JSON.stringify(PROFILE_DEFAULTS.intent_signals),
      engagement_level: PROFILE_DEFAULTS.engagement_level,
      lifecycle_stage: PROFILE_DEFAULTS.lifecycle_stage,
      first_seen: now,
      last_seen: now,
      session_count: PROFILE_DEFAULTS.session_count,
    })
    .returning('*');

  return serializeProfileRow(created);
}

export async function applySignals(
  db: Knex,
  signals: IncomingSignal[]
): Promise<number> {
  for (const signal of signals) {
    await db('signal_events').insert({
      device_id: signal.device_id,
      user_id: signal.user_id ?? null,
      signal_type: signal.signal_type,
      payload: JSON.stringify(signal.payload ?? {}),
      url: signal.url ?? null,
      timestamp: signal.timestamp,
    });

    const profile = await getOrCreateProfile(db, signal.device_id, signal.user_id);
    const updatedProfile = updateProfileFromSignal(profile, signal);

    await db('user_profiles')
      .where({ id: profile.id })
      .update({
        user_id: profile.user_id ?? signal.user_id ?? null,
        category_affinity: JSON.stringify(updatedProfile.category_affinity),
        price_sensitivity: JSON.stringify(updatedProfile.price_sensitivity),
        intent_signals: JSON.stringify(updatedProfile.intent_signals),
        engagement_level: updatedProfile.engagement_level,
        lifecycle_stage: updatedProfile.lifecycle_stage,
        last_seen: updatedProfile.last_seen,
        session_count: updatedProfile.session_count,
        updated_at: new Date().toISOString(),
      });
  }

  return signals.length;
}

export async function mergeProfileToUser(
  db: Knex,
  deviceId: string,
  userId: string
): Promise<UserProfileRecord> {
  const profile = await getOrCreateProfile(db, deviceId, userId);
  const existingUserProfile = await db('user_profiles').where({ user_id: userId }).first();

  if (!existingUserProfile || existingUserProfile.id === profile.id) {
    await db('user_profiles')
      .where({ id: profile.id })
      .update({ user_id: userId, updated_at: new Date().toISOString() });
    const updated = await db('user_profiles').where({ id: profile.id }).first();
    return serializeProfileRow(updated);
  }

  const existing = serializeProfileRow(existingUserProfile);
  const mergedCategory = { ...existing.category_affinity };

  for (const [category, values] of Object.entries(profile.category_affinity)) {
    const current = mergedCategory[category] ?? {};
    mergedCategory[category] = {
      views: (current.views ?? 0) + (values.views ?? 0),
      purchases: (current.purchases ?? 0) + (values.purchases ?? 0),
      last_viewed: Math.max(current.last_viewed ?? 0, values.last_viewed ?? 0),
      score: Math.max(current.score ?? 0, values.score ?? 0),
    };
  }

  await db('user_profiles')
    .where({ id: existing.id })
    .update({
      category_affinity: JSON.stringify(mergedCategory),
      session_count: existing.session_count + profile.session_count,
      engagement_level: deriveEngagementLevel(
        existing.session_count + profile.session_count
      ),
      lifecycle_stage: deriveLifecycleStage(mergedCategory),
      updated_at: new Date().toISOString(),
    });

  await db('user_profiles')
    .where({ id: profile.id })
    .update({ user_id: userId, updated_at: new Date().toISOString() });

  const updated = await db('user_profiles').where({ id: existing.id }).first();
  return serializeProfileRow(updated);
}

export async function recordConversion(
  db: Knex,
  conversion: IncomingConversion
): Promise<void> {
  await db('conversions').insert({
    device_id: conversion.device_id,
    user_id: conversion.user_id ?? null,
    order_id: conversion.order_id,
    amount: conversion.amount,
    currency: conversion.currency,
    items: JSON.stringify(conversion.items),
    checkout_signal_id: conversion.checkout_signal_id ?? null,
  });

  const profileRow =
    (conversion.user_id
      ? await db('user_profiles').where({ user_id: conversion.user_id }).first()
      : null) ??
    (await db('user_profiles').where({ device_id: conversion.device_id }).first());

  if (!profileRow) return;

  const profile = serializeProfileRow(profileRow);
  const categoryAffinity = { ...profile.category_affinity };

  for (const item of conversion.items) {
    const category = item.product_id.split('_')[0] || 'uncategorized';
    const prev = categoryAffinity[category] ?? {};
    categoryAffinity[category] = {
      views: prev.views ?? 0,
      purchases: (prev.purchases ?? 0) + item.quantity,
      last_viewed: prev.last_viewed ?? Date.now(),
      score: Math.min(1, (prev.score ?? 0) + 0.1),
    };
  }

  await db('user_profiles')
    .where({ id: profile.id })
    .update({
      category_affinity: JSON.stringify(categoryAffinity),
      lifecycle_stage: deriveLifecycleStage(categoryAffinity),
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    });
}

type ExportSample = {
  device_id: string;
  personalization_variant: string;
  converted: boolean;
  top_category: string | null;
  category_score: number;
  price_sensitivity: number;
  avg_viewed_price: number;
  engagement_level: string;
  lifecycle_stage: string;
  session_count: number;
  research_depth: number;
  cart_to_purchase_rate: number;
  return_rate: number;
  total_views_7d: number;
  total_views_30d: number;
};

const csvEscape = (value: string | number | boolean | null): string => {
  if (value === null) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
};

export async function exportTrainingData(
  db: Knex,
  sinceDate: Date
): Promise<ExportSample[]> {
  const profiles = await db('user_profiles').where('updated_at', '>=', sinceDate.toISOString());
  const samples: ExportSample[] = [];

  for (const profileRow of profiles) {
    const profile = serializeProfileRow(profileRow);
    const signals = await db('signal_events')
      .where({ device_id: profile.device_id })
      .andWhere('created_at', '>=', sinceDate.toISOString())
      .orderBy('created_at', 'desc')
      .limit(200);

    const lastSignalAt = signals[0]?.created_at
      ? new Date(signals[0].created_at).toISOString()
      : null;

    const conversionCount = lastSignalAt
      ? await db('conversions')
          .where({ device_id: profile.device_id })
          .andWhere('created_at', '>=', lastSignalAt)
          .count<{ count: string }[]>({ count: '*' })
      : [{ count: '0' }];

    const topCategoryEntry = Object.entries(profile.category_affinity).sort(
      (a, b) => (b[1].score ?? 0) - (a[1].score ?? 0)
    )[0];

    const nowMs = Date.now();
    const totalViews7d = signals.filter(
      (signal) =>
        signal.signal_type === 'PAGE_VIEW' &&
        Number(signal.timestamp) >= nowMs - 7 * 24 * 60 * 60 * 1000
    ).length;
    const totalViews30d = signals.filter(
      (signal) =>
        signal.signal_type === 'PAGE_VIEW' &&
        Number(signal.timestamp) >= nowMs - 30 * 24 * 60 * 60 * 1000
    ).length;

    samples.push({
      device_id: profile.device_id,
      personalization_variant: `${profile.intent_signals.dominant_intent ?? 'browse'}_default`,
      converted: Number(conversionCount[0]?.count ?? 0) > 0,
      top_category: topCategoryEntry?.[0] ?? null,
      category_score: topCategoryEntry?.[1]?.score ?? 0,
      price_sensitivity: profile.price_sensitivity.score,
      avg_viewed_price: profile.price_sensitivity.avg_viewed_price,
      engagement_level: profile.engagement_level,
      lifecycle_stage: profile.lifecycle_stage,
      session_count: profile.session_count,
      research_depth: profile.intent_signals.research_depth,
      cart_to_purchase_rate: profile.intent_signals.cart_to_purchase_rate,
      return_rate: profile.intent_signals.return_rate,
      total_views_7d: totalViews7d,
      total_views_30d: totalViews30d,
    });
  }

  return samples;
}

export function exportTrainingDataCsv(samples: ExportSample[]): string {
  const columns: Array<keyof ExportSample> = [
    'device_id',
    'personalization_variant',
    'converted',
    'top_category',
    'category_score',
    'price_sensitivity',
    'avg_viewed_price',
    'engagement_level',
    'lifecycle_stage',
    'session_count',
    'research_depth',
    'cart_to_purchase_rate',
    'return_rate',
    'total_views_7d',
    'total_views_30d',
  ];

  const header = columns.join(',');
  const rows = samples.map((sample) =>
    columns.map((column) => csvEscape(sample[column])).join(',')
  );

  return [header, ...rows].join('\n');
}
