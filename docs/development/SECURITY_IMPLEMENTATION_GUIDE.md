# Security Implementation Guide

This guide shows how to use the new security features in your tRPC routers.

## Quick Start

### 1. Import Validation Helpers

```typescript
import {
  paginationSchema,
  searchSchema,
  emailSchema,
  phoneSchema,
  tagsSchema,
  metadataSchema,
  documentFileSchema,
} from "../validation/schemas";
import { VALIDATION_LIMITS } from "../validation/constants";
```

### 2. Update Router Schemas

#### Before (Insecure)
```typescript
.input(
  z.object({
    search: z.string().optional(),
    page: z.number().default(1),
    pageSize: z.number().default(20),
    notes: z.string().optional(),
    tags: z.array(z.string()).default([]),
  })
)
```

#### After (Secure)
```typescript
.input(
  z.object({
    search: searchSchema,
    ...paginationSchema.shape,
    notes: z.string().max(VALIDATION_LIMITS.STRING.LARGE).optional(),
    tags: tagsSchema,
  })
)
```

## Common Patterns

### Pagination
```typescript
import { paginationSchema } from "../validation/schemas";

list: rbacProcedure("resource", "view")
  .input(
    z.object({
      ...paginationSchema.shape,  // Adds page and pageSize with limits
      // ... other fields
    }).optional()
  )
  .query(async ({ ctx, input }) => {
    const { page = 1, pageSize = 20 } = input || {};
    // ... implementation
  })
```

### Search
```typescript
import { searchSchema } from "../validation/schemas";

list: rbacProcedure("resource", "view")
  .input(
    z.object({
      search: searchSchema,  // Max 200 chars, optional
      // ... other fields
    })
  )
```

### String Fields
```typescript
import { VALIDATION_LIMITS } from "../validation/constants";

const schema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.STRING.SMALL),  // 255 chars
  description: z.string().max(VALIDATION_LIMITS.STRING.MEDIUM).optional(),  // 1000 chars
  notes: z.string().max(VALIDATION_LIMITS.STRING.LARGE).optional(),  // 5000 chars
  code: z.string().max(VALIDATION_LIMITS.STRING.TINY),  // 50 chars
});
```

### Email and Phone
```typescript
import { emailSchema, phoneSchema } from "../validation/schemas";

const userSchema = z.object({
  email: emailSchema,  // Validates email format + length
  phone: phoneSchema,  // Validates E.164 format
});
```

### File Upload
```typescript
import { documentFileSchema } from "../validation/schemas";

requestUpload: rbacProcedure("documents", "create")
  .input(
    z.object({
      documentId: z.number(),
      ...documentFileSchema.shape,  // fileName, fileType, fileSize
    })
  )
```

### Tags and Arrays
```typescript
import { tagsSchema, idsArraySchema } from "../validation/schemas";

const schema = z.object({
  tags: tagsSchema,  // Max 50 tags, 50 chars each
  documentIds: idsArraySchema,  // Max 1000 IDs
});
```

## Rate Limiting

### Import Rate Limiters
```typescript
import { rateLimiters } from "../middleware/rateLimit";
```

### Apply to Normal Operations (100 req/min)
```typescript
list: rbacProcedure("clients", "view")
  .use(rateLimiters.normal("listClients"))
  .input(...)
  .query(...)
```

### Apply to Expensive Operations (10 req/min)
```typescript
generateReport: rbacProcedure("clients", "view")
  .use(rateLimiters.expensive("generateReport"))
  .input(...)
  .mutation(...)
```

### Apply to File Uploads (20 req/min)
```typescript
uploadDocument: rbacProcedure("documents", "create")
  .use(rateLimiters.upload("uploadDocument"))
  .input(...)
  .mutation(...)
```

## Complete Example: Secure Router

```typescript
import { z } from "zod";
import { rbacProcedure, router } from "../index";
import { rateLimiters } from "../middleware/rateLimit";
import {
  paginationSchema,
  searchSchema,
  emailSchema,
  tagsSchema,
} from "../validation/schemas";
import { VALIDATION_LIMITS } from "../validation/constants";

// Validation schema with security limits
const clientSchema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.STRING.SMALL),
  email: emailSchema.optional().or(z.literal("")),
  phone: phoneSchema,
  notes: z.string().max(VALIDATION_LIMITS.STRING.LARGE).optional(),
  tags: tagsSchema,
});

export const clientsRouter = router({
  // List with rate limiting and secure pagination
  list: rbacProcedure("clients", "view")
    .use(rateLimiters.normal("listClients"))
    .input(
      z.object({
        search: searchSchema,
        ...paginationSchema.shape,
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, page = 1, pageSize = 20 } = input || {};
      // Implementation...
    }),

  // Create with validation
  create: rbacProcedure("clients", "create")
    .use(rateLimiters.normal("createClient"))
    .input(clientSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation...
    }),

  // Expensive report with strict rate limiting
  generateReport: rbacProcedure("clients", "view")
    .use(rateLimiters.expensive("generateClientReport"))
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Implementation...
    }),
});
```

## Migration Checklist

For each router:

- [ ] Import validation helpers
- [ ] Update all string fields with max length limits
- [ ] Replace pagination schemas with `paginationSchema`
- [ ] Replace search parameters with `searchSchema`
- [ ] Replace email/phone with validated schemas
- [ ] Add rate limiting to all endpoints
- [ ] Use `expensive` rate limiter for reports
- [ ] Use `upload` rate limiter for file uploads
- [ ] Validate arrays with size limits
- [ ] Test all validations

## Testing

```typescript
import { describe, it, expect } from "vitest";

describe("Client Router Security", () => {
  it("should reject pageSize > 100", async () => {
    await expect(
      caller.clients.list({ pageSize: 101 })
    ).rejects.toThrow();
  });

  it("should reject oversized notes", async () => {
    await expect(
      caller.clients.create({
        name: "Test",
        notes: "x".repeat(6000),  // Exceeds limit
      })
    ).rejects.toThrow();
  });

  it("should enforce rate limits", async () => {
    // Make 100 requests
    for (let i = 0; i < 100; i++) {
      await caller.clients.list();
    }

    // 101st request should fail
    await expect(
      caller.clients.list()
    ).rejects.toThrow("Rate limit exceeded");
  });
});
```

## Production Configuration

### Environment Variables
Ensure all required variables are set:
```bash
# Required
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<min 32 chars, not default>
CORS_ORIGIN=https://yourdomain.com
REDIS_URL=redis://...

# MinIO
MINIO_ENDPOINT=minio.yourdomain.com
MINIO_ACCESS_KEY=<not minioadmin>
MINIO_SECRET_KEY=<not minioadmin>
MINIO_USE_SSL=true
```

### Rate Limiting with Redis
For production, update rate limiter to use Redis:

```typescript
// packages/api/src/middleware/rateLimit.ts
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

class RedisRateLimitStore {
  async check(key: string, config: RateLimitConfig): Promise<boolean> {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    const count = results?.[0]?.[1] as number;

    return count <= config.maxRequests;
  }
}
```

## Questions?

Refer to:
- `SECURITY_AUDIT_REPORT.md` - Full audit findings
- `/packages/api/src/validation/constants.ts` - All validation limits
- `/packages/api/src/validation/schemas.ts` - Reusable schemas
- `/packages/api/src/middleware/rateLimit.ts` - Rate limiting implementation
