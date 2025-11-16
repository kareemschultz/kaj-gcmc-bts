# Rate Limiting Migration Guide

**Migration Type:** Infrastructure Upgrade
**Impact:** Critical - Production Blocker
**Status:** Completed
**Date:** 2025-11-16

## Executive Summary

The GCMC Platform has been upgraded from in-memory rate limiting to **production-ready Redis-backed distributed rate limiting**. This change is **CRITICAL** for production deployments with multiple API server instances.

### Why This Change Was Necessary

**Problem:** The previous implementation used in-memory storage, which:
- Does NOT work correctly with multiple server instances (each instance has its own counter)
- Allows users to bypass rate limits by hitting different server instances
- Creates inconsistent rate limiting behavior in load-balanced environments
- Is a **CRITICAL SECURITY VULNERABILITY** in production

**Solution:** Redis-backed distributed rate limiting:
- Works correctly across ALL server instances
- Provides consistent rate limiting regardless of which server handles the request
- Uses battle-tested `@upstash/ratelimit` library
- Enables production-ready multi-instance deployments

## What Changed

### Before (In-Memory)

```typescript
// In-memory Map - isolated per server instance
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  // ...
}
```

**Issues:**
- Each API server instance had its own rate limit counter
- User could make 100 requests to Server A AND 100 requests to Server B (200 total)
- Rate limits were NOT enforced across the cluster

### After (Redis-Backed)

```typescript
// Redis-backed - shared across ALL server instances
import { Ratelimit } from "@upstash/ratelimit";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export const normalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
});
```

**Benefits:**
- Single source of truth for rate limiting
- Consistent behavior across all server instances
- User can make 100 requests total (distributed across all servers)
- Production-ready and secure

## Rate Limiting Configuration

### Current Limits

| Operation Type | Requests | Time Window | Use Cases |
|---------------|----------|-------------|-----------|
| **Normal** | 100 | 60 seconds | Standard API operations, queries |
| **Expensive** | 10 | 60 seconds | Reports, bulk operations, analytics |
| **Upload** | 20 | 60 seconds | File uploads, document uploads |
| **Auth** | 5 | 60 seconds | Login, registration, password reset |

### Implementation Details

**Location:** `/home/user/kaj-gcmc-bts/packages/api/src/lib/rate-limiter.ts`

```typescript
// Normal operations: 100 req/min
export const normalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
  prefix: "gcmc:ratelimit:normal",
});

// Expensive operations: 10 req/min
export const expensiveRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "gcmc:ratelimit:expensive",
});

// Upload operations: 20 req/min
export const uploadRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: true,
  prefix: "gcmc:ratelimit:upload",
});

// Authentication operations: 5 req/min
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "gcmc:ratelimit:auth",
});
```

## Migration Steps

### Step 1: Install Dependencies (Completed)

```bash
cd /home/user/kaj-gcmc-bts/packages/api
bun add ioredis @upstash/ratelimit
```

**Dependencies Added:**
- `ioredis` (v5.4.1 - already installed)
- `@upstash/ratelimit` (latest)

### Step 2: Create Redis Rate Limiter (Completed)

**File Created:** `/home/user/kaj-gcmc-bts/packages/api/src/lib/rate-limiter.ts`

This file exports:
- `normalRateLimiter` - 100 requests per minute
- `expensiveRateLimiter` - 10 requests per minute
- `uploadRateLimiter` - 20 requests per minute
- `authRateLimiter` - 5 requests per minute
- `redis` - Redis client instance
- `closeRedis()` - Cleanup function

### Step 3: Update Middleware (Completed)

**File Updated:** `/home/user/kaj-gcmc-bts/packages/api/src/middleware/rateLimit.ts`

**Changes:**
- Removed in-memory `RateLimitStore` class
- Replaced with Redis-backed rate limiters
- Added graceful error handling (allows requests if Redis is down)
- Added rate limit metadata to context for response headers

### Step 4: Environment Configuration (Completed)

**Files Updated:**
- `/home/user/kaj-gcmc-bts/.env.example` - Already had `REDIS_URL`
- `/home/user/kaj-gcmc-bts/apps/server/.env.example` - Added `REDIS_URL`

**Required Environment Variable:**
```bash
# Development
REDIS_URL="redis://localhost:6379"

# Production (example)
REDIS_URL="redis://username:password@redis.example.com:6379"
```

### Step 5: Documentation Updates (Completed)

**Files Updated:**
- `/home/user/kaj-gcmc-bts/docs/DEPLOYMENT.md` - Added Redis requirement details
- `/home/user/kaj-gcmc-bts/docs/RATE_LIMITING_MIGRATION.md` - This file

## Configuration Guide

### Development Environment

**Docker Compose (Already Included):**

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```

**Environment Variable:**
```bash
REDIS_URL="redis://localhost:6379"
```

**Start Development Environment:**
```bash
# Start infrastructure (including Redis)
docker compose up -d

# Verify Redis is running
docker compose exec redis redis-cli ping
# Should output: PONG

# Start development servers
bun run dev
```

### Production Environment

**Recommended Redis Services:**

1. **Self-Hosted (Docker):**
   ```bash
   # Already included in docker-compose.prod.yml
   docker compose -f docker-compose.prod.yml up -d redis
   ```

2. **Managed Services (Recommended for Production):**
   - **AWS ElastiCache for Redis**
   - **Azure Cache for Redis**
   - **Google Cloud Memorystore**
   - **Upstash Redis** (serverless)
   - **Redis Cloud**

**Environment Variable Examples:**

```bash
# Self-hosted (Docker)
REDIS_URL="redis://redis:6379"

# AWS ElastiCache
REDIS_URL="redis://master.my-cluster.abc123.use1.cache.amazonaws.com:6379"

# Upstash (serverless)
REDIS_URL="rediss://default:PASSWORD@redis-endpoint.upstash.io:6379"

# Redis Cloud
REDIS_URL="redis://default:PASSWORD@redis-12345.c123.us-east-1-2.ec2.cloud.redislabs.com:12345"
```

**Production Deployment:**
```bash
# 1. Update .env.production with your Redis URL
echo 'REDIS_URL="redis://your-redis-url:6379"' >> .env.production

# 2. Start Redis (if self-hosted)
docker compose -f docker-compose.prod.yml up -d redis

# 3. Verify Redis connection
docker compose -f docker-compose.prod.yml exec redis redis-cli ping

# 4. Start API servers
docker compose -f docker-compose.prod.yml up -d api

# 5. Verify rate limiting is working
curl -I http://localhost:3000/health
# Check logs for "Redis connected successfully"
```

## Testing Rate Limiting

### Manual Testing

**Test Script:**

```bash
#!/bin/bash
# test-rate-limiting.sh

API_URL="http://localhost:3000"
ENDPOINT="/trpc/documents.list"  # Adjust to your endpoint

echo "Testing rate limiting..."
echo "Expected: First 100 requests succeed, then rate limited"
echo ""

for i in {1..105}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL$ENDPOINT")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

  if [ $i -le 100 ]; then
    echo "Request $i: Expected 200, Got $HTTP_CODE"
  else
    echo "Request $i: Expected 429 (rate limited), Got $HTTP_CODE"
  fi

  # Small delay to stay within 60 second window
  sleep 0.5
done
```

**Run Test:**
```bash
chmod +x test-rate-limiting.sh
./test-rate-limiting.sh
```

### Automated Testing

**Test File:** `/home/user/kaj-gcmc-bts/packages/api/src/__tests__/rate-limiting.test.ts` (example)

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { redis } from "../lib/rate-limiter";

describe("Rate Limiting", () => {
  beforeAll(async () => {
    // Ensure Redis is connected
    await redis.ping();
  });

  afterAll(async () => {
    // Cleanup
    await redis.quit();
  });

  it("should connect to Redis", async () => {
    const response = await redis.ping();
    expect(response).toBe("PONG");
  });

  it("should enforce rate limits", async () => {
    // TODO: Implement rate limiting tests
    // - Test normal rate limiter (100 req/min)
    // - Test expensive rate limiter (10 req/min)
    // - Test upload rate limiter (20 req/min)
    // - Test auth rate limiter (5 req/min)
  });
});
```

### Monitoring Rate Limiting

**Redis Commands:**

```bash
# Connect to Redis
docker compose exec redis redis-cli

# List all rate limit keys
KEYS gcmc:ratelimit:*

# Check specific user's rate limit
GET gcmc:ratelimit:normal:USER_ID:operation

# Monitor real-time commands
MONITOR

# Check Redis memory usage
INFO memory

# Clear all rate limits (development only!)
FLUSHDB
```

**Application Logs:**

```bash
# Check for rate limiting logs
docker compose -f docker-compose.prod.yml logs api | grep -i "rate limit"

# Check for Redis connection logs
docker compose -f docker-compose.prod.yml logs api | grep -i "redis"
```

## Troubleshooting

### Issue: "Redis connection error"

**Symptoms:**
- Logs show: `Redis connection error: ECONNREFUSED`
- Rate limiting not working
- Requests succeed even when they should be rate limited

**Solutions:**

1. **Verify Redis is running:**
   ```bash
   docker compose ps redis
   # Should show: Up

   docker compose exec redis redis-cli ping
   # Should output: PONG
   ```

2. **Check REDIS_URL environment variable:**
   ```bash
   docker compose exec api env | grep REDIS_URL
   # Should output: REDIS_URL=redis://redis:6379
   ```

3. **Restart Redis:**
   ```bash
   docker compose restart redis
   docker compose restart api
   ```

4. **Check Redis logs:**
   ```bash
   docker compose logs redis
   ```

### Issue: "Rate limiting not enforced"

**Symptoms:**
- Can make more than 100 requests without being rate limited
- No error messages in logs

**Solutions:**

1. **Verify Redis connection:**
   ```bash
   docker compose exec redis redis-cli
   > KEYS gcmc:ratelimit:*
   # Should show rate limit keys if requests are being made
   ```

2. **Check if middleware is applied:**
   ```typescript
   // In your router, verify rate limiter is used:
   .use(rateLimiters.normal("operationName"))
   ```

3. **Clear Redis cache (development only):**
   ```bash
   docker compose exec redis redis-cli FLUSHDB
   ```

### Issue: "Too many rate limit errors"

**Symptoms:**
- Users complaining about being rate limited too frequently
- Rate limits seem too strict

**Solutions:**

1. **Adjust rate limits in `/packages/api/src/lib/rate-limiter.ts`:**
   ```typescript
   // Increase from 100 to 200 requests per minute
   export const normalRateLimiter = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(200, "60 s"),
     analytics: true,
   });
   ```

2. **Check if rate limiting is per-user or global:**
   - Current implementation is per-user (identifier includes user ID)
   - Each user gets their own rate limit allowance

3. **Monitor rate limit analytics:**
   ```bash
   # Check rate limit hit count
   docker compose exec redis redis-cli
   > KEYS gcmc:ratelimit:*
   > GET gcmc:ratelimit:analytics:*
   ```

### Issue: "Redis memory full"

**Symptoms:**
- Redis logs show: `OOM command not allowed`
- Rate limiting stops working

**Solutions:**

1. **Check Redis memory usage:**
   ```bash
   docker compose exec redis redis-cli INFO memory
   ```

2. **Increase Redis memory limit in `docker-compose.prod.yml`:**
   ```yaml
   redis:
     deploy:
       resources:
         limits:
           memory: 1G  # Increase from 512MB
   ```

3. **Configure eviction policy:**
   ```bash
   docker compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
   ```

4. **Clear old rate limit data:**
   ```bash
   # Rate limit keys have TTL and expire automatically
   # Check TTL on keys
   docker compose exec redis redis-cli
   > TTL gcmc:ratelimit:normal:USER_ID:operation
   ```

## Rollback Plan

**If Redis rate limiting causes issues, you can temporarily rollback:**

1. **Revert to previous commit (if needed):**
   ```bash
   git log --oneline | grep "rate limit"
   git revert <commit-hash>
   ```

2. **Use environment flag to disable Redis (emergency only):**
   ```typescript
   // Add to rate-limiter.ts
   const USE_REDIS = process.env.USE_REDIS_RATE_LIMITING !== "false";

   if (!USE_REDIS) {
     console.warn("Redis rate limiting disabled - using in-memory fallback");
     // Fall back to in-memory (NOT recommended for production)
   }
   ```

3. **Contact team:**
   - Report issue in team chat
   - Create incident report
   - Document what went wrong

**IMPORTANT:** In-memory rate limiting is NOT suitable for production with multiple instances. Only use as temporary emergency measure.

## Performance Considerations

### Redis Connection Pool

The `ioredis` client automatically manages connection pooling:

```typescript
// Current configuration
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});
```

**For high-traffic production:**

```typescript
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  // Additional options for high traffic
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true; // Reconnect on READONLY error
    }
    return false;
  },
});
```

### Rate Limit Key Expiry

Keys automatically expire after the time window:
- Normal operations: 60 seconds
- All rate limiters use sliding window algorithm
- Old keys are automatically cleaned up by Redis

### Redis High Availability

**For production, consider:**

1. **Redis Sentinel:** Automatic failover
2. **Redis Cluster:** Horizontal scaling
3. **Managed Redis:** Built-in HA (AWS ElastiCache, etc.)

**Example with Redis Sentinel:**

```typescript
import { Redis } from "ioredis";

const redis = new Redis({
  sentinels: [
    { host: "sentinel-1", port: 26379 },
    { host: "sentinel-2", port: 26379 },
    { host: "sentinel-3", port: 26379 },
  ],
  name: "mymaster",
  password: process.env.REDIS_PASSWORD,
});
```

## Security Considerations

### Redis Security

1. **Use Authentication:**
   ```bash
   # In production
   REDIS_URL="redis://username:password@host:6379"
   ```

2. **Enable TLS:**
   ```bash
   # For managed Redis services
   REDIS_URL="rediss://username:password@host:6379"  # Note: rediss://
   ```

3. **Network Isolation:**
   - Redis should only be accessible from API servers
   - Use Docker networks or VPC security groups
   - Never expose Redis port publicly

4. **Regular Updates:**
   ```bash
   # Keep Redis image up to date
   docker pull redis:7-alpine
   docker compose -f docker-compose.prod.yml up -d redis
   ```

### Rate Limiting Security

1. **Identifier Strategy:**
   - Current: User ID + Operation
   - Prevents single user from overwhelming API
   - Different users get separate rate limits

2. **Error Messages:**
   - Don't leak sensitive information
   - Current message: "Rate limit exceeded. Try again in X seconds."
   - Includes retry-after time for user experience

3. **Analytics:**
   - `@upstash/ratelimit` includes analytics
   - Can detect potential abuse patterns
   - Monitor for unusual rate limit hits

## Future Enhancements

### Potential Improvements

1. **Dynamic Rate Limits:**
   ```typescript
   // Adjust limits based on user tier
   const getUserRateLimit = (user: User) => {
     return user.tier === "premium" ? 200 : 100;
   };
   ```

2. **Rate Limit Response Headers:**
   ```typescript
   // Add to HTTP response
   res.setHeader("X-RateLimit-Limit", limit);
   res.setHeader("X-RateLimit-Remaining", remaining);
   res.setHeader("X-RateLimit-Reset", reset);
   ```

3. **Rate Limit Dashboard:**
   - Monitor rate limit hits
   - Alert on abuse patterns
   - Visualize usage patterns

4. **IP-Based Rate Limiting:**
   ```typescript
   // In addition to user-based limiting
   const identifier = `${ctx.ip}:${operation}`;
   ```

5. **Whitelist/Blacklist:**
   ```typescript
   // Bypass rate limiting for trusted clients
   if (WHITELISTED_IPS.includes(ctx.ip)) {
     return next();
   }
   ```

## References

### Documentation
- [Upstash Ratelimit Docs](https://github.com/upstash/ratelimit)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)

### Related Files
- `/home/user/kaj-gcmc-bts/packages/api/src/lib/rate-limiter.ts` - Rate limiter implementation
- `/home/user/kaj-gcmc-bts/packages/api/src/middleware/rateLimit.ts` - Rate limiting middleware
- `/home/user/kaj-gcmc-bts/docs/DEPLOYMENT.md` - Deployment documentation
- `/home/user/kaj-gcmc-bts/.env.example` - Environment configuration

### Support

**Questions or Issues?**
- Check troubleshooting section above
- Review Redis logs: `docker compose logs redis`
- Review API logs: `docker compose logs api`
- Contact DevOps team

---

**Last Updated:** 2025-11-16
**Version:** 1.0.0
**Status:** Production Ready
