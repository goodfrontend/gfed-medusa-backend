import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import {
  ContainerRegistrationKeys,
  MedusaError,
} from '@medusajs/framework/utils';

import { linkProductsToCollectionWorkflow } from '../../../../workflows/link-products-to-collection';
import { migrateShopifyDataWorkflow } from '../../../../workflows/migrate';

const HARD_LIMIT = 2000;

type ProductCollectionAssignment = {
  collectionId: string;
  productCount: number;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const container = req.scope;
  const {
    hardLimitProducts,
    hardLimitCollections,
    hardLimitProductsPerCollection,
  } = req.query;
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const activityId = logger.activity('Migrating all data from Shopify...');

  try {
    const {
      result: { collections },
    } = await migrateShopifyDataWorkflow(container).run({
      input: {
        hardLimitProducts: Number(hardLimitProducts) || HARD_LIMIT,
        hardLimitCollections: Number(hardLimitCollections) || HARD_LIMIT,
      },
    });

    logger.progress(
      activityId,
      'Selecting a primary Product Collection for each product...'
    );

    const productAssignments = new Map<string, ProductCollectionAssignment>();
    const productsByCollectionId = new Map<string, string[]>();

    // Medusa products only support a single collection_id. Pick the
    // smallest Shopify collection that contains the product so broad
    // collections such as "all" do not overwrite more specific ones.
    for (const collection of collections) {
      const {
        result: { collectionId, productIds },
      } = await linkProductsToCollectionWorkflow(container).run({
        input: {
          collection,
          hardLimit: hardLimitProductsPerCollection
            ? Number(hardLimitProductsPerCollection)
            : undefined,
        },
      });

      if (!collectionId) {
        continue;
      }

      if (!productsByCollectionId.has(collectionId)) {
        productsByCollectionId.set(collectionId, []);
      }

      const productCount = productIds.length;

      for (const productId of productIds) {
        const existingAssignment = productAssignments.get(productId);

        if (
          !existingAssignment ||
          productCount < existingAssignment.productCount
        ) {
          productAssignments.set(productId, {
            collectionId,
            productCount,
          });
        }
      }
    }

    for (const [productId, assignment] of productAssignments) {
      productsByCollectionId.get(assignment.collectionId)?.push(productId);
    }

    logger.info(
      `Selected ${productAssignments.size} primary Product Collection assignments across ${productsByCollectionId.size} Medusa collections.`
    );

    logger.progress(activityId, 'Persisting Product Collection assignments...');

    const productModuleService = container.resolve('product');

    // Process collections sequentially to prevent being rate-limited
    for (const [collectionId, productIds] of productsByCollectionId) {
      await productModuleService.updateProductCollections(collectionId, {
        product_ids: productIds,
      });
    }

    logger.success(activityId, 'Finished migrating all data from Shopify!');

    res.sendStatus(200);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    logger.failure(
      activityId,
      'Failed to migrate Shopify data to Medusa database'
    );

    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      'Failed to migrate Shopify data into Medusa',
      e
    );
  }
}
