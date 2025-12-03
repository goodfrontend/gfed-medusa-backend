import z from 'zod';

import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { createFindParams } from '@medusajs/medusa/api/utils/validators';

import ProductVariantProductVariantExtendedLink from '../../../links/product-variant-product-variant-extended';

// Define custom filterable fields in a separate schema
const CustomProductVariantFilters = z.object({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.string().optional(),
  requires_shipping: z.coerce.boolean().optional(),
});

// Create the base schema with standard list parameters
const BaseFindParams = createFindParams();

// Merge the two schemas together
export const GetProductVariantsWithCustomSchema = BaseFindParams.merge(
  CustomProductVariantFilters
);

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const rawRequiresShipping = req.query?.requires_shipping;
  let requiresShipping;

  if (rawRequiresShipping === 'true') {
    requiresShipping = true;
  } else if (rawRequiresShipping === 'false') {
    requiresShipping = false;
  }

  if (requiresShipping !== undefined) {
    // Support `requires_shipping` custom property START

    // Step 1: Get all product_variant_extended IDs that have `requires_shipping` equal to the value in the request query
    const { data: productVariantExtendedData } = await query.graph({
      entity: 'product_variant_extended',
      fields: ['*'],
      filters: {
        requires_shipping: requiresShipping,
      },
    });

    const productVariantExtendedIds = productVariantExtendedData.map(
      ({ id }) => id
    );

    // Step 2: Get all variant IDs that are linked to the productVariantExtendedIds
    const { data: productVariantAndProductVariantExtendedLinkData } =
      await query.graph({
        entity: ProductVariantProductVariantExtendedLink.entryPoint,
        fields: ['*', 'product_variant.*', 'product_variant_extended.*'],
        filters: {
          product_variant_extended_id: productVariantExtendedIds,
        },
      });

    const productVariantIds = productVariantAndProductVariantExtendedLinkData
      .filter(({ product_variant }) => product_variant)
      .map(({ product_variant }) => product_variant.id)
      .filter((pvid) =>
        req.validatedQuery.id ? pvid === req.validatedQuery.id : true
      );

    // Step 3: Get all product variants that have the specified productVariantIds
    const vQReqShipping = req.validatedQuery as { title?: string };
    const reqShippingFilters: Partial<{ title: string }> = {};
    if (vQReqShipping?.title) {
      reqShippingFilters.title = vQReqShipping.title;
    }

    const { data: productVariants, metadata: { count, take, skip } = {} } =
      await query.graph({
        entity: 'product_variant',
        ...req.queryConfig,
        fields:
          req.queryConfig.fields.length > 0
            ? [...req.queryConfig.fields, 'id']
            : [
                '*',
                'options.*',
                'product.*',
                'metadata.*',
                'product_variant_extended.*',
              ],
        filters: { id: productVariantIds, ...reqShippingFilters },
      });

    res.json({
      variants: productVariants,
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

  const { data: productVariants, metadata: { count, take, skip } = {} } =
    await query.graph({
      entity: 'product_variant',
      ...req.queryConfig,
      fields:
        req.queryConfig.fields.length > 0
          ? [...req.queryConfig.fields, 'id']
          : ['*', 'options.*', 'product.*', 'metadata.*', 'sales_channels.*'],
      filters: baseFilters,
    });

  res.json({
    variants: productVariants,
    count,
    limit: take,
    offset: skip,
  });
};
