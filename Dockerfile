# Multi-stage build for a service adopted from this template.

# ---------------------------------------------------------------------------
# Stage 1 — install dependencies (cached when package.json + bun.lock
# are unchanged).
# ---------------------------------------------------------------------------
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2 — type-check the source.
# ---------------------------------------------------------------------------
FROM deps AS build
WORKDIR /app

COPY tsconfig.json ./
COPY lib ./lib
COPY src ./src

# tools/ and tests/ are not part of the image; their include globs simply
# match nothing here.
RUN bun run check-types

# ---------------------------------------------------------------------------
# Stage 3 — runtime image with only production node_modules + source.
# ---------------------------------------------------------------------------
FROM oven/bun:1-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/lib ./lib
COPY --from=build /app/src ./src
COPY drizzle ./drizzle
COPY drizzle.config.ts ./

EXPOSE 3000

CMD ["bun", "run", "start"]
