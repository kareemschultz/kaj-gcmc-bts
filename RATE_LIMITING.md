# Rate Limiting Implementation

This document describes the rate limiting implementation for critical API endpoints using Upstash Redis.

## Overview

Rate limiting has been implemented for the following critical endpoints:

1. **Authentication Endpoints** (sign in, sign up) - 5 requests per 15 minutes
2. **Report Generation Endpoints** - 10 requests per hour
3. **Portal sendMessage Endpoint** - 20 requests per hour

## Files Created/Modified

### Created Files

1. **`packages/api/src/middleware/rate-limit.ts`**
   - Main rate limiting configuration with Upstash Redis
   - Exports three rate limiters: `authRateLimiter`, `reportRateLimiter`, `messageRateLimiter`
   - Provides `checkRateLimit()` helper function
   - Includes proper error handling with TRPCError
   - Gracefully degrades when Redis is not configured (development mode)

2. **`apps/server/src/middleware/auth-rate-limit.ts`**
   - Hono middleware for authentication endpoints
   - Uses IP-based rate limiting for unauthenticated requests
   - Returns proper HTTP 429 responses with rate limit headers

### Modified Files

1. **`packages/api/src/routers/reports.ts`**
   - Added rate limiting to all report generation endpoints:
     - `generateClientFile`
     - `generateDocumentsList`
     - `generateFilingsSummary`
     - `generateComplianceReport`
     - `generateServiceHistory`
     - `generate` (generic endpoint)

2. **`packages/api/src/routers/portal.ts`**
   - Added rate limiting to `sendMessage` endpoint

3. **`apps/server/src/index.ts`**
   - Applied auth rate limiting middleware to `/api/auth/*` routes

## Configuration

### Environment Variables

The following environment variables must be set in production:

```bash
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Development Mode

In development, if Redis credentials are not configured:
- Rate limiting is automatically disabled
- Warning messages are logged to console
- All requests are allowed through

## Rate Limit Configurations

### Authentication Endpoints

```typescript
// 5 requests per 15 minutes
authRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "@gcmc/auth",
})
```

**Applied to:**
- `/api/auth/sign-in`
- `/api/auth/sign-up`
- All other `/api/auth/*` endpoints

**Identifier:** IP address (for unauthenticated requests)

### Report Generation Endpoints

```typescript
// 10 requests per hour
reportRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "60 m"),
  analytics: true,
  prefix: "@gcmc/reports",
})
```

**Applied to (tRPC endpoints):**
- `reports.generateClientFile`
- `reports.generateDocumentsList`
- `reports.generateFilingsSummary`
- `reports.generateComplianceReport`
- `reports.generateServiceHistory`
- `reports.generate`

**Identifier:** User ID (authenticated users only)

### Messaging Endpoint

```typescript
// 20 requests per hour
messageRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "60 m"),
  analytics: true,
  prefix: "@gcmc/messages",
})
```

**Applied to (tRPC endpoints):**
- `portal.sendMessage`

**Identifier:** User ID (authenticated users only)

## Error Handling

### tRPC Endpoints (Reports, Messages)

When rate limit is exceeded, a `TRPCError` is thrown:

```typescript
{
  code: "TOO_MANY_REQUESTS",
  message: "Rate limit exceeded for report generation. You have made 10 requests. Please try again in 45 minutes (3:30:00 PM).",
  cause: {
    limit: 10,
    remaining: 0,
    reset: 1700000000000,
    resetDate: "2023-11-15T15:30:00.000Z",
    retryAfter: 2700
  }
}
```

### HTTP Endpoints (Auth)

When rate limit is exceeded, an HTTP 429 response is returned:

```json
{
  "error": "TOO_MANY_REQUESTS",
  "message": "Rate limit exceeded for authentication. You have made 5 requests. Please try again in 15 minutes (3:30:00 PM).",
  "limit": 5,
  "remaining": 0,
  "reset": "2023-11-15T15:30:00.000Z",
  "retryAfter": 900
}
```

**Headers:**
- `Retry-After: 900` (seconds)
- `X-RateLimit-Limit: 5`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: 1700000000000` (Unix timestamp)

## Testing Rate Limiting

### Prerequisites

1. Set up Upstash Redis:
   ```bash
   # Sign up at https://upstash.com
   # Create a new Redis instance
   # Copy the REST URL and token to your .env file
   ```

2. Configure environment variables:
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

### Test 1: Authentication Rate Limiting

Test that authentication endpoints are rate limited (5 requests per 15 minutes):

```bash
# Using curl
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/sign-in \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done
```

**Expected behavior:**
- Requests 1-5: Return normal auth errors (401 or similar)
- Request 6: Return 429 with rate limit error message

### Test 2: Report Generation Rate Limiting

Test that report endpoints are rate limited (10 requests per hour):

```typescript
// Using tRPC client
const testReportRateLimit = async () => {
  try {
    for (let i = 1; i <= 11; i++) {
      console.log(`Request ${i}:`);
      try {
        await trpc.reports.generateClientFile.mutate({ clientId: 1 });
        console.log("Success");
      } catch (error) {
        console.log("Error:", error.message);
      }
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
};
```

**Expected behavior:**
- Requests 1-10: Process normally (or return data/errors based on permissions)
- Request 11: Throw TRPCError with code "TOO_MANY_REQUESTS"

### Test 3: Message Rate Limiting

Test that messaging endpoint is rate limited (20 requests per hour):

```typescript
// Using tRPC client
const testMessageRateLimit = async () => {
  try {
    for (let i = 1; i <= 21; i++) {
      console.log(`Request ${i}:`);
      try {
        await trpc.portal.sendMessage.mutate({
          conversationId: 1,
          body: `Test message ${i}`,
        });
        console.log("Success");
      } catch (error) {
        console.log("Error:", error.message);
      }
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
};
```

**Expected behavior:**
- Requests 1-20: Process normally
- Request 21: Throw TRPCError with code "TOO_MANY_REQUESTS"

### Test 4: Rate Limit Reset

Verify that rate limits reset after the specified time window:

```bash
# 1. Trigger rate limit for auth (5 requests)
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/auth/sign-in \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}'
done

# 2. Verify rate limit is active
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}' \
  -w "\nHTTP Status: %{http_code}\n"
# Should return 429

# 3. Wait 15 minutes or use Redis CLI to check TTL
# redis-cli TTL "@gcmc/auth:ip:127.0.0.1"

# 4. After 15 minutes, verify rate limit is reset
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}' \
  -w "\nHTTP Status: %{http_code}\n"
# Should return normal error (not 429)
```

### Test 5: Development Mode (Redis Not Configured)

Test that rate limiting gracefully degrades when Redis is not configured:

```bash
# 1. Remove Redis environment variables
unset UPSTASH_REDIS_REST_URL
unset UPSTASH_REDIS_REST_TOKEN

# 2. Restart the server
npm run dev

# 3. Make requests - they should all succeed (no rate limiting)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/sign-in \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}'
done
```

**Expected behavior:**
- Console shows warnings: "⚠️  Auth rate limiting disabled (Redis not configured)"
- All requests proceed without rate limiting

### Test 6: Redis Failure Handling

Test that the API continues to work even if Redis goes down:

```bash
# 1. Stop Redis or use invalid credentials
export UPSTASH_REDIS_REST_TOKEN=invalid-token

# 2. Make requests
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}'
```

**Expected behavior:**
- Console shows error: "❌ Auth rate limiting error (allowing request)"
- Request proceeds normally (rate limiting is bypassed due to error)
- API remains operational

## Monitoring

### Upstash Dashboard

Monitor rate limiting in the Upstash dashboard:
1. Go to https://console.upstash.com
2. Select your Redis instance
3. View analytics for rate limiting
4. See blocked requests, patterns, and usage

### Application Logs

Rate limiting events are logged:

```bash
# Successful rate limit check (development)
✅ Auth rate limit check passed for ip:127.0.0.1: 4/5 remaining
✅ Rate limit check passed for report generation: 9/10 remaining

# Rate limit exceeded
# (Error is thrown, handled by application error logging)

# Rate limiting disabled/error
⚠️  Auth rate limiting disabled (Redis not configured)
❌ Auth rate limiting error (allowing request): [error details]
```

## Best Practices

1. **Production Setup:**
   - Always configure Redis credentials in production
   - Use Upstash Redis for serverless compatibility
   - Monitor rate limit analytics regularly

2. **Rate Limit Tuning:**
   - Adjust limits based on actual usage patterns
   - Consider different limits for different user tiers
   - Monitor false positives (legitimate users being blocked)

3. **Error Handling:**
   - Always catch rate limit errors in client applications
   - Show user-friendly messages with retry time
   - Implement exponential backoff for retries

4. **Security:**
   - Use rate limiting as one layer of defense
   - Combine with other security measures (CSRF, authentication, etc.)
   - Consider IP-based and user-based limiting together

## Troubleshooting

### Rate Limiting Not Working

1. Check Redis credentials:
   ```bash
   echo $UPSTASH_REDIS_REST_URL
   echo $UPSTASH_REDIS_REST_TOKEN
   ```

2. Verify Redis connection:
   ```bash
   curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
     "$UPSTASH_REDIS_REST_URL/ping"
   ```

3. Check application logs for warnings/errors

### Rate Limit Too Strict

1. Temporarily increase limits in `packages/api/src/middleware/rate-limit.ts`
2. Monitor usage patterns in Upstash dashboard
3. Adjust based on legitimate usage patterns

### Redis Performance Issues

1. Check Upstash instance performance in dashboard
2. Consider upgrading to a higher tier
3. Review rate limit analytics for unusual patterns

## Future Enhancements

Potential improvements to consider:

1. **User Tier-Based Limits:**
   - Different limits for free vs. paid users
   - Higher limits for admins/staff

2. **Dynamic Rate Limiting:**
   - Adjust limits based on system load
   - Implement burst allowances

3. **Rate Limit Warnings:**
   - Send warnings at 80% of limit
   - Email notifications for repeated limit hits

4. **IP Reputation:**
   - Stricter limits for suspicious IPs
   - Allowlist for trusted IPs

5. **Metrics and Alerts:**
   - Track rate limit hits over time
   - Alert on unusual patterns
   - Dashboard for monitoring
