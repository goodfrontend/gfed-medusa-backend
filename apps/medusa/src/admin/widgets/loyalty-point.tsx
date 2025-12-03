import { defineWidgetConfig } from '@medusajs/admin-sdk';
import {
  AdminCustomer,
  DetailWidgetProps,
  InferTypeOf,
} from '@medusajs/framework/types';
import { Container, Heading, Text } from '@medusajs/ui';
import { useQuery } from '@tanstack/react-query';

import LoyaltyPoint from '../../modules/loyalty/models/loyalty-point';
import { sdk } from '../lib/sdk';

type LoyaltyPoint = InferTypeOf<typeof LoyaltyPoint>;

const LoyaltyPointWidget = ({
  data: customer,
}: DetailWidgetProps<AdminCustomer>) => {
  const { data, isLoading, error } = useQuery<LoyaltyPoint>({
    queryFn: () =>
      sdk.client.fetch(`/admin/loyalty-points?customer_id=${customer.id}`),
    queryKey: ['customer-loyalty-point', customer.id],
  });

  if (error) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Other Information</Heading>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small">Available Loyalty Points</Text>
        <Text size="small">{isLoading ? '...' : data?.points || 0}</Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small">Locked Loyalty Points</Text>
        <Text size="small">{isLoading ? '...' : data?.locked_points || 0}</Text>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: 'customer.details.side.after',
});

export default LoyaltyPointWidget;
