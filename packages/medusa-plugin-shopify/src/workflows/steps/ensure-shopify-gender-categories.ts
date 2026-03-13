import type {
  CreateProductCategoryDTO,
  ProductCategoryDTO,
} from '@medusajs/framework/types';
import { MedusaError, Modules } from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import {
  SHOPIFY_GENDER_CATEGORY_DEFINITIONS,
  ShopifyProductGender,
} from '../../lib/utils';

type EnsureShopifyGenderCategoriesOutput = {
  genderCategoryIds: Record<ShopifyProductGender, string>;
};

export const ensureShopifyGenderCategoriesStep = createStep<
  void,
  EnsureShopifyGenderCategoriesOutput,
  string[]
>(
  'ensure-shopify-gender-categories',
  async (_, { container }) => {
    const productModuleService = container.resolve(Modules.PRODUCT);
    const logger = container.resolve('logger');
    const categoryDefinitions = Object.entries(
      SHOPIFY_GENDER_CATEGORY_DEFINITIONS
    ) as [ShopifyProductGender, { handle: string; name: string }][];
    const categoryHandles = categoryDefinitions.map(
      ([, definition]) => definition.handle
    );

    logger.info(
      `Ensuring Shopify gender categories exist for handles ${JSON.stringify(categoryHandles)}...`
    );

    const existingCategories: ProductCategoryDTO[] =
      await productModuleService.listProductCategories(
        {
          handle: categoryHandles,
        },
        {
          take: categoryHandles.length,
          skip: 0,
        }
      );

    const categoriesByHandle = new Map(
      existingCategories.map((category) => [category.handle, category])
    );

    const categoriesToCreate: CreateProductCategoryDTO[] = categoryDefinitions
      .filter(([, definition]) => !categoriesByHandle.has(definition.handle))
      .map(([gender, definition]) => ({
        name: definition.name,
        handle: definition.handle,
        is_active: true,
        metadata: {
          source: 'shopify-migration',
          shopify_gender: gender,
        },
      }));

    const createdCategories: ProductCategoryDTO[] = categoriesToCreate.length
      ? await productModuleService.createProductCategories(categoriesToCreate)
      : [];

    createdCategories.forEach((category) => {
      categoriesByHandle.set(category.handle, category);
    });

    const genderCategoryIds = categoryDefinitions.reduce(
      (result, [gender, definition]) => {
        const categoryId = categoriesByHandle.get(definition.handle)?.id;

        if (!categoryId) {
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            `Missing Shopify gender category for handle ${definition.handle}`
          );
        }

        result[gender] = categoryId;
        return result;
      },
      {} as Record<ShopifyProductGender, string>
    );

    logger.info(
      `Using Shopify gender categories ${JSON.stringify(genderCategoryIds)}`
    );

    return new StepResponse(
      {
        genderCategoryIds,
      },
      createdCategories.map((category) => category.id)
    );
  },
  async (createdCategoryIds, { container }) => {
    if (!createdCategoryIds?.length) {
      return;
    }

    const productModuleService = container.resolve(Modules.PRODUCT);
    await productModuleService.deleteProductCategories(createdCategoryIds);
  }
);
