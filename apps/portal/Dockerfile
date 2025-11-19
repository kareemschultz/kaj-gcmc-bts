# Portal Application Dockerfile (Next.js)
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
COPY apps/portal/package.json ./apps/portal/
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

# Accept build arguments for Next.js public env vars
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Generate Prisma client
RUN cd packages/db && bunx prisma generate

# Build the portal app
ENV NODE_ENV=production
RUN bun run build --filter=@GCMC-KAJ/portal

# ============================================================================
# Stage 3: Runner
# ============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies for health checks and signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl=7.* \
    tini=0.* \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/apps/portal/.next/standalone ./
COPY --from=builder /app/apps/portal/.next/static ./apps/portal/.next/static
COPY --from=builder /app/apps/portal/public ./apps/portal/public

# Copy Prisma schema and generated client for runtime
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/node_modules/.prisma ./packages/db/node_modules/.prisma

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3002

ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

# Health check with better monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3002/api/health || exit 1

# Security and performance optimization
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Use tini for proper signal handling
# Next.js standalone output uses Node.js, not Bun
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
