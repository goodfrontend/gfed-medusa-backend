import { logger } from '@medusajs/framework';
import { MedusaError } from '@medusajs/framework/utils';

import { ShopifyCollection, ShopifyProduct } from './types';

const DELAY_MS = 500;
const LIMIT_PER_PAGE = 250;

type Options = {
  baseUrl: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      lastError = error as Error;
      if (attempt === maxRetries) break;

      logger.warn(
        `Attempt ${attempt} failed. Retrying in ${delayMs}ms... Error: ${error.message}`
      );

      await sleep(delayMs);
      delayMs *= 2;
    }
  }

  throw lastError;
}

export default class ShopifyModuleService {
  private options: Options;

  constructor(_: unknown, options: Options) {
    this.options = { ...options };
  }

  async extractShopifyProducts(hardLimit = 2000) {
    try {
      const products: ShopifyProduct[] = [];
      const limit = Math.min(LIMIT_PER_PAGE, hardLimit);
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { products: productsResult } = await withRetry(async () => {
          const response = await fetch(
            `${this.options.baseUrl}/products.json?limit=${limit}&page=${page}`
          );
          return response.json();
        });

        if (Array.isArray(productsResult) && productsResult.length > 0) {
          products.push(...productsResult);
        }

        hasMore =
          productsResult.length === limit && products.length < hardLimit;
        page++;

        // Wait to avoid being rate limited
        await sleep(DELAY_MS);
      }

      return products;
    } catch (e) {
      console.error('ERROR on extractShopifyProducts', e);

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        'Failed to extract products from Shopify',
        '500',
        e
      );
    }
  }

  async extractShopifyCollections(hardLimit = 2000) {
    try {
      const collections: ShopifyCollection[] = [];
      const limit = Math.min(LIMIT_PER_PAGE, hardLimit);
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { collections: collectionsResult } = await withRetry(async () => {
          const response = await fetch(
            `${this.options.baseUrl}/collections.json?limit=${limit}&page=${page}`
          );
          return response.json();
        });

        if (Array.isArray(collectionsResult) && collectionsResult.length > 0) {
          collections.push(...collectionsResult);
        }

        hasMore =
          collectionsResult.length === limit && collections.length < hardLimit;
        page++;

        // Wait to avoid being rate limited
        await sleep(DELAY_MS);
      }

      return collections;
    } catch (e) {
      console.error('ERROR on extractShopifyCollections', e);

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        'Failed to extract collections from Shopify',
        '500',
        e
      );
    }
  }

  async extractShopifyProductsInCollection({
    collectionHandle,
    hardLimit,
  }: {
    collectionHandle: string;
    hardLimit?: number;
  }) {
    try {
      const products: ShopifyProduct[] = [];
      const limit = hardLimit
        ? Math.min(LIMIT_PER_PAGE, hardLimit)
        : LIMIT_PER_PAGE;
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { products: productsInCollection } = await withRetry(async () => {
          const response = await fetch(
            `${this.options.baseUrl}/collections/${collectionHandle}/products.json?limit=${limit}&page=${page}`
          );
          return response.json();
        });

        if (
          Array.isArray(productsInCollection) &&
          productsInCollection.length > 0
        ) {
          products.push(...productsInCollection);
        }

        hasMore =
          productsInCollection.length === limit &&
          (!hardLimit || products.length < hardLimit);
        page++;

        // Wait to avoid being rate limited
        await sleep(DELAY_MS);
      }

      return products;
    } catch (e) {
      console.error('ERROR on extractShopifyProductsInCollection', e);

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to extract products in collection ${collectionHandle} from Shopify`,
        '500',
        e
      );
    }
  }
}
