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

# Cache npm install layer. The apify/actor-node base image sets
# NODE_ENV=production, which makes `npm ci` behave like `--omit=dev` and skip
# devDependencies (typescript => `tsc: not found`). Force dev deps in with
# --include=dev so the TypeScript compiler is installed and `tsc` is linked.
COPY package.json package-lock.json* ./
RUN npm ci --include=dev --no-audit --no-fund

# Compile TypeScript in-image. `dist/` is gitignored so apify push never
# uploads it; instead we build it here from the uploaded `src/`.
# tsconfig.json lives at repo root and MUST be copied too — without it `tsc`
# finds no config, prints its option help, and exits 1.
COPY tsconfig.json ./tsconfig.json
COPY src ./src
RUN npm run build

# Runtime artifacts (catalog is generated in-image from curated data —
# apify push upload skips .gitignore'd build/, so we never COPY it)
COPY schemas ./schemas
COPY data ./data
COPY scripts/build-catalog.mjs ./scripts/build-catalog.mjs
RUN node scripts/build-catalog.mjs

ENV NODE_ENV=production
ENV APIFY_CONTAINER_PORT=4321
ENV NODE_OPTIONS="--enable-source-maps"

EXPOSE 4321

CMD ["node", "dist/index.js"]