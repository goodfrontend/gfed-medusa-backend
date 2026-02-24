import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';

const DEPLOY_MARKER = 'fra-migration-check-2026-02-24';

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.status(200).json({
    ok: true,
    deployMarker: DEPLOY_MARKER,
  });
}
