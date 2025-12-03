import z from 'zod';

import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { createFindParams } from '@medusajs/medusa/api/utils/validators';

import ProductProductExtendedLink from '../../../links/product-product-extended';

// Define custom filterable fields in a separate schema
const CustomProductFilters = z.object({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.string().optional(),
  vendor: z.string().optional(),
});

// Create the base schema with standard list parameters
const BaseFindParams = createFindParams();

// Merge the two schemas together
export const GetProductsWithCustomSchema =
  BaseFindParams.merge(CustomProductFilters);

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const vendor = req.query?.vendor;

  if (vendor) {
    // Support `vendor` custom property START

    // Step 1: Get all product_extended IDs that have `vendor` equal to the value in the request query
    const { data: productExtendedData } = await query.graph({
      entity: 'product_extended',
      fields: ['*'],
      filters: {
        vendor: vendor.toString(),
      },
    });

    const productExtendedIds = productExtendedData.map(({ id }) => id);

    // Step 2: Get all product IDs that are linked to the productExtendedIds
    const { data: productAndProductExtendedLinkData } = await query.graph({
      entity: ProductProductExtendedLink.entryPoint,
      fields: ['*', 'product.*', 'product_extended.*'],
      filters: {
        product_extended_id: productExtendedIds,
      },
    });

    const productIds = productAndProductExtendedLinkData
      .map(({ product }) => product.id)
      .filter((pid) =>
        req.validatedQuery.id ? pid === req.validatedQuery.id : true
      );

    // Step 3: Get all products that have the specified productIds
    const vqVendor = req.validatedQuery as { title?: string };
    const vendorFilters: Partial<{ title: string }> = {};
    if (vqVendor?.title) {
      vendorFilters.title = vqVendor.title;
    }

    const { data: products, metadata: { count, take, skip } = {} } =
      await query.graph({
        entity: 'product',
        ...req.queryConfig,
        fields:
          req.queryConfig.fields.length > 0
            ? [...req.queryConfig.fields, 'id']
            : [
                '*',
                'options.*',
                'tags.*',
                'images.*',
                'variants.*',
                'sales_channels.*',
                'product_extended.*',
              ],
        filters: { id: productIds, ...vendorFilters },
      });

    res.json({
      products,
      count,
      limit: take,
      offset: skip,
    });

    return;
  }

  const vq = req.validatedQuery as { id?: string | string[]; title?: string };
  const baseFilters: Partial<{ id: string | string[]; title: string }> = {};
  if (vq?.id) {
    baseFilters.id = vq.id;
  }
  if (vq?.title) {
    baseFilters.title = vq.title;
  }

  const { data: products, metadata: { count, take, skip } = {} } =
    await query.graph({
      entity: 'product',
      ...req.queryConfig,
      fields:
        req.queryConfig.fields.length > 0
          ? [...req.queryConfig.fields, 'id']
          : [
              '*',
              'options.*',
              'tags.*',
              'images.*',
              'variants.*',
              'sales_channels.*',
            ],
      filters: baseFilters,
    });

  res.json({
    products,
    count,
    limit: take,
    offset: skip,
  });
};
