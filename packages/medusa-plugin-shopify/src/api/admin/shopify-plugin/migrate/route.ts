import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import {
  ContainerRegistrationKeys,
  MedusaError,
} from '@medusajs/framework/utils';

import { linkProductsToCollectionWorkflow } from '../../../../workflows/link-products-to-collection';
import { migrateShopifyDataWorkflow } from '../../../../workflows/migrate';

const HARD_LIMIT = 2000;

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

    logger.progress(activityId, 'Linking Products to Product Collections...');

    // Process collections sequentially to prevent being rate-limited
    for (const collection of collections) {
      await linkProductsToCollectionWorkflow(container).run({
        input: {
          collection,
          hardLimit: hardLimitProductsPerCollection
            ? Number(hardLimitProductsPerCollection)
            : undefined,
        },
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
