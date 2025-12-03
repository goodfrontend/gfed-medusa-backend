# Medusa

## Backend Development Server Setup Instructions

1. Set up the environment variables. Copy the `.env.template` to a local `.env` and update the values as needed.

   ```bash
   cp .env.template .env
   ```

2. In the `.env` file, specify the `DATABASE_URL` value. The [format](https://docs.medusajs.com/learn/configurations/medusa-config#databaseurl) is as follows:

   ```text
   postgres://[user][:password]@[host][:port]/[dbname]
   ```

   e.g.

   ```text
   postgres://postgres:pass123@localhost/medusajs-dummy-store-db
   ```

   If you already have a PostgreSQL database (deployed or local), you can already construct the `DATABASE_URL` value. You could also store the value somewhere where it's safe to store secrets and variables and retrieve it from there.

   However, If you haven't created and set up a PostgreSQL database yet, follow the ff instructions:
   - Create a PostgreSQL database using Medusa CLI's [db commands](https://docs.medusajs.com/resources/medusa-cli/commands/db):

     ```bash
     npx medusa db:create --db <dbname>
     ```

     _Note_: Use the same `dbname` you specified in the `DATABASE_URL` env variable

   - Apply database migrations and set up your database schema:

     ```bash
     npx medusa db:migrate
     ```

   - Seed the database with initial/dummy data

     ```bash
     pnpm run seed
     ```

3. Publish `@gfed-medusa-backend/medusa-plugin-shopify` plugin locally. Follow `packages/medusa-plugin-shopify` README's [Get Started](../../packages/medusa-plugin-shopify/README.md#get-started) section.

4. Start the development server:

   ```bash
   pnpm run dev
   ```

   This will open the medusa app in [http://localhost:9000](http://localhost:9000).

5. Open the Medusa Admin dashboard at [http://localhost:9000/app](http://localhost:9000/app).

6. Login with your admin user credentials in [http://localhost:9000/app/login](http://localhost:9000/app/login). If you don't have a user yet, create one using the ff [command](https://docs.medusajs.com/learn/installation#create-medusa-admin-user):

   ```bash
   npx medusa user -e youremail@email.com -p password
   ```

7. Go to [Settings > Publishable API Keys](http://localhost:9000/app/settings/publishable-api-keys) and copy a Publishable API key. This will be used for running the `medusa-storefront` application.

## Populating `products` data with Shopify Data Migration

By running `pnpm run seed` above, we only populated few dummy product data. To populate more products data in our database, we can use `medusa-plugin-shopify`. This plugin handles migration of Shopify product data feed from specific source, transforms it to conform with Medusa's product data model, and adds the products to our database.

To use this plugin in this application, please refer to [medusa-plugin-shopify's README](../../packages/medusa-plugin-shopify/README.md)

## Seeding Stock and Inventory After Migration

When using the Shopify migration, after all data has been migrated run the following command to add stock to all existing variants:

```bash
pnpm run db:seed:stock
```
