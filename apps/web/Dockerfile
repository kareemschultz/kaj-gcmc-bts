# Web Application Dockerfile (Next.js)
# Multi-stage build for optimized production image

FROM oven/bun:1.1.38 AS base

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./
COPY turbo.json ./

# Copy workspace package files
COPY apps/web/package.json ./apps/web/
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
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Generate Prisma client
RUN cd packages/db && bunx prisma generate

# Build the web app
ENV NODE_ENV=production
RUN bun run build --filter=@GCMC-KAJ/web

# ============================================================================
# Stage 3: Runner
# ============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy Prisma schema and generated client for runtime
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/node_modules/.prisma ./packages/db/node_modules/.prisma

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Use exec form for proper signal handling
CMD ["bun", "apps/web/server.js"]
