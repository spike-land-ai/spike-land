# syntax=docker/dockerfile:1.20

ARG NODE_IMAGE=node:24.13.1-bookworm-slim
ARG DUMMY_DATABASE_URL=postgresql://build:build@localhost:5432/build
ARG CACHE_NS=spike-land-v2
ARG TEST_CACHE_NS=test-cache

# ============================================================================
# STAGE 0: Base
# ============================================================================
FROM ${NODE_IMAGE} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

ARG CACHE_NS
ARG TARGETARCH

RUN --mount=type=cache,id=${CACHE_NS}-apt-cache-${TARGETARCH},target=/var/cache/apt,sharing=locked \
    --mount=type=cache,id=${CACHE_NS}-apt-lists-${TARGETARCH},target=/var/lib/apt/lists,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && corepack enable

# ============================================================================
# STAGE 1: Install Dependencies
# ============================================================================
FROM base AS deps
ARG CACHE_NS
ARG TARGETARCH
ARG DUMMY_DATABASE_URL

COPY --link package.json yarn.lock .yarnrc.yml ./
COPY --link .yarn/ ./.yarn/
COPY --link packages/store-apps/package.json ./packages/store-apps/
COPY --link hono-api/package.json ./hono-api/
COPY --link prisma ./prisma

# Install dependencies (cache mount avoids needing .yarn/cache in build context)
# Note: Not using --immutable because Depot builds on arm64 while lockfile is
# generated on darwin/x64. Platform-specific resolution differences cause
# YN0028 failures. The lockfile still guides resolution; immutability is
# enforced by GitHub Actions CI (which runs on the same x64 platform).
# NODE_AUTH_TOKEN secret authenticates against npm.pkg.github.com for
# @spike-land-ai/* scoped packages (GitHub Packages registry).
RUN --mount=type=cache,id=${CACHE_NS}-yarn-cache-${TARGETARCH},target=/app/.yarn/cache,sharing=locked \
    --mount=type=secret,id=NODE_AUTH_TOKEN \
    NODE_AUTH_TOKEN=$(cat /run/secrets/NODE_AUTH_TOKEN 2>/dev/null || echo "") \
    yarn install

# ============================================================================
# STAGE 3: Source Code
# ============================================================================
FROM deps AS source
# Config files (change rarely)
COPY --link tsconfig*.json next.config.ts postcss.config.mjs prisma.config.ts ./
COPY --link tailwind.config.ts eslint.config.mjs ./
# Static assets (change less often)
COPY --link public ./public
COPY --link content ./content
# Workspace packages (change occasionally)
COPY --link packages ./packages
# App source code (changes most often - LAST)
COPY --link src ./src
COPY --link apps ./apps
RUN yarn db:generate
# Generate docs manifests (tools-manifest.json, api-manifest.json, etc.)
# Required by TypeScript type checker and unit tests that import these JSON files
RUN yarn docs:generate

# ============================================================================
# STAGE: Development
# ============================================================================
FROM source AS dev
COPY --link .env.local .env.local
COPY --link scripts/docker-dev-entrypoint.sh ./scripts/docker-dev-entrypoint.sh
RUN chmod +x ./scripts/docker-dev-entrypoint.sh
ENV NODE_ENV=development
EXPOSE 3000
ENTRYPOINT ["./scripts/docker-dev-entrypoint.sh"]

# ============================================================================
# STAGE 4: Lint
# ============================================================================
FROM source AS lint
RUN yarn lint

# ============================================================================
# STAGE 5: Build
# ============================================================================
FROM source AS build
ARG CACHE_NS
ARG TARGETARCH
ARG DUMMY_DATABASE_URL
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV STANDALONE=true \
    NODE_ENV=production \
    DATABASE_URL="${DUMMY_DATABASE_URL}" \
    NODE_OPTIONS="--max-old-space-size=6144" \
    NEXT_PUBLIC_GA_MEASUREMENT_ID="${NEXT_PUBLIC_GA_MEASUREMENT_ID}"
RUN --mount=type=cache,id=${CACHE_NS}-next-cache-${TARGETARCH},target=/app/.next/cache,sharing=locked \
    yarn build

# ============================================================================
# STAGE 6: Type Check
# ============================================================================
FROM source AS tsc
ARG CACHE_NS
ARG TARGETARCH
RUN --mount=type=cache,id=${CACHE_NS}-tsbuildinfo-${TARGETARCH},target=/app/.tsbuildinfo-cache,sharing=locked \
    cp /app/.tsbuildinfo-cache/tsconfig.tsbuildinfo /app/ 2>/dev/null || true && \
    NODE_OPTIONS="--max-old-space-size=4096" yarn tsc --noEmit && \
    cp /app/tsconfig.tsbuildinfo /app/.tsbuildinfo-cache/ 2>/dev/null || true

# ============================================================================
# STAGE 7: Test Context
# ============================================================================
FROM source AS test-source
COPY --link vitest.config.ts vitest.setup.ts ./
COPY --link vitest.mock-*.ts vitest.mock-*.tsx ./
# Copy test caching scripts
COPY --link scripts/vitest-coverage-mapper-reporter.ts scripts/test-cache-manager.ts scripts/run-cached-tests.sh ./scripts/
RUN chmod +x ./scripts/run-cached-tests.sh

# ============================================================================
# STAGE 8: Unit Tests (sharded) - with coverage-based caching
# ============================================================================
# Shared test environment
FROM test-source AS test-env
ARG TEST_CACHE_NS
ARG TARGETARCH
ARG DUMMY_DATABASE_URL
ENV NODE_ENV=test \
    DATABASE_URL=${DUMMY_DATABASE_URL} \
    SHARD_TOTAL=4 \
    TEST_CACHE_DIR=/app/.test-cache \
    VITEST_COVERAGE=true

FROM test-env AS unit-tests-1
ENV SHARD_INDEX=1
RUN --mount=type=cache,id=${TEST_CACHE_NS}-shard1-${TARGETARCH},target=/app/.test-cache,sharing=locked \
    ./scripts/run-cached-tests.sh > /tmp/unit-1.log 2>&1 || (tail -100 /tmp/unit-1.log && exit 1)

FROM test-env AS unit-tests-2
ENV SHARD_INDEX=2
RUN --mount=type=cache,id=${TEST_CACHE_NS}-shard2-${TARGETARCH},target=/app/.test-cache,sharing=locked \
    ./scripts/run-cached-tests.sh > /tmp/unit-2.log 2>&1 || (tail -100 /tmp/unit-2.log && exit 1)

FROM test-env AS unit-tests-3
ENV SHARD_INDEX=3
RUN --mount=type=cache,id=${TEST_CACHE_NS}-shard3-${TARGETARCH},target=/app/.test-cache,sharing=locked \
    ./scripts/run-cached-tests.sh > /tmp/unit-3.log 2>&1 || (tail -100 /tmp/unit-3.log && exit 1)

FROM test-env AS unit-tests-4
ENV SHARD_INDEX=4
RUN --mount=type=cache,id=${TEST_CACHE_NS}-shard4-${TARGETARCH},target=/app/.test-cache,sharing=locked \
    ./scripts/run-cached-tests.sh > /tmp/unit-4.log 2>&1 || (tail -100 /tmp/unit-4.log && exit 1)

FROM base AS unit-tests
COPY --link --from=unit-tests-1 /tmp/unit-1.log /tmp/
COPY --link --from=unit-tests-2 /tmp/unit-2.log /tmp/
COPY --link --from=unit-tests-3 /tmp/unit-3.log /tmp/
COPY --link --from=unit-tests-4 /tmp/unit-4.log /tmp/
RUN cat /tmp/unit-*.log && echo "::notice::All 4 unit test shards passed"

# ============================================================================
# STAGE: Quality (lint + tsc only, no tests)
# ============================================================================
FROM base AS quality
COPY --link --from=lint /app/package.json /tmp/lint-passed
COPY --link --from=tsc /app/package.json /tmp/tsc-passed
RUN echo "Quality checks passed: lint + tsc"

# ============================================================================
# STAGE 9: CI Gateway
# ============================================================================
FROM base AS ci
COPY --link --from=unit-tests /tmp/unit-1.log /tmp/unit-passed
COPY --link --from=lint /app/package.json /tmp/lint-passed
COPY --link --from=tsc /app/package.json /tmp/tsc-passed
RUN echo "CI Pipeline Complete: Lint, TypeCheck, Unit Tests (4 shards)"

# ============================================================================
# STAGE 10: Production Image
# ============================================================================
FROM ${NODE_IMAGE} AS production
WORKDIR /app

ARG BUILD_SHA
ARG BUILD_DATE
LABEL org.opencontainers.image.revision="${BUILD_SHA}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.title="spike.land" \
      org.opencontainers.image.description="Next.js production image"

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs nextjs \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl curl \
    && rm -rf /var/lib/apt/lists/*
COPY --link --from=build --chown=1001:1001 /app/.next/standalone ./
COPY --link --from=build --chown=1001:1001 /app/.next/static ./.next/static
COPY --link --from=build --chown=1001:1001 /app/public ./public

# Note: Prisma client is bundled by Next.js standalone build (default output to node_modules)

USER nextjs
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"
EXPOSE 3000

ENTRYPOINT ["sh", "-c", "HOSTNAME=0.0.0.0 exec node server.js"]
