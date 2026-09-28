# Apify Pay-Per-Event Actor Dockerfile (no Standby)
#
# Architecture (v1.1.0): Drop Standby → use PAY_PER_EVENT with webServer.
# Each incoming HTTP request triggers an Actor run; we charge per MCP tool
# call via Actor.charge({ eventName: '...' }) in src/handler.ts.
# Idle cost: $0. We only pay when we earn.
#
# Image: apify/actor-node:24-slim (aligned with Node 24.21.0 LTS).
#
# NOTE: Since this Actor does NOT use Standby, the previous C2 (Task hostname
# to override 1024MB lock) is moot — there is no idle container to size.
#
# Build / deploy:
#   apify push         # build & publish to Apify Store
#   apify run          # local smoke test (forbids Standby locally too)

FROM apify/actor-node:24-slim

WORKDIR /usr/src/app

# Cache npm install layer
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

# Runtime artifacts
COPY dist ./dist
COPY schemas ./schemas
COPY build ./build

ENV NODE_ENV=production
ENV APIFY_CONTAINER_PORT=4321
ENV NODE_OPTIONS="--enable-source-maps"

EXPOSE 4321

CMD ["node", "dist/index.js"]