import Medusa from '@medusajs/js-sdk';

// Defaults to standard port for Medusa server
const DEFAULT_MEDUSA_BACKEND_URL = 'http://localhost:9000';
const BROWSER_BACKEND_URL =
  typeof window !== 'undefined' ? window.location.origin : undefined;

const resolveBackendUrl = () => {
  const configuredBackendUrl = __BACKEND_URL__?.trim();

  if (configuredBackendUrl) {
    return configuredBackendUrl;
  }

  if (BROWSER_BACKEND_URL) {
    return BROWSER_BACKEND_URL;
  }

  return DEFAULT_MEDUSA_BACKEND_URL;
};

export const sdk = new Medusa({
  baseUrl: resolveBackendUrl(),
  debug: import.meta.env.NODE_ENV === 'development',
  auth: {
    type: 'session',
  },
});
