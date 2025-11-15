# Worker Dockerfile (BullMQ Background Jobs)
# Multi-stage build for optimized production image

FROM oven/bun:1.1.38 AS base

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package.json bun.lockb ./
COPY turbo.json ./

# Copy workspace package files
COPY apps/worker/package.json ./apps/worker/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN bun install --frozen-lockfile

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Generate Prisma client
RUN cd packages/db && bunx prisma generate

# Build the worker app
ENV NODE_ENV=production
RUN bun run build --filter=@GCMC-KAJ/worker

# ============================================================================
# Stage 3: Runner
# ============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 worker
RUN adduser --system --uid 1001 worker

# Copy built app and dependencies
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Copy Prisma schema and generated client for runtime
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/node_modules/.prisma ./packages/db/node_modules/.prisma

# Set ownership
RUN chown -R worker:worker /app

USER worker

# Health check - worker should stay running
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD pgrep -f "bun" || exit 1

CMD ["bun", "apps/worker/dist/index.js"]
