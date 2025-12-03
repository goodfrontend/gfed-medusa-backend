import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { AdminProduct, DetailWidgetProps } from '@medusajs/framework/types';
import { Container, Heading, Text, clx } from '@medusajs/ui';
import { useQuery } from '@tanstack/react-query';

import { sdk } from '../lib/sdk';

type AdminProductExtended = AdminProduct & {
  ['product_extended']?: {
    id: string;
    vendor: string;
  };
};

const ProductExtendedWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const { data: queryResult } = useQuery({
    queryFn: () =>
      sdk.admin.product.retrieve(product.id, {
        fields: '+product_extended.*',
      }),
    queryKey: [['product', product.id]],
  });
  const vendor = (queryResult?.product as AdminProductExtended)
    ?.product_extended?.vendor;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Vendor</Heading>
        </div>
      </div>
      <div
        className={clx(
          `text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4`
        )}
      >
        <Text size="small" weight="plus" leading="compact">
          Name
        </Text>

        <Text
          size="small"
          leading="compact"
          className="whitespace-pre-line text-pretty"
        >
          {vendor || '-'}
        </Text>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: 'product.details.side.after',
});

export default ProductExtendedWidget;
