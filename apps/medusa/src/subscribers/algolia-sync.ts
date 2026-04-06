import { SubscriberArgs, type SubscriberConfig } from '@medusajs/framework';

import { runAlgoliaFullSync } from './utils/algolia-sync';

export default async function algoliaSyncHandler({
  container,
}: SubscriberArgs) {
  await runAlgoliaFullSync(container);
}

export const config: SubscriberConfig = {
  event: 'algolia.sync',
};
