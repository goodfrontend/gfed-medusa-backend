import { defineConfig, loadEnv } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE as
      | 'shared'
      | 'worker'
      | 'server',
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
    databaseDriverOptions: {
      ssl: false,
      sslmode: 'disable',
    },
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL,
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
  },
  modules: [
    {
      resolve: './src/modules/algolia',
      options: {
        appId: process.env.ALGOLIA_APP_ID!,
        apiKey: process.env.ALGOLIA_API_KEY!,
        productIndexName: process.env.ALGOLIA_PRODUCT_INDEX_NAME!,
      },
    },
    {
      resolve: './src/modules/loyalty',
      options: {
        conversionRate: process.env.LOYALTY_CONVERSION_RATE,
      },
    },
    {
      resolve: './src/modules/wishlist',
    },
  ],
  plugins: [
    {
      resolve: '@gfed-medusa-backend/medusa-plugin-shopify',
      options: {
        baseUrl: process.env.SHOPIFY_BASE_URL,
      },
    },
  ],
});
