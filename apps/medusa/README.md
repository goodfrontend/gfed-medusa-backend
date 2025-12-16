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

## Docker (local dev)

- Copy `.env.template` to `.env.docker` and fill in values. Defaults target the compose Postgres service (`postgres://medusa_user:medusa_password@postgres:5432/medusa`); change the host to `host.docker.internal` if you ever want to point at a host DB instead. Redis is optional—leave `REDIS_URL` commented out if you don't need it.
- From the repo root run `docker compose -f apps/medusa/docker-compose.yml up --build`. The Medusa container runs `start.sh`, which publishes `medusa-plugin-shopify`, runs migrations (`medusa db:migrate`), seeds (`pnpm run seed`), then starts `pnpm run dev` with hot reload. Postgres 17 is provided automatically via compose. The DB is exposed on host port `5433` (container `5432`) to avoid clashing with a local Postgres—connect from your host via `localhost:5433` if needed. Enable Redis later with `--profile redis` and by setting `REDIS_URL` in `.env.docker`.
- Create an admin user inside the running container if needed: `docker compose -f apps/medusa/docker-compose.yml exec medusa pnpm exec medusa user -e you@example.com -p password`.
- Stop the stack with `docker compose -f apps/medusa/docker-compose.yml down` (add `-v` to drop the Postgres/Redis volumes).

## Docker image / Render deployment

- Build a production image locally with `docker build -f apps/medusa/Dockerfile -t medusa-app .`. The image runs migrations (`pnpm run predeploy`) before starting the server.
- Required runtime env vars: `DATABASE_URL`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, `MEDUSA_BACKEND_URL`, `VITE_MEDUSA_BACKEND_URL`, and `PORT` (Render sets `PORT` automatically). Optional: `REDIS_URL` (enable if you add Redis), Algolia, and Shopify settings.
- Example local run against an external Postgres: `docker run --env-file apps/medusa/.env.docker -p 9000:9000 medusa-app` (add `REDIS_URL` if you enable Redis).
- Render: create a Web Service using Docker, set `Dockerfile Path` to `apps/medusa/Dockerfile` and `Context` to the repo root, attach Render Postgres URL (v18) to `DATABASE_URL`, and keep `PORT` set to Render's provided value. Add Redis later by setting `REDIS_URL` to your Render Redis URL. The default container command already runs migrations before `pnpm run start:prod`.
