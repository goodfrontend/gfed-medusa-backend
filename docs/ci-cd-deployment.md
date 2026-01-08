# CI/CD and Deployment

This document describes how the Medusa backend is built, tested, and deployed. CI runs on GitHub Actions, images are pushed to Github Container Registry (GHCR), and deployments are orchestrated on Render.

## Overview

- Code changes are validated on pull requests (lint, unit tests, build).
- Merges to `main` build a Docker image and deploy it to Render.
- Environments deploy in sequence: Smoke -> QA -> Production with QA and Production requiring explicit approval.
- Key files:
  - Workflows: `.github/workflows/**`
  - Render services: `render.yaml`

## Technologies used

- GitHub Actions (CI/CD)
- Docker
- GitHub Container Registry (GHCR)
- Render (hosting and deployment)

## Render environments and services (prerequisites)

Render services must exist before the deploy workflow can target them. The source of truth lives in `render.yaml`.

Projects and environments:

- Project: `GFED Medusa Backend and DB`.
- Environments: Production, QA, Smoke.
- Each environment defines a Render web service using `runtime: image` and `plan: free` in region `singapore`.
- Service names:
  - Production: `gfed-medusa-be`
  - QA: `gfed-medusa-be-qa`
  - Smoke: `gfed-medusa-be-smoke`

Image and deploy behavior:

- `autoDeployTrigger: off` so deploys are controlled by GitHub Actions.
- `image.url` defaults to `ghcr.io/goodfrontend/gfed-medusa-backend/medusa:latest`.
- The deploy workflow overrides the image per deploy by PATCHing the service to use the SHA-based tag.

Environment variables:

- Each service pulls from a Render env group:
  - Production: `backend-env-group-prod`
  - QA: `backend-env-group-qa`
  - Smoke: `backend-env-group-smoke`

## Required secrets and permissions

GitHub Actions:

- `GITHUB_TOKEN` (provided by GitHub) for pushing images to GHCR.
- `RENDER_API_KEY` secret for triggering Render deployments.

Render:

- Services must exist with the names above so the deploy workflow can find them via the Render API.

## CI workflow (pull requests)

Workflow: `CI - Medusa` (`.github/workflows/ci-medusa.yaml`)

Trigger:

- `pull_request` with changes in `apps/medusa/**`, `packages/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, or `.github/workflows/**`.

Concurrency:

- Grouped by PR number; in-progress runs are cancelled on new commits.

Steps:

- Checkout code.
- Setup PNPM `10.18.2` and Node.js `20`.
- Install dependencies with `pnpm install --frozen-lockfile`.
- Lint: `pnpm --filter medusa lint`.
- Unit tests: `pnpm --filter medusa test:unit`.
- Build: `pnpm --filter medusa build`.

## Deployment workflow (main branch)

Workflow: `Deploy` (`.github/workflows/deploy-medusa.yaml`)

Trigger:

- `push` to `main`.

Flow:

1. Detect changes with `dorny/paths-filter`.
   - If relevant files changed (Medusa app, shared packages, workspace files, `render.yaml`, or workflows), a deploy proceeds.
2. Build Docker image (reusable workflow): `.github/workflows/_build-docker.yaml`.
   - Builds and pushes `ghcr.io/<org>/<repo>/medusa:<git_sha>` using Buildx.
   - Auth uses `GITHUB_TOKEN` and GitHub Packages permissions.
   - **Note:** We are building the image in Github Actions to save Render pipeline minutes cost.
3. Deploy to Render (reusable workflow): `.github/workflows/_deploy-render.yaml`.
   - Environments deploy in order: Smoke -> QA -> Production. Smoke deploys automatically while QA and Production requires explicit approval.
   - Requires `RENDER_API_KEY` secret.
   - Updates the target Render service to the new image tag, triggers a deploy, and polls until live (or failure/timeout).
   - **Note:** The `predeploy` script (which contains database migrations) is executed in Render, not in Github Actions. This is because it is not ideal to have database related operations in Github Actions. This is fine as upon testing, it doesn't consume any Render pipeline minutes.

Concurrency:

- Deploys are grouped by ref and do not cancel in-progress runs.

## Setup Guide

1. **Create Environment Groups:** In Render Dashboard, create [Environment Groups](https://dashboard.render.com/env-groups) (e.g. `backend-env-group-prod`, `backend-env-group-qa`, `backend-env-group-smoke`) and add necessary environment variables in each env group. These will be used in Render blueprint (render.yaml).
2. **Create render.yaml:** In the codebase, create `render.yaml` which should contain all the necessary Render services. Make sure to use `runtime: image` for the services as we will be deploying a pre-built image in Render. For the initial image URL, you can use a placeholder image (e.g. `traefik/whoami:v1.11`). Push this to `main`.
3. **Create a blueprint in Render:** In Render, create a new Blueprint instance. In the creation page, connect to the Github repo. This should read the repo's `render.yaml` and should be the basis for the services and environments it will create once deployed.
4. **Generate Render API keys:** In Render, click on user's profile then go to Account Settings > API Keys and generate one API key per environment.
5. **Add Environments and Secrets in Github Repo:** Add environments in Github repo by going to Settings > Environments. There should be as many environments as were created in Render. In each environment, add `RENDER_API_KEY` and use the generated Render API key from the previous step as its value.
6. **Allow Write Permissions to Github Actions:** In the Github repo, go to Settings > Actions > General > Workflow permissions and enable Read and write permissions.
7. **Deploy applications:** Codes pushed to `main` that matches the filtered paths defined in `Detect changes` job in `deploy-medusa.yaml` will triggers the deploy workflow. That workflow builds the services' Docker images in Github Actions, push them to Github Container Registry (GHCR), and deploys those images the Render services.
