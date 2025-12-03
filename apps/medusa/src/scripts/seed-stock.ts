import { MedusaContainer } from '@medusajs/framework';
import {
  CreateInventoryLevelInput,
  ExecArgs,
  InventoryItemDTO,
  InventoryLevelDTO,
  StockLocationDTO,
} from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';

async function getInventoryItems(container: MedusaContainer) {
  const inventoryModuleService = container.resolve(Modules.INVENTORY);
  const inventoryItems: InventoryItemDTO[] = [];
  const take = 100;

  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const inventoryItemsResponse =
      await inventoryModuleService.listInventoryItems(
        {},
        {
          select: ['id'],
          take,
          skip,
        }
      );

    inventoryItems.push(...inventoryItemsResponse);
    skip += take;
    hasMore = inventoryItemsResponse.length === take;
  }

  return inventoryItems;
}

async function getStockLocation(container: MedusaContainer) {
  const stockModuleService = container.resolve(Modules.STOCK_LOCATION);

  const stockLocations = await stockModuleService.listStockLocations(
    {},
    {
      select: ['id'],
      take: 1,
    }
  );

  return stockLocations[0];
}

async function getInventoryLevels(container: MedusaContainer) {
  const inventoryModuleService = container.resolve(Modules.INVENTORY);
  const inventoryLevels: InventoryLevelDTO[] = [];
  const take = 100;

  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const inventoryLevelsResponse =
      await inventoryModuleService.listInventoryLevels(
        {},
        {
          select: ['inventory_item_id', 'location_id', 'id'],
          take,
          skip,
        }
      );

    inventoryLevels.push(...inventoryLevelsResponse);
    skip += take;
    hasMore = inventoryLevelsResponse.length === take;
  }

  return inventoryLevels;
}

function buildInventoryLevels(
  inventoryItems: InventoryItemDTO[],
  stockLocation: StockLocationDTO,
  dbInventoryLevels: InventoryLevelDTO[]
) {
  const inventoryLevels: CreateInventoryLevelInput[] = [];

  for (const inventoryItem of inventoryItems) {
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 1000000,
      inventory_item_id: inventoryItem.id,
    };

    inventoryLevels.push(inventoryLevel);
  }

  const inventoryLevelsToCreate = inventoryLevels.filter(
    (invLevel) =>
      !dbInventoryLevels.find(
        (dbInvLevel) =>
          dbInvLevel.inventory_item_id === invLevel.inventory_item_id &&
          dbInvLevel.location_id === invLevel.location_id
      )
  );

  return inventoryLevelsToCreate;
}

/**
 * Create dummy stock data for all products in the database.
 * For development use only.
 *
 * @param args -
 */
export default async function createStock({ container }: ExecArgs) {
  const inventoryModuleService = container.resolve(Modules.INVENTORY);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const activityId = logger.activity(
    'Creating stock data for all products in the database...'
  );

  const inventoryItems = await getInventoryItems(container);
  const stockLocation = await getStockLocation(container);
  const dbInventoryLevels = await getInventoryLevels(container);

  const inventoryLevels = buildInventoryLevels(
    inventoryItems,
    stockLocation,
    dbInventoryLevels
  );

  await inventoryModuleService.createInventoryLevels(inventoryLevels);

  logger.success(
    activityId,
    'Successfully created stock data for all products in the database!'
  );
}
