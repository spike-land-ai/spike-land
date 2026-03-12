FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml tsconfig.json tsconfig.test.json esbuild.config.ts ./
COPY .yarn/ .yarn/
COPY packages/mcp-server-base/ ./packages/mcp-server-base/
COPY src/core/browser-automation/ ./src/core/browser-automation/

RUN corepack enable
RUN yarn install --immutable
RUN yarn workspace @spike-land-ai/mcp-server-base build

EXPOSE 3100

ENV QA_STUDIO_PORT=3100
ENV QA_STUDIO_HOST=0.0.0.0

CMD ["node", "--import", "tsx", "/app/src/core/browser-automation/mcp/mcp-server.ts", "--http", "--host", "0.0.0.0", "--port", "3100"]
