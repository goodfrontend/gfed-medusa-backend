import Medusa from '@medusajs/js-sdk';

// Defaults to standard port for Medusa server
const DEFAULT_MEDUSA_BACKEND_URL = 'http://localhost:9000';

export const sdk = new Medusa({
  baseUrl:
    import.meta.env.VITE_MEDUSA_BACKEND_URL || DEFAULT_MEDUSA_BACKEND_URL,
  debug: import.meta.env.NODE_ENV === 'development',
  auth: {
    type: 'session',
  },
});
