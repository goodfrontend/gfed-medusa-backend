# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base

# Update system packages to fix vulnerabilities
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH"

RUN mkdir -p /pnpm /app && chown -R node:node /pnpm /app

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY --chown=node:node pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY --chown=node:node apps/medusa/package.json apps/medusa/package.json
COPY --chown=node:node packages/medusa-plugin-shopify/package.json packages/medusa-plugin-shopify/package.json
COPY --chown=node:node packages/eslint-config/package.json packages/eslint-config/package.json
COPY --chown=node:node packages/prettier-config/package.json packages/prettier-config/package.json
COPY --chown=node:node packages/typescript-config/package.json packages/typescript-config/package.json

USER node

RUN pnpm install --frozen-lockfile

FROM deps AS dev

COPY --chown=node:node . .

USER node

CMD ["pnpm", "--filter", "medusa", "dev"]

FROM deps AS builder

ENV CI=true

COPY --chown=node:node . .

USER node

RUN pnpm install --frozen-lockfile
RUN pnpm --filter medusa run build:prod

FROM base AS runner

ENV NODE_ENV=production \
    PORT=9000

WORKDIR /app/apps/medusa/.medusa/server

COPY --from=builder --chown=node:node /app /app

USER node

EXPOSE 9000

CMD ["sh", "-c", "pnpm run predeploy && pnpm run start:prod"]
