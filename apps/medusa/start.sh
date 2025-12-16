#!/bin/sh

set -e

echo "Publishing medusa-plugin-shopify..."
(
  cd ../../packages/medusa-plugin-shopify
  npx medusa plugin:publish
)

echo "Running database migrations..."
npx medusa db:migrate

echo "Seeding database..."
pnpm run seed || echo "Seeding failed, continuing..."

echo "Starting Medusa development server..."
pnpm run dev
