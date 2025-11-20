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
COPY packages/cache/package.json ./packages/cache/
COPY packages/compliance-engine/package.json ./packages/compliance-engine/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/email/package.json ./packages/email/
COPY packages/rbac/package.json ./packages/rbac/
COPY packages/reports/package.json ./packages/reports/
COPY packages/security/package.json ./packages/security/
COPY packages/storage/package.json ./packages/storage/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/ui-tokens/package.json ./packages/ui-tokens/

# Install dependencies
RUN bun install

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
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

# Install dependencies for health checks and signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl=7.* \
    tini=0.* \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN addgroup --system --gid 1001 api
RUN adduser --system --uid 1001 api

# Copy built app and dependencies
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Copy Prisma schema for runtime
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

# Generate Prisma client in production
RUN cd packages/db && bunx prisma generate

# Set ownership
RUN chown -R api:api /app

USER api

EXPOSE 3000

ENV PORT=3000
ENV HOST="0.0.0.0"

# Health check with better monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Production optimization
ENV NODE_OPTIONS="--max-old-space-size=2048 --enable-source-maps"

# Use tini for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bun", "apps/server/dist/index.js"]
