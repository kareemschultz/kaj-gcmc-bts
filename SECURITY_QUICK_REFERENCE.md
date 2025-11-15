# Security Quick Reference

## Files Created

### Core Security Infrastructure
```
/packages/api/src/validation/
  ├── constants.ts          # Validation limits (file size, string length, etc.)
  └── schemas.ts            # Reusable Zod schemas (pagination, search, files, etc.)

/packages/api/src/middleware/
  └── rateLimit.ts          # Rate limiting middleware

/packages/config/src/
  ├── env.ts                # Environment variable validation
  └── index.ts              # Config exports

/apps/server/src/middleware/
  └── security.ts           # Security headers middleware
```

### Documentation
```
SECURITY_AUDIT_REPORT.md           # Full audit findings (26 issues fixed)
SECURITY_IMPLEMENTATION_GUIDE.md   # How to use security features
SECURITY_QUICK_REFERENCE.md        # This file
```

## Quick Usage

### 1. Validation Constants
```typescript
import { VALIDATION_LIMITS } from "../validation/constants";

// String limits
name: z.string().max(VALIDATION_LIMITS.STRING.SMALL)      // 255 chars
notes: z.string().max(VALIDATION_LIMITS.STRING.LARGE)     // 5000 chars

// File limits
fileSize: z.number().max(VALIDATION_LIMITS.FILE.MAX_SIZE_DOCUMENT)  // 50MB

// Pagination
pageSize: z.number().max(VALIDATION_LIMITS.PAGINATION.MAX_PAGE_SIZE)  // 100
```

### 2. Reusable Schemas
```typescript
import {
  paginationSchema,    // page, pageSize with limits
  searchSchema,        // search with max 200 chars
  emailSchema,         // email validation + length
  phoneSchema,         // E.164 phone format
  tagsSchema,          // max 50 tags, 50 chars each
  documentFileSchema,  // fileName, fileType, fileSize
  metadataSchema,      // record with size limits
} from "../validation/schemas";

// Use in input
.input(z.object({
  search: searchSchema,
  ...paginationSchema.shape,
}))
```

### 3. Rate Limiting
```typescript
import { rateLimiters } from "../middleware/rateLimit";

// Normal: 100 req/min
.use(rateLimiters.normal("operationName"))

// Expensive (reports): 10 req/min
.use(rateLimiters.expensive("generateReport"))

// Upload: 20 req/min
.use(rateLimiters.upload("uploadFile"))
```

### 4. Environment Validation
```typescript
// In apps/server/src/index.ts (already added)
import { validateEnv } from "@GCMC-KAJ/config";
const env = validateEnv();  // Fails fast if invalid
```

## Security Checklist

### For Each Router
- [ ] Import validation helpers
- [ ] Add rate limiting to all procedures
- [ ] Use `paginationSchema` for pagination
- [ ] Use `searchSchema` for search
- [ ] Add max length to all strings
- [ ] Validate emails with `emailSchema`
- [ ] Validate phones with `phoneSchema`
- [ ] Limit array sizes
- [ ] Use `documentFileSchema` for uploads
- [ ] Use `metadataSchema` for metadata

### Before Production
- [ ] All routers updated with security validation
- [ ] Environment variables validated (non-default secrets)
- [ ] Rate limiting tested
- [ ] Security headers verified
- [ ] Migrate rate limiting to Redis
- [ ] SSL/TLS certificates installed
- [ ] CORS origins configured

## Common Limits Reference

| Type | Limit | Constant |
|------|-------|----------|
| Tiny string | 50 chars | `STRING.TINY` |
| Small string (name) | 255 chars | `STRING.SMALL` |
| Medium string (description) | 1,000 chars | `STRING.MEDIUM` |
| Large string (notes) | 5,000 chars | `STRING.LARGE` |
| XLarge string (OCR) | 50,000 chars | `STRING.XLARGE` |
| Search query | 200 chars | via `searchSchema` |
| Page size | Max 100 | `PAGINATION.MAX_PAGE_SIZE` |
| Document file | 50 MB | `FILE.MAX_SIZE_DOCUMENT` |
| Tags array | 50 items | `ARRAY.TAGS_MAX` |
| Bulk IDs | 1000 items | `ARRAY.IDS_MAX` |

## Rate Limits Reference

| Type | Limit | Usage |
|------|-------|-------|
| Normal | 100 req/min | Most operations |
| Expensive | 10 req/min | Reports, analytics |
| Upload | 20 req/min | File uploads |
| Auth | 5 req/min | Login attempts |

## Example: Secure Router

```typescript
import { z } from "zod";
import { rbacProcedure, router } from "../index";
import { rateLimiters } from "../middleware/rateLimit";
import { paginationSchema, searchSchema } from "../validation/schemas";
import { VALIDATION_LIMITS } from "../validation/constants";

const schema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.STRING.SMALL),
  notes: z.string().max(VALIDATION_LIMITS.STRING.LARGE).optional(),
});

export const myRouter = router({
  list: rbacProcedure("resource", "view")
    .use(rateLimiters.normal("list"))
    .input(z.object({
      search: searchSchema,
      ...paginationSchema.shape,
    }).optional())
    .query(async ({ ctx, input }) => { /* ... */ }),

  create: rbacProcedure("resource", "create")
    .use(rateLimiters.normal("create"))
    .input(schema)
    .mutation(async ({ ctx, input }) => { /* ... */ }),
});
```

## Testing

```bash
# Run tests with security validation
npm test

# Test specific security features
npm test -- --grep "security"
npm test -- --grep "rate limit"
npm test -- --grep "validation"
```

## Resources

- Full audit: `SECURITY_AUDIT_REPORT.md`
- Implementation guide: `SECURITY_IMPLEMENTATION_GUIDE.md`
- Validation constants: `/packages/api/src/validation/constants.ts`
- Validation schemas: `/packages/api/src/validation/schemas.ts`
- Rate limiting: `/packages/api/src/middleware/rateLimit.ts`

## Need Help?

1. Check implementation guide for examples
2. Review updated `documentUpload.ts` router
3. Refer to validation constants for limits
4. See audit report for security rationale
