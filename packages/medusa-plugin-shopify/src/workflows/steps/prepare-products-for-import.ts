/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  CreateProductVariantWorkflowInputDTO,
  CreateProductWorkflowInputDTO,
  ProductDTO,
  ProductTagDTO,
  ProductTypeDTO,
  UpsertProductDTO,
  UpsertProductVariantDTO,
} from '@medusajs/framework/types';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { sanitizeHandle } from '../../lib/utils';
import { ShopifyProduct } from '../../modules/shopify/types';

type PrepareProductsForImportStepInput = {
  products: ShopifyProduct[];
  stores: any;
  shippingProfiles: any;
  existingProducts: ProductDTO[];
  productTags: ProductTagDTO[];
  productTypes: ProductTypeDTO[];
};

export const prepareProductsForImportStep = createStep(
  'prepare-products-for-import',
  async ({
    products,
    stores,
    shippingProfiles,
    existingProducts,
    productTags,
    productTypes,
  }: PrepareProductsForImportStepInput) => {
    const productsToCreate = new Map<string, CreateProductWorkflowInputDTO>();
    const productsToUpdate = new Map<string, UpsertProductDTO>();
    const productsToCreateAdditionalData = new Map<
      string,
      Record<string, unknown>
    >();
    const productsToUpdateAdditionalData = new Map<
      string,
      Record<string, unknown>
    >();
    const variantsToCreateAdditionalData = new Map<
      string,
      Record<string, unknown>
    >();
    const variantsToUpdateAdditionalData = new Map<
      string,
      Record<string, unknown>
    >();

    products.forEach((shopifyProduct) => {
      const shopifyProductId = shopifyProduct.id.toString();
      const existingProduct = existingProducts?.find(
        (existingProduct) => existingProduct.external_id === shopifyProductId
      );
      const tagsToLink = productTags.filter((tag) =>
        shopifyProduct.tags.includes(tag.value)
      );
      const tagIdsToLink = tagsToLink.map((tag) => tag.id);
      const typeToLink = productTypes.find(
        (type) => type.value === shopifyProduct.product_type
      );

      type OptionKey = 'option1' | 'option2' | 'option3';
      const optionKeys: OptionKey[] = ['option1', 'option2', 'option3'];

      const productOptions = shopifyProduct.options?.map((option) => {
        const existingOption = existingProduct?.options?.find(
          (existingOpt) => existingOpt.title === option.name
        );

        return {
          title: option.name,
          values: option.values,
          ...(existingOption
            ? {
                id: existingOption.id,
              }
            : null),
        };
      });

      const productVariants:
        | CreateProductVariantWorkflowInputDTO[]
        | UpsertProductVariantDTO[] = [];

      shopifyProduct.variants?.forEach((variant) => {
        const variantExternalId = variant.id.toString();
        const existingVariant =
          existingProduct?.variants &&
          existingProduct?.variants?.find(
            (v) => v.metadata?.external_id === variantExternalId
          );
        const productOption = (optionIndex: number) => {
          const key = optionKeys[optionIndex - 1];
          const value = key ? variant[key] : undefined;
          return productOptions.find((pOption) =>
            value ? pOption.values.includes(value) : false
          );
        };
        const childOptions = {
          ...(productOption(1)?.title
            ? {
                [productOption(1)?.title ?? variant.option1]: variant.option1,
              }
            : null),
          ...(productOption(2)?.title
            ? {
                [productOption(2)?.title ?? variant.option2]: variant.option2,
              }
            : null),
          ...(productOption(3)?.title
            ? {
                [productOption(3)?.title ?? variant.option3]: variant.option3,
              }
            : null),
        };

        const variantAdditionalData = {
          requires_shipping: variant.requires_shipping,
        };

        if (existingVariant) {
          variantsToUpdateAdditionalData.set(
            existingVariant.id,
            variantAdditionalData
          );
        } else {
          variantsToCreateAdditionalData.set(
            variantExternalId,
            variantAdditionalData
          );
        }

        productVariants.push({
          title: variant.title,
          sku: variant.sku,
          prices: stores[0].supported_currencies.map(
            (c: { currency_code: string }) => {
              return {
                amount: variant.price,
                currency_code: c.currency_code,
              };
            }
          ),
          options: childOptions,
          metadata: {
            external_id: variantExternalId,
          },
          ...(existingVariant
            ? {
                id: existingVariant.id,
              }
            : null),
        });
      });

      const productData: CreateProductWorkflowInputDTO | UpsertProductDTO = {
        title: shopifyProduct.title,
        description: shopifyProduct.body_html,
        status: 'published',
        handle: sanitizeHandle(shopifyProduct.handle),
        external_id: shopifyProductId,
        thumbnail: shopifyProduct.images?.[0]?.src,
        tag_ids: tagIdsToLink,
        type_id: typeToLink?.id,
        sales_channels: [
          {
            id: stores[0].default_sales_channel_id,
          },
        ],
        shipping_profile_id: shippingProfiles[0].id,
        options: productOptions,
        images: shopifyProduct.images.map((entry) => {
          const existingImage = existingProduct?.images?.find(
            (existingImg) =>
              existingImg.metadata?.external_id === entry.id.toString()
          );

          return {
            url: entry.src,
            metadata: {
              external_id: entry.id.toString(),
            },
            ...(existingImage
              ? {
                  id: existingImage.id,
                }
              : null),
          };
        }),
        variants: productVariants,
        ...(existingProduct
          ? {
              id: existingProduct.id,
            }
          : null),
      };

      const additionalProductData = {
        vendor: shopifyProduct.vendor,
      };

      if (existingProduct) {
        productsToUpdate.set(existingProduct.id, productData);
        productsToUpdateAdditionalData.set(
          existingProduct!.id,
          additionalProductData
        );
      } else {
        productsToCreate.set(
          productData.external_id!,
          productData as CreateProductWorkflowInputDTO
        );
        productsToCreateAdditionalData.set(
          productData.external_id!,
          additionalProductData
        );
      }
    });

    return new StepResponse({
      productsToCreate: Array.from(productsToCreate.values()),
      productsToUpdate: Array.from(productsToUpdate.values()),
      productsToCreateAdditionalData: Object.fromEntries(
        productsToCreateAdditionalData
      ),
      productsToUpdateAdditionalData: Object.fromEntries(
        productsToUpdateAdditionalData
      ),
      variantsToCreateAdditionalData: Object.fromEntries(
        variantsToCreateAdditionalData
      ),
      variantsToUpdateAdditionalData: Object.fromEntries(
        variantsToUpdateAdditionalData
      ),
    });
  }
);
