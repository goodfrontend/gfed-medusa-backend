import crypto from 'crypto';

import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';

// eslint-disable-next-line turbo/no-undeclared-env-vars
const WEBHOOK_SECRET = process.env.PERSONALIZATION_WEBHOOK_SECRET;

export function validateWebhookSignature(
  req: MedusaRequest,
  res: MedusaResponse,
  next: () => void
) {
  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Webhook secret is not configured' });
  }

  const signature = req.get('x-personalization-signature');

  if (!signature) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  const payload = JSON.stringify(req.body ?? {});
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return res.status(403).json({ error: 'Invalid webhook signature' });
  }

  return next();
}
