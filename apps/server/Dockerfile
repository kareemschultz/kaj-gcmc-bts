# API Server Dockerfile (Hono + tRPC)
# Multi-stage build for optimized production image

FROM oven/bun:1.3.2 AS base

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./
COPY turbo.json ./

# Copy workspace package files
COPY apps/server/package.json ./apps/server/
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/email/package.json ./packages/email/
COPY packages/rbac/package.json ./packages/rbac/
COPY packages/reports/package.json ./packages/reports/
COPY packages/storage/package.json ./packages/storage/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN bun install --frozen-lockfile

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Generate Prisma client
RUN cd packages/db && bunx prisma generate

# Build the server app
ENV NODE_ENV=production
RUN bun run build --filter=@GCMC-KAJ/server

# ============================================================================
# Stage 3: Runner
# ============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install curl for health checks and tini for signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    tini \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 api
RUN adduser --system --uid 1001 api

# Copy built app and dependencies
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Copy Prisma schema and generated client for runtime
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/node_modules/.prisma ./packages/db/node_modules/.prisma

# Set ownership
RUN chown -R api:api /app

USER api

EXPOSE 3000

ENV PORT=3000
ENV HOST="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bun", "apps/server/dist/index.js"]
