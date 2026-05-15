import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import type { Knex } from '@mikro-orm/knex';

import {
  exportTrainingData,
  exportTrainingDataCsv,
} from '../../../../lib/personalization';
import type { AdminGetPersonalizationExportQueryType } from './validators';

export async function GET(
  req: MedusaRequest<unknown, AdminGetPersonalizationExportQueryType>,
  res: MedusaResponse
) {
  const db = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION);
  const sinceDate = req.validatedQuery.since
    ? new Date(req.validatedQuery.since)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const samples = await exportTrainingData(db, sinceDate);

  if (req.validatedQuery.format === 'csv') {
    const csv = exportTrainingDataCsv(samples);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="personalization-training-${Date.now()}.csv"`
    );
    return res.send(csv);
  }

  return res.json({
    samples,
    count: samples.length,
  });
}
