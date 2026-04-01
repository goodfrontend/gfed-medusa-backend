import { ProductDTO } from '@medusajs/framework/types';

type ProductCategorySource = {
  id: string;
  name?: string | null;
  handle?: string | null;
  description?: string | null;
  parent_category_id?: string | null;
};

type ProductTagSource = {
  id: string;
  value?: string | null;
};

type ProductCollectionSource = {
  id: string;
  title?: string | null;
  handle?: string | null;
};

type ProductImageSource = {
  id: string;
  url?: string | null;
};

type ProductVariantSource = {
  id: string;
  title?: string | null;
  sku?: string | null;
  manage_inventory?: boolean | null;
  allow_backorder?: boolean | null;
  inventory_quantity?: number | string | null;
  inventory?:
    | {
        id: string;
        stocked_quantity?: number | string | null;
        reserved_quantity?: number | string | null;
        location_levels?:
          | {
              id: string;
              stocked_quantity?: number | string | null;
              reserved_quantity?: number | string | null;
            }[]
          | null;
      }[]
    | null;
};

type ProductCalculatedPriceSource = {
  calculated_amount?: number | null;
  original_amount?: number | null;
  currency_code?: string | null;
};

type ProductVariantWithCalculatedPriceSource = ProductVariantSource & {
  calculated_price?: ProductCalculatedPriceSource | null;
};

type ProductSource = {
  id: string;
  title?: string | null;
  description?: string | null;
  handle?: string | null;
  thumbnail?: string | null;
  status?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  collection_id?: string | null;
  collection?: ProductCollectionSource | null;
  categories?: ProductCategorySource[] | null;
  tags?: ProductTagSource[] | null;
  images?: ProductImageSource[] | null;
  variants?: ProductVariantSource[] | null;
};

type ProductBrowseSource = Omit<ProductSource, 'variants'> & {
  variants?: ProductVariantWithCalculatedPriceSource[] | null;
};

type RegionCountrySource = {
  iso_2?: string | null;
};

type RegionSource = {
  id: string;
  name?: string | null;
  currency_code?: string | null;
  countries?: RegionCountrySource[] | null;
};

export type AlgoliaProductRecord = {
  id: string;
  title: string;
  description: string | null;
  handle: string | null;
  thumbnail: string | null;
  status: string | null;
  created_at: string | null;
  created_at_ts: number | null;
  createdAtTs: number | null;
  updated_at: string | null;
  updated_at_ts: number | null;
  updatedAtTs: number | null;
  collection_id: string | null;
  collection: ProductCollectionSource | null;
  collection_title: string | null;
  collection_handle: string | null;
  categories: ProductCategorySource[];
  category_ids: string[];
  category_handles: string[];
  category_names: string[];
  tags: ProductTagSource[];
  tag_ids: string[];
  tag_values: string[];
  images: ProductImageSource[];
  image_urls: string[];
  variants: ProductVariantSource[];
  variant_ids: string[];
  has_variants: boolean;
  is_available: boolean;
  is_sellable: boolean;
};

export type AlgoliaBrowseMarket = {
  region_id: string;
  region_name: string | null;
  currency_code: string;
  country_codes: string[];
  market_key: string;
};

export type AlgoliaBrowseProductRecord = AlgoliaProductRecord & {
  region_id: string;
  region_name: string | null;
  country_codes: string[];
  market_key: string;
  price_amount: number | null;
  original_price_amount: number | null;
  currency_code: string | null;
  display_price: string | null;
  display_original_price: string | null;
};

function toIsoString(value?: string | Date | null) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function toTimestamp(value?: string | Date | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getInventoryItemQuantity(
  inventoryItem: NonNullable<ProductVariantSource['inventory']>[number]
) {
  const locationLevels = inventoryItem.location_levels ?? [];

  if (locationLevels.length) {
    return locationLevels.reduce((total, locationLevel) => {
      const stockedQuantity = toNumber(locationLevel.stocked_quantity) ?? 0;
      const reservedQuantity = toNumber(locationLevel.reserved_quantity) ?? 0;

      return total + Math.max(stockedQuantity - reservedQuantity, 0);
    }, 0);
  }

  const stockedQuantity = toNumber(inventoryItem.stocked_quantity);

  if (stockedQuantity == null) {
    return null;
  }

  const reservedQuantity = toNumber(inventoryItem.reserved_quantity) ?? 0;

  return Math.max(stockedQuantity - reservedQuantity, 0);
}

function getVariantInventoryQuantity(variant: ProductVariantSource) {
  const directInventoryQuantity = toNumber(variant.inventory_quantity);

  if (directInventoryQuantity != null) {
    return directInventoryQuantity;
  }

  const inventoryItems = variant.inventory ?? [];
  let hasDerivedQuantity = false;
  let quantity = 0;

  for (const inventoryItem of inventoryItems) {
    const inventoryItemQuantity = getInventoryItemQuantity(inventoryItem);

    if (inventoryItemQuantity == null) {
      continue;
    }

    hasDerivedQuantity = true;
    quantity += inventoryItemQuantity;
  }

  return hasDerivedQuantity ? quantity : null;
}

function isVariantAvailable(variant: ProductVariantSource) {
  if (variant.manage_inventory === false) {
    return true;
  }

  if (variant.allow_backorder) {
    return true;
  }

  return (getVariantInventoryQuantity(variant) ?? 0) > 0;
}

function formatMoney(
  amount: number | null,
  currencyCode: string | null,
  countryCodes: string[]
) {
  if (amount == null || !currencyCode) {
    return null;
  }

  const primaryCountryCode = countryCodes[0]?.toUpperCase();
  const locale = primaryCountryCode ? `en-${primaryCountryCode}` : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

function getBaseProductRecord(
  sourceProduct: ProductSource
): AlgoliaProductRecord {
  const sourceCategories = (sourceProduct.categories ??
    []) as ProductCategorySource[];
  const sourceTags = (sourceProduct.tags ?? []) as ProductTagSource[];
  const sourceImages = (sourceProduct.images ?? []) as ProductImageSource[];
  const sourceVariants = (sourceProduct.variants ??
    []) as ProductVariantSource[];
  const categories = sourceCategories.map((category) => ({
    id: category.id,
    name: category.name ?? null,
    handle: category.handle ?? null,
    description: category.description ?? null,
    parent_category_id: category.parent_category_id ?? null,
  }));
  const tags = sourceTags.map((tag) => ({
    id: tag.id,
    value: tag.value ?? null,
  }));
  const images = sourceImages.map((image) => ({
    id: image.id,
    url: image.url ?? null,
  }));
  const variants = sourceVariants.map((variant) => ({
    id: variant.id,
    title: variant.title ?? null,
    sku: variant.sku ?? null,
    manage_inventory: variant.manage_inventory ?? null,
    allow_backorder: variant.allow_backorder ?? null,
    inventory_quantity: getVariantInventoryQuantity(variant),
  }));
  const createdAt = toIsoString(sourceProduct.created_at);
  const createdAtTs = toTimestamp(sourceProduct.created_at);
  const updatedAt = toIsoString(sourceProduct.updated_at);
  const updatedAtTs = toTimestamp(sourceProduct.updated_at);
  const collection = sourceProduct.collection
    ? {
        id: sourceProduct.collection.id,
        title: sourceProduct.collection.title ?? null,
        handle: sourceProduct.collection.handle ?? null,
      }
    : null;
  const isAvailable =
    variants.length === 0 || variants.some(isVariantAvailable);

  return {
    id: sourceProduct.id,
    title: sourceProduct.title ?? '',
    description: sourceProduct.description ?? null,
    handle: sourceProduct.handle ?? null,
    thumbnail: sourceProduct.thumbnail ?? null,
    status: sourceProduct.status ?? null,
    created_at: createdAt,
    created_at_ts: createdAtTs,
    createdAtTs,
    updated_at: updatedAt,
    updated_at_ts: updatedAtTs,
    updatedAtTs,
    collection_id: sourceProduct.collection_id ?? collection?.id ?? null,
    collection,
    collection_title: collection?.title ?? null,
    collection_handle: collection?.handle ?? null,
    categories,
    category_ids: categories.map((category) => category.id),
    category_handles: categories
      .map((category) => category.handle)
      .filter((handle): handle is string => Boolean(handle)),
    category_names: categories
      .map((category) => category.name)
      .filter((name): name is string => Boolean(name)),
    tags,
    tag_ids: tags.map((tag) => tag.id),
    tag_values: tags
      .map((tag) => tag.value)
      .filter((value): value is string => Boolean(value)),
    images,
    image_urls: images
      .map((image) => image.url)
      .filter((url): url is string => Boolean(url)),
    variants,
    variant_ids: variants.map((variant) => variant.id),
    has_variants: variants.length > 0,
    is_available: isAvailable,
    is_sellable: isAvailable,
  };
}

export function buildAlgoliaBrowseMarket(
  region: RegionSource
): AlgoliaBrowseMarket | null {
  if (!region.id || !region.currency_code) {
    return null;
  }

  const countryCodes = (region.countries ?? [])
    .map((country) => country.iso_2?.toLowerCase())
    .filter((countryCode): countryCode is string => Boolean(countryCode));

  return {
    region_id: region.id,
    region_name: region.name ?? null,
    currency_code: region.currency_code,
    country_codes: countryCodes,
    market_key: region.id,
  };
}

export function buildAlgoliaProductRecord(
  product: ProductDTO
): AlgoliaProductRecord {
  const sourceProduct = product as unknown as ProductSource;
  return getBaseProductRecord(sourceProduct);
}

export function buildAlgoliaBrowseProductRecord(
  product: ProductDTO,
  market: AlgoliaBrowseMarket
): AlgoliaBrowseProductRecord {
  const sourceProduct = product as unknown as ProductBrowseSource;
  const baseRecord = getBaseProductRecord(
    sourceProduct as unknown as ProductSource
  );
  const sourceVariants = (sourceProduct.variants ??
    []) as ProductVariantWithCalculatedPriceSource[];
  const sellableVariants = sourceVariants
    .filter(
      (variant) =>
        isVariantAvailable(variant) &&
        variant.calculated_price?.calculated_amount != null
    )
    .sort(
      (left, right) =>
        (left.calculated_price?.calculated_amount ?? Number.POSITIVE_INFINITY) -
        (right.calculated_price?.calculated_amount ?? Number.POSITIVE_INFINITY)
    );
  const cheapestSellableVariant = sellableVariants[0];
  const priceAmount =
    cheapestSellableVariant?.calculated_price?.calculated_amount ?? null;
  const originalPriceAmount =
    cheapestSellableVariant?.calculated_price?.original_amount ?? priceAmount;
  const currencyCode =
    cheapestSellableVariant?.calculated_price?.currency_code ??
    market.currency_code;

  return {
    ...baseRecord,
    region_id: market.region_id,
    region_name: market.region_name,
    country_codes: market.country_codes,
    market_key: market.market_key,
    is_sellable: sellableVariants.length > 0,
    price_amount: priceAmount,
    original_price_amount: originalPriceAmount,
    currency_code: currencyCode,
    display_price: formatMoney(priceAmount, currencyCode, market.country_codes),
    display_original_price: formatMoney(
      originalPriceAmount,
      currencyCode,
      market.country_codes
    ),
  };
}
