# GFED Medusa Backend Monorepo

A monorepo containing MedusaJS backend application, Shopify-to-Medusa data migration plugin, and shared tooling (ESLint, Jest, Prettier, and Typescript).

## Pre-requisites

- [Node.js](https://nodejs.org/en/download) (v20+)
- [pnpm](https://pnpm.io/installation) (v10+)
- [PostgreSQL](https://www.postgresql.org/download/)

## Workspace Layout

- `apps/medusa` – Medusa backend + admin dashboard, custom modules, seed scripts
- `packages/medusa-plugin-shopify` – Imports Shopify products/collections/tags/types, adds custom product properties, exposes admin UI widgets
- `packages/{eslint-config,jest-config,prettier-config,typescript-config}` – Repo-wide tooling presets

## Local Development Setup Instructions

1. In the **root directory**, use `pnpm` to install all dependencies specified in all package.json files across all packages.

   ```bash
   pnpm install
   ```

2. Go to `apps/medusa` and follow the setup instructions in that package's [README](apps/medusa/README.md) for running the backend development server and local PostgreSQL database.

   ```bash
   cd apps/medusa
   ```
