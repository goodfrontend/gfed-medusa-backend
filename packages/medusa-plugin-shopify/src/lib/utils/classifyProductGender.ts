import { ShopifyProduct } from '../../modules/shopify/types';

export type ShopifyProductGender = 'mens' | 'womens';

export const SHOPIFY_GENDER_CATEGORY_DEFINITIONS: Record<
  ShopifyProductGender,
  { handle: string; name: string }
> = {
  mens: {
    handle: 'mens',
    name: 'Men',
  },
  womens: {
    handle: 'womens',
    name: 'Women',
  },
};

function mapGenderValue(value: string): ShopifyProductGender | null {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === 'mens' || normalizedValue === 'men') {
    return 'mens';
  }

  if (normalizedValue === 'womens' || normalizedValue === 'women') {
    return 'womens';
  }

  return null;
}

function getTagGender(
  tags: ShopifyProduct['tags'] | string | undefined
): ShopifyProductGender | null | undefined {
  const normalizedTags = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
      ? tags.split(',')
      : [];

  for (const tag of normalizedTags) {
    const match = tag.match(/^allbirds::gender\s*=>\s*(.+)$/i);

    if (!match) {
      continue;
    }

    const explicitGender = match[1];

    if (!explicitGender) {
      return null;
    }

    return mapGenderValue(explicitGender) ?? null;
  }

  return undefined;
}

export function classifyShopifyProductGender(
  product: Pick<ShopifyProduct, 'handle' | 'tags' | 'title'>
): ShopifyProductGender | null {
  const tagGender = getTagGender(product.tags);

  // Respect the explicit Shopify tag value when present. This prevents
  // products tagged as unisex from being forced into a binary category.
  if (tagGender !== undefined) {
    return tagGender;
  }

  const normalizedHandle = product.handle.trim().toLowerCase().replace(/_/g, '-');
  if (/^(mens|men)(-|$)/.test(normalizedHandle)) {
    return 'mens';
  }

  if (/^(womens|women)(-|$)/.test(normalizedHandle)) {
    return 'womens';
  }

  if (/^men'?s\b/i.test(product.title)) {
    return 'mens';
  }

  if (/^women'?s\b/i.test(product.title)) {
    return 'womens';
  }

  return null;
}
