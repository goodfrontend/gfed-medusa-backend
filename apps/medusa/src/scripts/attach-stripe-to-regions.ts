import { ExecArgs, PaymentProviderDTO, RegionDTO } from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';

const STRIPE_PROVIDER_ID = 'pp_stripe_stripe';

type RegionWithPaymentProviders = Pick<RegionDTO, 'id' | 'name'> & {
  payment_providers?: Pick<PaymentProviderDTO, 'id'>[];
};

export default async function attachStripeToRegions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const link = container.resolve(ContainerRegistrationKeys.LINK);

  if (!process.env.STRIPE_API_KEY) {
    throw new Error(
      'STRIPE_API_KEY is required before attaching Stripe to existing regions.'
    );
  }

  const { data: regions } = await query.graph({
    entity: 'region',
    fields: ['id', 'name', 'payment_providers.id'],
  });

  const regionsMissingStripe = (regions as RegionWithPaymentProviders[]).filter(
    (region) =>
      !region.payment_providers?.some(
        (paymentProvider) => paymentProvider.id === STRIPE_PROVIDER_ID
      )
  );

  if (!regionsMissingStripe.length) {
    logger.info('Stripe is already attached to all existing regions.');
    return;
  }

  for (const region of regionsMissingStripe) {
    await link.create({
      [Modules.REGION]: {
        region_id: region.id,
      },
      [Modules.PAYMENT]: {
        payment_provider_id: STRIPE_PROVIDER_ID,
      },
    });

    logger.info(`Attached Stripe to region "${region.name}" (${region.id}).`);
  }

  logger.info(
    `Attached Stripe to ${regionsMissingStripe.length} region(s) successfully.`
  );
}
