import Medusa from '@medusajs/js-sdk';

// Defaults to standard port for Medusa server
const DEFAULT_MEDUSA_BACKEND_URL = 'http://localhost:9000';

export const sdk = new Medusa({
  baseUrl: __BACKEND_URL__ || DEFAULT_MEDUSA_BACKEND_URL,
  debug: import.meta.env.NODE_ENV === 'development',
  auth: {
    type: 'session',
  },
});
