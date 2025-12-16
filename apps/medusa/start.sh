#!/bin/sh

set -e

# Ensure paths referenced by admin build exist inside the container
mkdir -p /apps
ln -sfn /app/apps/medusa /apps/medusa

echo "Publishing medusa-plugin-shopify..."
(
  cd ../../packages/medusa-plugin-shopify
  npx medusa plugin:publish
)

echo "Running database migrations..."
npx medusa db:migrate

echo "Starting Medusa development server..."
pnpm run dev
