import { defineWidgetConfig } from '@medusajs/admin-sdk';
import {
  AdminProductVariant,
  DetailWidgetProps,
} from '@medusajs/framework/types';
import { Container, Heading, Text, clx } from '@medusajs/ui';
import { useQuery } from '@tanstack/react-query';

import { sdk } from '../lib/sdk';

type AdminProductVariantExtended = AdminProductVariant & {
  ['product_variant_extended']?: {
    id: string;
    requires_shipping: boolean;
  };
};

const ProductVariantExtendedWidget = ({
  data: variant,
}: DetailWidgetProps<AdminProductVariant>) => {
  const { data: queryResult } = useQuery({
    queryFn: () =>
      sdk.admin.product.retrieveVariant(
        variant.product_id as string,
        variant.id,
        {
          fields: '+product_variant_extended.*',
        }
      ),
    queryKey: [['variant', variant.id]],
  });
  const requiresShipping = (queryResult?.variant as AdminProductVariantExtended)
    ?.product_variant_extended?.requires_shipping;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Requires Shipping</Heading>
        </div>
      </div>
      <div
        className={clx(
          `text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4`
        )}
      >
        <Text size="small" weight="plus" leading="compact">
          Value
        </Text>

        <Text
          size="small"
          leading="compact"
          className="whitespace-pre-line text-pretty"
        >
          {requiresShipping?.toString()}
        </Text>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: 'product_variant.details.side.after',
});

export default ProductVariantExtendedWidget;
