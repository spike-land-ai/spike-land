################################################################################
# spike.land MCP API Server — Hono on Node.js
#
# Multi-stage build for the standalone MCP API server.
# Replaces the Next.js API layer with a lightweight Hono server.
#
# Build: docker build -f hono-api/Dockerfile -t spike-land-mcp-api .
# Run:   docker run -p 3000:3000 --env-file .env spike-land-mcp-api
################################################################################

# --- Stage 1: Base ---
FROM node:24-bookworm-slim AS base
RUN corepack enable && corepack prepare yarn@4.12.0 --activate
WORKDIR /app

# --- Stage 2: Dependencies ---
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ .yarn/
COPY hono-api/package.json hono-api/
COPY packages/store-apps/package.json packages/store-apps/
# Prisma schema + config needed for postinstall (prisma generate)
COPY prisma/ prisma/
COPY prisma.config.ts ./
# Note: Using yarn install (not --immutable) because Depot builds on arm64
# while lockfile is generated on darwin/x64. Immutability is enforced by CI.
RUN --mount=type=cache,target=/root/.yarn \
    --mount=type=secret,id=NODE_AUTH_TOKEN \
    NODE_AUTH_TOKEN=$(cat /run/secrets/NODE_AUTH_TOKEN 2>/dev/null || echo "") \
    yarn install

# --- Stage 3: Build ---
FROM base AS build
# Project config needed for Yarn 4 to recognize the workspace
COPY --from=deps /app/package.json /app/.yarnrc.yml /app/yarn.lock ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
# Prisma client already generated in deps stage postinstall
COPY --from=deps /app/src/generated ./src/generated

# Copy source code needed for the build
COPY hono-api/ hono-api/
COPY src/lib/ src/lib/
COPY prisma/ prisma/
COPY prisma.config.ts ./

# Build the Hono API server
WORKDIR /app/hono-api
RUN npx tsc || true

# --- Stage 4: Production ---
FROM node:24-bookworm-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd --gid 1001 honoapi && \
    useradd --uid 1001 --gid honoapi --create-home honoapi

WORKDIR /app

# Copy built artifacts
COPY --from=build --chown=honoapi:honoapi /app/hono-api/dist ./hono-api/dist
COPY --from=build --chown=honoapi:honoapi /app/hono-api/package.json ./hono-api/
COPY --from=build --chown=honoapi:honoapi /app/src/lib ./src/lib
COPY --from=build --chown=honoapi:honoapi /app/src/generated ./src/generated
COPY --from=build --chown=honoapi:honoapi /app/node_modules ./node_modules
COPY --from=build --chown=honoapi:honoapi /app/package.json ./

USER honoapi

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "hono-api/dist/hono-api/src/index.js"]
