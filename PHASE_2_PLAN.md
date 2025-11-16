# Phase 2: Infrastructure, Security & Performance
**Date:** 2025-11-16
**Branch:** `claude/phase-2-infrastructure-security-01GBPHkQoq1evDMseLR6PYER`
**Status:** In Progress 🚧
**Builds On:** Phase 1 (PR #45 - Merged ✅)

---

## Executive Summary

Phase 2 addresses **12 critical and high-priority issues** identified in the comprehensive audit, focusing on infrastructure configuration, security hardening, database optimization, and frontend stability. This phase will significantly reduce security risk and improve production readiness.

**Total Issues to Fix:** 12 (4 Critical + 8 High)
**Estimated Time:** 1-2 weeks
**Parallel Execution:** Multiple agents working concurrently on independent fixes

---

## 🎯 Phase 2 Objectives

### Security Hardening (35%)
- Fix IDOR vulnerabilities across 18+ API routers
- Add rate limiting to auth and expensive endpoints
- Update dependencies with known CVEs

### Infrastructure Optimization (30%)
- Fix Turbopack configuration
- Enable multi-origin BetterAuth support
- Implement proper Prisma migrations
- Add database connection pooling

### Frontend Stability (20%)
- Add React Error Boundaries
- Improve error handling and feedback

### Database Performance (15%)
- Add composite indexes
- Wrap critical operations in transactions

---

## 🔴 CRITICAL FIXES (Week 1)

### 1. Fix Next.js Turbopack Configuration
**Priority:** CRITICAL
**Impact:** Development mode warnings, potential build issues
**Estimated Time:** 15 minutes
**Agent:** Agent A

**Problem:**
```typescript
// apps/web/next.config.ts & apps/portal/next.config.ts
const nextConfig = {
  // ... config
};

export default nextConfig;

turbopack: {}, // ❌ SYNTAX ERROR - Outside nextConfig object!
```

**Solution:**
```typescript
const nextConfig = {
  // ... config
  experimental: {
    turbopack: {
      // Future turbopack configuration here
    },
  },
};

export default nextConfig;
```

**Files to Update:**
- `apps/web/next.config.ts`
- `apps/portal/next.config.ts`

**Testing:**
```bash
bun dev  # Should start without warnings
```

---

### 2. Enable Multi-Origin BetterAuth Support
**Priority:** CRITICAL
**Impact:** Portal cannot authenticate with current CORS setup
**Estimated Time:** 30 minutes
**Agent:** Agent B

**Problem:**
```typescript
// packages/auth/src/index.ts
trustedOrigins: [process.env.CORS_ORIGIN || ""]
```

Current setup only supports single origin, but we need both:
- Web: `http://localhost:3001` (or production web URL)
- Portal: `http://localhost:3002` (or production portal URL)

**Solution:**
```typescript
// Parse comma-separated CORS_ORIGIN or use individual env vars
const getCorsOrigins = (): string[] => {
  // Option 1: Comma-separated list
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    const origins = corsOrigin.split(',').map(o => o.trim()).filter(Boolean);
    if (origins.length > 0) return origins;
  }

  // Option 2: Individual env vars (fallback)
  const origins: string[] = [];
  if (process.env.WEB_URL) origins.push(process.env.WEB_URL);
  if (process.env.PORTAL_URL) origins.push(process.env.PORTAL_URL);

  // Option 3: Development defaults
  if (origins.length === 0) {
    return ["http://localhost:3001", "http://localhost:3002"];
  }

  return origins;
};

// In betterAuth config:
trustedOrigins: getCorsOrigins(),
```

**Files to Update:**
- `packages/auth/src/index.ts`
- `packages/config/src/env.ts` (add WEB_URL, PORTAL_URL if using option 2)
- `.env.example` (add example)
- `apps/server/.env.example`

**Testing:**
```bash
# Test with comma-separated
CORS_ORIGIN="http://localhost:3001,http://localhost:3002" bun dev

# Test portal login
curl -i http://localhost:3002/api/auth/sign-in
```

---

### 3. Update Dependencies (Security CVEs)
**Priority:** CRITICAL
**Impact:** Security vulnerabilities
**Estimated Time:** 1 hour
**Agent:** Agent C

**Vulnerabilities to Fix:**

| Package | Current | Fixed Version | CVE | Severity |
|---------|---------|---------------|-----|----------|
| next | 16.0.3 | 15.2.2+ or latest 16.x | GHSA-f82v-jwr5-mffw | CRITICAL (9.8) |
| jspdf | ? | Latest | ReDoS vulnerability | HIGH |
| prismjs | ? | Latest | DOM clobbering | MEDIUM |

**Actions:**
```bash
# Update Next.js
bun update next@latest

# Update jsPDF
cd packages/pdf
bun update jspdf@latest

# Update prismjs (if used)
bun update prismjs@latest

# Check for other vulnerabilities
bun audit
```

**Files to Update:**
- `package.json` (root)
- `packages/pdf/package.json`

**Testing:**
```bash
bun install
bun run build  # Ensure all apps build
bun test       # Run existing tests
```

---

### 4. Initialize Proper Prisma Migrations
**Priority:** CRITICAL
**Impact:** No migration history, rollback capability, or production safety
**Estimated Time:** 45 minutes
**Agent:** Agent D

**Problem:**
Current setup uses `prisma db push` (dev only) with no migration files.

**Solution:**
```bash
cd packages/db

# Create initial migration from current schema
bun prisma migrate dev --name initial_schema

# This will create:
# packages/db/prisma/migrations/YYYYMMDDHHMMSS_initial_schema/migration.sql
```

**Files to Create:**
- `packages/db/prisma/migrations/` directory
- Migration files

**Files to Update:**
- `package.json` scripts:
  ```json
  {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:push": "prisma db push", // Keep for quick dev iterations
    "db:reset": "prisma migrate reset"
  }
  ```
- Update `GETTING_STARTED.md` to use `db:migrate` instead of `db:push`

**Testing:**
```bash
# Test migration on fresh database
docker compose down -v
docker compose up -d postgres

bun run db:migrate  # Should apply migration
bun run db:generate # Should generate Prisma client
```

---

## 🔴 HIGH PRIORITY FIXES (Week 1-2)

### 5. Fix IDOR Vulnerabilities (18+ Routers)
**Priority:** HIGH (Security)
**Impact:** Potential cross-tenant data modification
**Estimated Time:** 3-4 hours
**Agent:** Agent E (IDOR Specialist)

**Problem Pattern:**
```typescript
// ❌ VULNERABLE - Missing tenantId in update/delete
const existing = await prisma.service.findUnique({
  where: { id: input.id, tenantId: ctx.tenantId }, // ✅ Check
});

const updated = await prisma.service.update({
  where: { id: input.id }, // ❌ Missing tenantId re-verification!
  data: input.data,
});
```

**Solution Pattern:**
```typescript
// ✅ SECURE - Always include tenantId
const updated = await prisma.service.update({
  where: {
    id: input.id,
    tenantId: ctx.tenantId, // ✅ Enforces tenant isolation
  },
  data: input.data,
});
```

**Affected Files (from audit):**
- `packages/api/src/routers/services.ts` (lines 159, 210)
- `packages/api/src/routers/roles.ts` (lines 175, 228)
- `packages/api/src/routers/filings.ts` (lines 265, 322)
- `packages/api/src/routers/clients.ts` (lines 233, 273)
- `packages/api/src/routers/service-requests.ts`
- `packages/api/src/routers/tasks.ts`
- `packages/api/src/routers/documents.ts`
- `packages/api/src/routers/document-types.ts`
- `packages/api/src/routers/filing-types.ts`
- `packages/api/src/routers/service-types.ts`
- `packages/api/src/routers/workflow-templates.ts`
- ... and 7 more routers

**Automated Fix Strategy:**
1. Use Agent E to search for all `prisma.*.update` and `prisma.*.delete` calls
2. Verify each has `tenantId` in where clause
3. Add if missing
4. Create atomic commits per router file

**Testing:**
```typescript
// Add to existing tests or create new test
describe('Tenant Isolation', () => {
  it('should not allow updating records from different tenant', async () => {
    // Attempt to update tenant A's record while authenticated as tenant B
    const result = await caller.services.update({
      id: tenantARecordId,
      // ... data
    });

    expect(result).toThrow(); // Should fail
  });
});
```

---

### 6. Add Database Connection Pooling
**Priority:** HIGH (Performance & Stability)
**Impact:** Production connection exhaustion
**Estimated Time:** 30 minutes
**Agent:** Agent F

**Problem:**
No explicit connection pool configuration for production.

**Solution:**

Update `packages/db/src/index.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(), // Helper function below
      },
    },
  });

function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;

  if (!baseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  // Add connection pooling params if not already present
  if (process.env.NODE_ENV === "production" && !baseUrl.includes("connection_limit")) {
    const url = new URL(baseUrl);
    url.searchParams.set("connection_limit", "20");
    url.searchParams.set("pool_timeout", "20");
    url.searchParams.set("connect_timeout", "10");
    return url.toString();
  }

  return baseUrl;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Also Update `.env.example`:**
```env
# Production example (add to comments)
# DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20&connect_timeout=10"
```

**Testing:**
```bash
# Test connection pool in production mode
NODE_ENV=production bun run apps/server/src/index.ts
# Should see connection pool params in logs
```

---

### 7. Add Rate Limiting to Critical Endpoints
**Priority:** HIGH (Security & Stability)
**Impact:** DoS attacks, resource exhaustion
**Estimated Time:** 2 hours
**Agent:** Agent G

**Problem:**
Missing rate limiting on:
- All `/api/auth/*` endpoints (login brute force)
- Report generation (CPU/memory intensive)
- `portal.sendMessage` (spam vulnerability)
- Bulk operations

**Solution:**

Create `packages/api/src/middleware/rate-limit.ts`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TRPCError } from "@trpc/server";

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Create rate limiters
export const rateLimiters = {
  // Auth endpoints: 5 requests per 15 minutes
  auth: new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
    prefix: "@gcmc/auth",
  }),

  // Reports: 10 requests per hour
  reports: new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
    prefix: "@gcmc/reports",
  }),

  // Portal messages: 20 requests per hour
  messages: new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: true,
    prefix: "@gcmc/messages",
  }),
};

// Rate limit middleware
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit,
) {
  if (!redis) {
    // Skip rate limiting in development if Redis not configured
    return;
  }

  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
    });
  }
}
```

**Apply to routers:**

```typescript
// packages/api/src/routers/auth.ts (example)
signIn: publicProcedure
  .input(signInSchema)
  .mutation(async ({ input, ctx }) => {
    // Rate limit by email
    await checkRateLimit(input.email, rateLimiters.auth);

    // ... existing sign-in logic
  }),

// packages/api/src/routers/reports.ts
generateReport: rbacProcedure(['admin'])
  .input(reportSchema)
  .mutation(async ({ input, ctx }) => {
    // Rate limit by tenantId
    await checkRateLimit(`${ctx.tenantId}:reports`, rateLimiters.reports);

    // ... existing report logic
  }),

// packages/api/src/routers/portal.ts
sendMessage: protectedProcedure
  .input(messageSchema)
  .mutation(async ({ input, ctx }) => {
    // Rate limit by userId
    await checkRateLimit(`${ctx.user.id}:messages`, rateLimiters.messages);

    // ... existing message logic
  }),
```

**Files to Update:**
- Create `packages/api/src/middleware/rate-limit.ts`
- Update auth router
- Update reports routers (5 endpoints)
- Update portal router
- Update `packages/config/src/env.ts` (ensure UPSTASH vars validated - already done in Phase 1)

**Testing:**
```typescript
// Add tests for rate limiting
describe('Rate Limiting', () => {
  it('should block after 5 failed login attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await caller.auth.signIn({ email: 'test@example.com', password: 'wrong' });
    }

    // 6th attempt should be rate limited
    await expect(
      caller.auth.signIn({ email: 'test@example.com', password: 'wrong' })
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

---

### 8. Add React Error Boundaries
**Priority:** HIGH (Stability)
**Impact:** Single component error crashes entire app
**Estimated Time:** 1 hour
**Agent:** Agent H

**Problem:**
No error boundaries in `apps/web` or `apps/portal` - any component error crashes the entire app.

**Solution:**

Create `packages/ui/src/error-boundary.tsx`:
```typescript
"use client";

import React, { Component, type ReactNode } from "react";
import { Button } from "./button";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 ErrorBoundary caught error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // TODO: Send to error tracking service (Sentry, DataDog, etc.)
    // sendToErrorTracking(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg border border-destructive/50 bg-card p-6 shadow-lg">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-destructive">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. Please try again.
              </p>
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="rounded-md bg-muted p-3 font-mono text-xs">
                <div className="font-semibold">Error:</div>
                <div className="text-destructive">{this.state.error.message}</div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={this.reset} variant="default">
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = "/"}
                variant="outline"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Update Providers:**

```typescript
// apps/web/src/components/providers.tsx
import { ErrorBoundary } from "@acme/ui/error-boundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <TRPCProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </TRPCProvider>
    </ErrorBoundary>
  );
}

// apps/portal/src/components/providers.tsx (same pattern)
```

**Files to Create:**
- `packages/ui/src/error-boundary.tsx`

**Files to Update:**
- `packages/ui/src/index.tsx` (export ErrorBoundary)
- `apps/web/src/components/providers.tsx`
- `apps/portal/src/components/providers.tsx`

**Testing:**
```typescript
// Create a test component that throws error
function ErrorTestComponent() {
  throw new Error("Test error");
  return <div>This won't render</div>;
}

// Should show error boundary UI instead of crashing
```

---

### 9. Add Composite Database Indexes
**Priority:** HIGH (Performance)
**Impact:** Slow queries at scale
**Estimated Time:** 1 hour
**Agent:** Agent I

**Problem:**
Missing composite indexes for common query patterns.

**Solution:**

Update `packages/db/prisma/schema/schema.prisma`:

```prisma
// Task model
model Task {
  // ... existing fields

  @@index([tenantId, clientId, status])
  @@index([tenantId, assignedToId, status])
  @@index([dueDate, status])
}

// Filing model
model Filing {
  // ... existing fields

  @@index([clientId, filingTypeId, status])
  @@index([tenantId, status, dueDate])
  @@index([status, dueDate]) // For upcoming filings query
}

// ServiceRequest model
model ServiceRequest {
  // ... existing fields

  @@index([tenantId, clientId, status])
  @@index([tenantId, status, createdAt])
  @@index([serviceTypeId, status])
}

// Document model
model Document {
  // ... existing fields

  @@index([tenantId, documentTypeId, status])
  @@index([tenantId, createdById, createdAt])
  @@index([filingId, status])
}

// Client model
model Client {
  // ... existing fields

  @@index([tenantId, status])
  @@index([tenantId, createdAt])
}

// AuditLog model
model AuditLog {
  // ... existing fields

  @@index([tenantId, action, createdAt])
  @@index([userId, createdAt])
  @@index([resourceType, resourceId])
}
```

**Generate migration:**
```bash
cd packages/db
bun prisma migrate dev --name add_composite_indexes
```

**Files to Update:**
- `packages/db/prisma/schema/schema.prisma`

**Testing:**
```sql
-- Run EXPLAIN ANALYZE on common queries before and after
EXPLAIN ANALYZE SELECT * FROM "Task"
WHERE "tenantId" = 'xxx' AND "status" = 'open'
ORDER BY "dueDate" ASC;

-- Should use index instead of seq scan
```

---

### 10. Wrap Critical Operations in Transactions
**Priority:** HIGH (Data Integrity)
**Impact:** Partial failures cause data inconsistency
**Estimated Time:** 2 hours
**Agent:** Agent J

**Problem:**
Multi-step operations without transactions risk partial failures.

**Critical Locations (from audit):**
- `packages/api/src/routers/documentUpload.ts` (lines 127-169)
- `packages/api/src/routers/wizards.ts` (lines 54-125)

**Solution Pattern:**

```typescript
// ❌ BEFORE - No transaction
async function updateDocumentVersion(input) {
  const document = await prisma.document.update({ /* ... */ });
  const version = await prisma.documentVersion.create({ /* ... */ });
  const audit = await prisma.auditLog.create({ /* ... */ });
  // If audit fails, document and version are already committed!
}

// ✅ AFTER - With transaction
async function updateDocumentVersion(input) {
  return await prisma.$transaction(async (tx) => {
    const document = await tx.document.update({ /* ... */ });
    const version = await tx.documentVersion.create({ /* ... */ });
    const audit = await tx.auditLog.create({ /* ... */ });

    return { document, version };
  });
  // All-or-nothing: either all succeed or all rollback
}
```

**Files to Update:**

1. **`packages/api/src/routers/documentUpload.ts`:**
   - Wrap document update + version creation in transaction

2. **`packages/api/src/routers/wizards.ts`:**
   - Wrap client creation + business entities + initial setup in transaction

3. **`packages/api/src/routers/service-requests.ts`:**
   - Wrap service request creation + task generation in transaction

4. **`packages/api/src/routers/filings.ts`:**
   - Wrap filing creation + associated document creation in transaction

**Testing:**
```typescript
describe('Transaction Rollback', () => {
  it('should rollback all changes if any step fails', async () => {
    // Mock to make the 3rd operation fail
    jest.spyOn(prisma.auditLog, 'create').mockRejectedValue(new Error('Fail'));

    await expect(
      caller.documents.updateVersion({ /* ... */ })
    ).rejects.toThrow();

    // Verify document and version were NOT created
    const document = await prisma.document.findUnique({ /* ... */ });
    expect(document).toBeNull();
  });
});
```

---

### 11. Fix N+1 Queries in Wizards
**Priority:** HIGH (Performance)
**Impact:** Slow client onboarding at scale
**Estimated Time:** 1 hour
**Agent:** Agent K

**Problem:**
```typescript
// packages/api/src/routers/wizards.ts (lines 66-100)
for (const business of input.businesses) {
  await prisma.clientBusiness.create({ data: business }); // N+1!
}
```

**Solution:**
```typescript
// Use createManyAndReturn() for batch insertion
const businesses = await prisma.clientBusiness.createManyAndReturn({
  data: input.businesses.map(b => ({
    ...b,
    clientId: client.id,
    tenantId: ctx.tenantId,
  })),
});

// Or use Promise.all() if you need individual returns
const businesses = await Promise.all(
  input.businesses.map(b =>
    prisma.clientBusiness.create({
      data: { ...b, clientId: client.id, tenantId: ctx.tenantId },
    })
  )
);
```

**Files to Update:**
- `packages/api/src/routers/wizards.ts` (lines 66-100, 322-335)

**Testing:**
```typescript
// Benchmark before and after
const startTime = Date.now();
await caller.wizards.createClient({
  // ... with 10 businesses
});
const duration = Date.now() - startTime;
console.log(`Duration: ${duration}ms`); // Should be < 500ms
```

---

### 12. Update Documentation
**Priority:** HIGH (Developer Experience)
**Impact:** Easier onboarding, fewer support questions
**Estimated Time:** 2 hours
**Agent:** Agent L

**Files to Update:**

1. **`GETTING_STARTED.md`:**
   - Update setup steps to use `db:migrate` instead of `db:push`
   - Add port allocation table
   - Add CORS_ORIGIN multi-origin setup example
   - Add troubleshooting section

2. **Create `TROUBLESHOOTING.md`:**
   - MINIO_* undefined
   - BetterAuthError: invalid trusted origin
   - Port conflicts (EADDRINUSE)
   - Prisma P1000: Authentication failed
   - Rate limit errors

3. **Update `docs/TECH_STACK.md`:**
   - Add error handling strategy
   - Add database transaction patterns
   - Add rate limiting setup

4. **Update `AUDIT_REPORT.md`:**
   - Mark Phase 2 issues as completed
   - Update risk assessment

5. **Update `PHASE_1_FIXES_SUMMARY.md`:**
   - Add link to Phase 2 summary

---

## 📊 Execution Plan

### Parallel Execution Strategy

**Group 1: Independent Infrastructure Fixes (Parallel)**
- Agent A: Turbopack config (15 min)
- Agent B: Multi-origin BetterAuth (30 min)
- Agent C: Dependency updates (1 hour)
- Agent D: Prisma migrations (45 min)

**Group 2: Security & Performance (Parallel)**
- Agent E: IDOR fixes across all routers (3-4 hours)
- Agent F: Connection pooling (30 min)
- Agent G: Rate limiting (2 hours)

**Group 3: Frontend & Database (Parallel)**
- Agent H: Error boundaries (1 hour)
- Agent I: Composite indexes (1 hour)
- Agent J: Database transactions (2 hours)
- Agent K: N+1 query fixes (1 hour)

**Group 4: Documentation (Sequential - waits for all above)**
- Agent L: Update all docs (2 hours)

**Total Estimated Time:** 4-6 hours with parallel execution (vs 15+ hours sequential)

---

## 🧪 Testing Strategy

### Automated Tests
```bash
# Run all existing tests
bun test

# Run type checking
bun run typecheck

# Build all apps
bun run build
```

### Manual Testing Checklist
- [ ] All services start without errors (`bun dev`)
- [ ] Web app login works (http://localhost:3001)
- [ ] Portal login works (http://localhost:3002)
- [ ] Rate limiting triggers after threshold
- [ ] Error boundary shows UI on component error
- [ ] Database queries use new indexes (check EXPLAIN ANALYZE)
- [ ] Transactions rollback on failure
- [ ] Multi-origin CORS works for both web and portal

### Performance Testing
```bash
# Before and after benchmarks
bun run benchmark:queries  # Test query performance
bun run benchmark:api      # Test API response times
```

---

## 📈 Success Metrics

| Metric | Before Phase 2 | Target After Phase 2 |
|--------|----------------|----------------------|
| Security Risk | MEDIUM-HIGH | LOW-MEDIUM |
| IDOR Vulnerabilities | 18+ | 0 |
| Rate Limited Endpoints | 0 | 25+ |
| Error Boundaries | 0 | 2 (web + portal) |
| Database Indexes | Basic | Optimized |
| Avg Query Time | ? | 50% faster |
| Build Warnings | 2 | 0 |
| Migration History | No | Yes |

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] Migration files created
- [ ] Environment variables documented

### Deployment Steps
1. **Database Migration:**
   ```bash
   bun run db:migrate:deploy  # Production
   ```

2. **Update Environment Variables:**
   ```bash
   # Add to production .env
   CORS_ORIGIN="https://web.gcmc.com,https://portal.gcmc.com"
   UPSTASH_REDIS_REST_URL="..."
   UPSTASH_REDIS_REST_TOKEN="..."
   ```

3. **Deploy Application:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Verify:**
   - Health checks passing
   - Rate limiting working
   - Multi-origin CORS working
   - Error tracking integrated

### Post-Deployment
- [ ] Monitor error logs for 24 hours
- [ ] Check database query performance
- [ ] Verify rate limiting analytics
- [ ] Test error boundary with intentional error

---

## 🔄 Rollback Plan

If issues arise:

1. **Revert Code:**
   ```bash
   git revert <commit-hash>
   git push origin claude/phase-2-infrastructure-security-01GBPHkQoq1evDMseLR6PYER
   ```

2. **Rollback Database (if needed):**
   ```bash
   bun prisma migrate resolve --rolled-back <migration-name>
   ```

3. **Restore Environment:**
   - Revert to previous CORS_ORIGIN (single origin)
   - Remove Upstash variables if causing issues

---

## 📝 Commit Strategy

Each fix group will get atomic commits:

1. `fix(config): correct Next.js Turbopack configuration placement`
2. `feat(auth): add multi-origin CORS support for BetterAuth`
3. `fix(deps): update Next.js and jsPDF to patch security vulnerabilities`
4. `feat(db): initialize Prisma migrations and add connection pooling`
5. `fix(security): add tenantId to all update/delete operations (IDOR fixes)`
6. `feat(api): add rate limiting to auth and expensive endpoints`
7. `feat(ui): add React Error Boundaries to web and portal apps`
8. `perf(db): add composite indexes for common query patterns`
9. `feat(db): wrap critical operations in database transactions`
10. `perf(api): fix N+1 queries in wizards router`
11. `docs: update documentation for Phase 2 changes`

---

## 🎯 What's Next (Phase 3)

After Phase 2:

**MEDIUM PRIORITY (Week 3-4)**
- Frontend design token consistency
- Code quality improvements (useCallback, useMemo, React.memo)
- Refactor large components (500+ lines)
- Add email verification flow
- Add password reset flow

**LOW PRIORITY (Month 1-2)**
- Increase test coverage to 60%+
- Add OpenAPI documentation
- Implement structured logging (JSON)
- Add monitoring and observability
- Distributed tracing setup

---

**Status:** Ready to Execute 🚀
**Next Step:** Launch parallel agent workflows
**Estimated Completion:** 4-6 hours
