# syntax=docker/dockerfile:1

FROM node:20-bookworm AS base

ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY apps/medusa/package.json apps/medusa/package.json
COPY packages/medusa-plugin-shopify/package.json packages/medusa-plugin-shopify/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/prettier-config/package.json packages/prettier-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS dev

COPY . .

CMD ["pnpm", "--filter", "medusa", "dev"]

FROM deps AS builder

ENV CI=true

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter medusa run build:prod

FROM base AS runner

ENV NODE_ENV=production \
    PORT=9000

WORKDIR /app/apps/medusa/.medusa/server

COPY --from=builder /app /app

RUN chown -R node:node /app

USER node

EXPOSE 9000

CMD ["sh", "-c", "pnpm run predeploy && pnpm run start:prod"]
