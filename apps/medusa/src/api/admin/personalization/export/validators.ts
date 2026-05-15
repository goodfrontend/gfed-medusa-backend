import { z } from 'zod';

export const AdminGetPersonalizationExportQuery = z.object({
  since: z.string().datetime().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

export type AdminGetPersonalizationExportQueryType = z.infer<
  typeof AdminGetPersonalizationExportQuery
>;
