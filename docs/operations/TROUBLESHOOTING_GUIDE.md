# Troubleshooting Guide

> **KAJ-GCMC BTS Platform - Complete Troubleshooting Manual**
> **Version:** 1.0.0
> **Last Updated:** 2025-11-18

This guide provides comprehensive troubleshooting procedures for diagnosing and resolving issues in the KAJ-GCMC BTS platform.

---

## 📚 Table of Contents

- [Quick Diagnostic Tools](#quick-diagnostic-tools)
- [Common Issues](#common-issues)
- [Application Layer Issues](#application-layer-issues)
- [Database Issues](#database-issues)
- [Authentication & Authorization](#authentication--authorization)
- [Network & Connectivity](#network--connectivity)
- [Performance Issues](#performance-issues)
- [File Upload & Storage](#file-upload--storage)
- [Background Jobs & Workers](#background-jobs--workers)
- [Monitoring & Alerts](#monitoring--alerts)
- [Emergency Procedures](#emergency-procedures)

---

## 🔍 Quick Diagnostic Tools

### System Health Check Script

```bash
#!/bin/bash
# scripts/quick-diagnosis.sh

echo "🏥 KAJ-GCMC BTS Platform - Quick Health Check"
echo "============================================="

# Check Docker containers
echo "📦 Docker Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check system resources
echo -e "\n💻 System Resources:"
echo "Memory Usage:"
free -h
echo -e "\nDisk Usage:"
df -h /opt/gcmc-kaj

echo -e "\nCPU Usage:"
top -bn1 | grep "Cpu(s)"

# Check application endpoints
echo -e "\n🔗 Application Health Endpoints:"
curl -s -o /dev/null -w "Web App: %{http_code} - %{time_total}s\n" https://app.gcmc-kaj.com/health
curl -s -o /dev/null -w "API: %{http_code} - %{time_total}s\n" https://api.gcmc-kaj.com/health

# Check database connectivity
echo -e "\n🗄️ Database Status:"
docker exec gcmc-kaj-postgres pg_isready -U gcmc_user -d gcmc_production

# Check Redis connectivity
echo -e "\n📦 Redis Status:"
docker exec gcmc-kaj-redis redis-cli ping

# Check MinIO status
echo -e "\n🗂️ MinIO Status:"
docker exec gcmc-kaj-minio mc admin info local

echo -e "\n✅ Quick diagnosis completed"
```

### Log Analysis Tool

```bash
#!/bin/bash
# scripts/analyze-logs.sh

SERVICE=${1:-all}
LINES=${2:-100}

analyze_logs() {
  local container=$1
  local description=$2

  echo "📋 $description Logs (last $LINES lines):"
  echo "----------------------------------------"

  if docker ps --format "{{.Names}}" | grep -q "^$container$"; then
    # Recent errors
    echo "🚨 Recent Errors:"
    docker logs $container --tail $LINES 2>&1 | grep -i "error\|exception\|fail" | tail -10

    # Recent warnings
    echo -e "\n⚠️ Recent Warnings:"
    docker logs $container --tail $LINES 2>&1 | grep -i "warn" | tail -5

    # Connection issues
    echo -e "\n🔌 Connection Issues:"
    docker logs $container --tail $LINES 2>&1 | grep -i "connection\|timeout\|refuse" | tail -5

    # Performance issues
    echo -e "\n🐌 Performance Indicators:"
    docker logs $container --tail $LINES 2>&1 | grep -i "slow\|timeout\|queue" | tail -5
  else
    echo "❌ Container $container not running"
  fi
  echo
}

case $SERVICE in
  "api"|"all")
    analyze_logs "gcmc-kaj-api" "API Server"
    ;;
esac

case $SERVICE in
  "web"|"all")
    analyze_logs "gcmc-kaj-web" "Web Application"
    ;;
esac

case $SERVICE in
  "worker"|"all")
    analyze_logs "gcmc-kaj-worker" "Background Worker"
    ;;
esac

case $SERVICE in
  "postgres"|"all")
    analyze_logs "gcmc-kaj-postgres" "PostgreSQL Database"
    ;;
esac

case $SERVICE in
  "redis"|"all")
    analyze_logs "gcmc-kaj-redis" "Redis Cache"
    ;;
esac
```

---

## 🚨 Common Issues

### 1. Application Won't Start

**Symptoms:**
- Docker containers exit with error codes
- Services restart continuously
- Health checks return 503/504 errors

**Diagnostic Steps:**

```bash
# Check container status and logs
docker ps -a | grep gcmc-kaj
docker logs gcmc-kaj-api --tail 50

# Check environment variables
docker exec gcmc-kaj-api env | grep -E "(NODE_ENV|DATABASE_URL|REDIS_URL)"

# Verify required services
docker exec gcmc-kaj-api nc -zv postgres 5432
docker exec gcmc-kaj-api nc -zv redis 6379
```

**Common Causes & Solutions:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Exit code 1 | Missing environment variables | Check .env.production file |
| Exit code 125 | Docker configuration error | Validate docker-compose.yml |
| Exit code 126 | Permission denied | Check file permissions |
| Connection refused | Database not ready | Wait for database startup |

**Resolution Steps:**
1. Verify all environment variables are set
2. Check database and Redis connectivity
3. Validate Docker configuration
4. Review application startup logs
5. Restart services in correct order

### 2. Authentication Failures

**Symptoms:**
- Users cannot log in
- Session timeouts
- Unauthorized errors in logs

**Diagnostic Steps:**

```bash
# Check auth service status
curl -s https://app.gcmc-kaj.com/api/auth/session | jq

# Verify auth secret configuration
docker exec gcmc-kaj-api node -e "console.log(process.env.AUTH_SECRET ? 'Auth secret set' : 'Missing auth secret')"

# Check session storage (Redis)
docker exec gcmc-kaj-redis redis-cli keys "*session*" | head -5

# Test database auth tables
docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production \
  -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM sessions;"
```

**Resolution Steps:**
1. Verify AUTH_SECRET is set and consistent across all services
2. Check Redis connectivity and session storage
3. Validate user records in database
4. Clear corrupt sessions: `docker exec gcmc-kaj-redis redis-cli flushdb`
5. Restart authentication services

### 3. Database Connection Pool Exhaustion

**Symptoms:**
- "Connection pool exhausted" errors
- Slow query responses
- Timeouts in application logs

**Diagnostic Steps:**

```bash
# Check active connections
docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production \
  -c "SELECT count(*) FROM pg_stat_activity;"

# Check connection pool settings
docker exec gcmc-kaj-api node -e "console.log('Pool size:', process.env.DATABASE_POOL_SIZE || 'default')"

# Monitor connection activity
docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production \
  -c "SELECT client_addr, state, count(*) FROM pg_stat_activity GROUP BY client_addr, state;"
```

**Resolution Steps:**
1. Increase `DATABASE_POOL_SIZE` in environment
2. Identify and kill long-running queries
3. Restart application to reset connections
4. Consider connection pooling with PgBouncer

---

## 💻 Application Layer Issues

### Next.js Build/Runtime Errors

**Common Error Patterns:**

```bash
# Hydration mismatch errors
Error: Text content does not match server-rendered HTML

# Memory issues
JavaScript heap out of memory

# Module resolution errors
Module not found: Can't resolve '@/components'
```

**Diagnostic Commands:**

```bash
# Check build logs
docker logs gcmc-kaj-web --tail 100 | grep -A5 -B5 "ERROR"

# Memory usage
docker stats gcmc-kaj-web --no-stream

# Environment consistency
docker exec gcmc-kaj-web node -e "console.log(process.env.NODE_ENV)"
```

**Solutions:**

1. **Hydration Issues:**
   ```typescript
   // Add dynamic imports for client-only components
   const ClientOnlyComponent = dynamic(() => import('./ClientComponent'), {
     ssr: false
   });
   ```

2. **Memory Issues:**
   ```yaml
   # Increase memory limit in docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 4G
   ```

### tRPC API Errors

**Common Issues:**

```bash
# TRPC_ERROR: UNAUTHORIZED
# TRPC_ERROR: NOT_FOUND
# TRPC_ERROR: INTERNAL_SERVER_ERROR
```

**Debugging:**

```bash
# Enable debug logging
docker exec gcmc-kaj-api node -e "process.env.LOG_LEVEL = 'debug'"

# Check specific router
curl -X POST https://api.gcmc-kaj.com/trpc/clients.list \
  -H "Content-Type: application/json" \
  -d '{"input":{"page":1}}'

# Test authentication context
curl -s https://api.gcmc-kaj.com/trpc/privateData \
  -H "Cookie: better-auth.session_token=your-token" | jq
```

**Solutions:**

1. **Permission Errors:**
   - Check user role assignments
   - Verify RBAC permissions in database
   - Clear and recreate user sessions

2. **Context Issues:**
   - Validate session token
   - Check tenant isolation
   - Verify middleware execution

---

## 🗄 Database Issues

### PostgreSQL Performance Problems

**Symptoms:**
- Slow query execution
- High CPU usage
- Connection timeouts

**Diagnostic Queries:**

```sql
-- Long-running queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Lock conflicts
SELECT
  blocked_locks.pid     AS blocked_pid,
  blocked_activity.usename  AS blocked_user,
  blocking_locks.pid     AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query    AS blocked_statement,
  blocking_activity.query   AS current_statement_in_blocking_process
FROM  pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Resolution Steps:**

1. **Kill Long-Running Queries:**
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE now() - query_start > interval '10 minutes';
   ```

2. **Optimize Queries:**
   ```sql
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_clients_tenant_id ON clients(tenant_id);
   CREATE INDEX CONCURRENTLY idx_documents_client_id ON documents(client_id);

   -- Analyze tables
   ANALYZE clients, documents, filings;
   ```

3. **Vacuum and Maintenance:**
   ```bash
   # Auto-vacuum settings
   docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production \
     -c "ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;"

   # Manual vacuum
   docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production \
     -c "VACUUM ANALYZE;"
   ```

### Database Migration Issues

**Failed Migration Recovery:**

```bash
# Check migration status
docker exec gcmc-kaj-api bun run db:status

# Reset to last known good state
docker exec gcmc-kaj-api bun run db:migrate:reset

# Apply specific migration
docker exec gcmc-kaj-api bun run db:migrate:up --name="20241118_add_client_indexes"
```

---

## 🔐 Authentication & Authorization

### Better-Auth Session Issues

**Session Validation:**

```bash
# Check session in Redis
docker exec gcmc-kaj-redis redis-cli get "session:user-123-session-id"

# Validate session structure
curl -s https://app.gcmc-kaj.com/api/auth/session \
  -H "Cookie: better-auth.session_token=session-token" | jq

# Test user permissions
docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production \
  -c "SELECT u.email, r.name as role, p.permission
      FROM users u
      JOIN roles r ON u.role = r.name
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = 'user-123';"
```

**Common Fixes:**

1. **Clear Corrupted Sessions:**
   ```bash
   # Clear all sessions for user
   docker exec gcmc-kaj-redis redis-cli del "session:*user-123*"

   # Clear expired sessions
   docker exec gcmc-kaj-redis redis-cli eval "
     local keys = redis.call('keys', 'session:*')
     for i=1,#keys do
       local ttl = redis.call('ttl', keys[i])
       if ttl == -1 then
         redis.call('del', keys[i])
       end
     end
   " 0
   ```

2. **Fix Permission Issues:**
   ```sql
   -- Reset user role
   UPDATE users SET role = 'ComplianceOfficer' WHERE email = 'user@example.com';

   -- Add missing permissions
   INSERT INTO role_permissions (role_id, permission_id)
   SELECT r.id, p.id
   FROM roles r, permissions p
   WHERE r.name = 'ComplianceOfficer' AND p.permission = 'clients:view';
   ```

---

## 🌐 Network & Connectivity

### Load Balancer Issues

**nginx Configuration Problems:**

```bash
# Test nginx configuration
nginx -t

# Check upstream status
curl -s http://localhost/nginx_status

# Monitor access logs
tail -f /var/log/nginx/access.log | grep gcmc-kaj

# Check SSL certificates
openssl s_client -connect api.gcmc-kaj.com:443 -servername api.gcmc-kaj.com
```

**Common Fixes:**

1. **Upstream Server Down:**
   ```nginx
   # Temporary remove failing server
   upstream api_backend {
       server api-1.internal:3000;
       # server api-2.internal:3000 down;  # Temporarily disabled
       server api-3.internal:3000;
   }
   ```

2. **SSL Certificate Issues:**
   ```bash
   # Renew Let's Encrypt certificate
   certbot renew --nginx

   # Update nginx after certificate renewal
   nginx -s reload
   ```

### DNS Resolution Problems

**Diagnostic Tools:**

```bash
# Test DNS resolution
nslookup api.gcmc-kaj.com
dig +short api.gcmc-kaj.com

# Check internal DNS
docker exec gcmc-kaj-api nslookup postgres
docker exec gcmc-kaj-api nslookup redis

# Test connectivity
docker exec gcmc-kaj-api nc -zv postgres 5432
docker exec gcmc-kaj-api nc -zv redis 6379
```

---

## ⚡ Performance Issues

### Slow API Responses

**Performance Monitoring:**

```bash
# Check API metrics
curl -s https://api.gcmc-kaj.com/metrics | grep http_request_duration

# Monitor database queries
docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production \
  -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Redis performance
docker exec gcmc-kaj-redis redis-cli --latency-history -i 1
```

**Optimization Steps:**

1. **Database Query Optimization:**
   ```sql
   -- Identify slow queries
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   WHERE mean_exec_time > 1000
   ORDER BY mean_exec_time DESC;

   -- Add indexes for common queries
   CREATE INDEX CONCURRENTLY idx_documents_expiry
   ON documents(expiry_date) WHERE expiry_date IS NOT NULL;
   ```

2. **Redis Caching:**
   ```typescript
   // Implement caching in API routes
   const cacheKey = `client:${clientId}:overview`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);

   const data = await prisma.client.findUnique({...});
   await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min cache
   ```

### High Memory Usage

**Memory Analysis:**

```bash
# Container memory usage
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Node.js heap analysis
docker exec gcmc-kaj-api node -e "console.log(process.memoryUsage())"

# PostgreSQL memory
docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production \
  -c "SELECT setting, unit FROM pg_settings WHERE name IN ('shared_buffers', 'work_mem', 'maintenance_work_mem');"
```

**Memory Optimization:**

1. **Node.js Memory Tuning:**
   ```bash
   # Increase heap size
   NODE_OPTIONS="--max-old-space-size=4096"

   # Enable garbage collection logging
   NODE_OPTIONS="--trace-gc --trace-gc-verbose"
   ```

2. **Database Memory Tuning:**
   ```sql
   -- Optimize PostgreSQL memory settings
   ALTER SYSTEM SET shared_buffers = '256MB';
   ALTER SYSTEM SET work_mem = '4MB';
   ALTER SYSTEM SET maintenance_work_mem = '64MB';
   SELECT pg_reload_conf();
   ```

---

## 📁 File Upload & Storage

### MinIO Connectivity Issues

**Diagnostic Steps:**

```bash
# Test MinIO connection
docker exec gcmc-kaj-minio mc admin info local

# Check bucket permissions
docker exec gcmc-kaj-minio mc ls local/

# Test file upload
docker exec gcmc-kaj-minio mc cp /tmp/test.txt local/gcmc-prod/test/

# Check storage usage
docker exec gcmc-kaj-minio mc admin info local | grep "Used"
```

**Common Issues:**

1. **Bucket Access Denied:**
   ```bash
   # Fix bucket policy
   docker exec gcmc-kaj-minio mc policy set public local/gcmc-prod/public/
   docker exec gcmc-kaj-minio mc policy set private local/gcmc-prod/documents/
   ```

2. **Storage Full:**
   ```bash
   # Clean up old files
   docker exec gcmc-kaj-minio find /data -name "*.tmp" -mtime +7 -delete

   # Implement lifecycle management
   docker exec gcmc-kaj-minio mc ilm add local/gcmc-prod \
     --expiry-days 365 --prefix "temp/"
   ```

### File Upload Failures

**Debug Upload Process:**

```typescript
// Debug presigned URL generation
const uploadData = await trpc.documentUpload.getUploadUrl.mutate({
  clientId: 123,
  documentId: 456,
  fileName: 'test.pdf',
  fileSize: 1024000,
  contentType: 'application/pdf',
});

console.log('Upload URL:', uploadData.uploadUrl);

// Test direct upload
const response = await fetch(uploadData.uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
  },
});

console.log('Upload status:', response.status);
```

---

## ⚙️ Background Jobs & Workers

### BullMQ Worker Issues

**Worker Status Check:**

```bash
# Check worker logs
docker logs gcmc-kaj-worker --tail 50

# Redis queue inspection
docker exec gcmc-kaj-redis redis-cli keys "*bull*"
docker exec gcmc-kaj-redis redis-cli llen "bull:compliance:waiting"

# Failed jobs analysis
docker exec gcmc-kaj-redis redis-cli lrange "bull:compliance:failed" 0 10
```

**Common Worker Problems:**

1. **Jobs Stuck in Queue:**
   ```bash
   # Clear stuck jobs
   docker exec gcmc-kaj-redis redis-cli del "bull:compliance:active"

   # Restart worker
   docker restart gcmc-kaj-worker
   ```

2. **Job Processing Failures:**
   ```typescript
   // Add better error handling in worker
   export const complianceWorker = new Worker('compliance', async (job) => {
     try {
       await processComplianceUpdate(job.data);
     } catch (error) {
       console.error('Job failed:', error);
       throw error; // Let BullMQ handle retries
     }
   }, {
     connection: redis,
     attempts: 3,
     backoff: {
       type: 'exponential',
       delay: 2000,
     },
   });
   ```

---

## 📊 Monitoring & Alerts

### Alert Investigation

**When Alerts Fire:**

1. **High API Error Rate Alert:**
   ```bash
   # Check error logs
   docker logs gcmc-kaj-api --since 1h | grep -i error | tail -20

   # Check specific error codes
   curl -s https://api.gcmc-kaj.com/metrics | grep "http_requests_total" | grep "5.."
   ```

2. **Database Connection Alert:**
   ```bash
   # Check connection count
   docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production \
     -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

   # Kill long-running connections
   docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production \
     -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND now() - query_start > interval '30 minutes';"
   ```

3. **High Memory Usage Alert:**
   ```bash
   # Identify memory hogs
   docker stats --no-stream | sort -k 4 -h

   # Restart high-memory containers
   docker restart gcmc-kaj-api
   ```

---

## 🚨 Emergency Procedures

### Complete System Outage

**Immediate Response (0-15 minutes):**

1. **Assess Scope:**
   ```bash
   ./scripts/quick-diagnosis.sh
   curl -s https://status.gcmc-kaj.com/api/status
   ```

2. **Check Infrastructure:**
   ```bash
   # Verify all containers
   docker ps --format "table {{.Names}}\t{{.Status}}"

   # Check system resources
   free -h && df -h
   ```

3. **Emergency Restart:**
   ```bash
   # If safe to restart all services
   docker-compose -f docker-compose.production.yml down
   docker-compose -f docker-compose.production.yml up -d
   ```

### Data Corruption Incident

**Response Process:**

1. **Stop Write Operations:**
   ```bash
   # Scale down to read-only mode
   docker service scale gcmc-kaj-api=0
   docker service scale gcmc-kaj-worker=0
   ```

2. **Assess Damage:**
   ```sql
   -- Check data integrity
   SELECT tablename, n_tup_ins, n_tup_upd, n_tup_del
   FROM pg_stat_user_tables
   ORDER BY n_tup_upd DESC;
   ```

3. **Restore from Backup:**
   ```bash
   # Identify last good backup
   ls -la /opt/backups/gcmc-kaj/ | grep database

   # Restore process
   ./scripts/restore-production.sh 20251118-020000
   ```

### Security Breach Response

**Immediate Actions:**

1. **Isolate Systems:**
   ```bash
   # Block external access
   iptables -A INPUT -p tcp --dport 443 -j DROP

   # Preserve logs
   cp -r /var/log/nginx/ /opt/incident-logs/
   docker logs gcmc-kaj-api > /opt/incident-logs/api.log
   ```

2. **Revoke Access:**
   ```sql
   -- Disable all user sessions
   DELETE FROM sessions WHERE expires_at > NOW();

   -- Reset critical user passwords
   UPDATE users SET password_hash = NULL WHERE role IN ('SuperAdmin', 'FirmAdmin');
   ```

3. **Investigate:**
   ```bash
   # Check access logs
   grep -E "(POST|PUT|DELETE)" /var/log/nginx/access.log | tail -100

   # Check for unusual API calls
   docker logs gcmc-kaj-api | grep -E "(delete|update)" | tail -50
   ```

---

## 📞 Escalation Procedures

### When to Escalate

| Condition | Escalation Level | Response Time |
|-----------|------------------|---------------|
| Complete system outage | P1 - Critical | Immediate |
| Data loss/corruption | P1 - Critical | Immediate |
| Security breach | P1 - Critical | Immediate |
| API errors > 10% | P2 - High | 30 minutes |
| Performance degradation | P3 - Medium | 2 hours |

### Contact Information

```bash
# Emergency contacts
DevOps Lead: +1-XXX-XXX-XXXX
Platform Architect: +1-XXX-XXX-XXXX
Security Team: security@gcmc-kaj.com

# Escalation Slack channels
#incident-response
#devops-alerts
#security-alerts
```

---

## 📋 Troubleshooting Checklist

### Basic Health Check

- [ ] All Docker containers running
- [ ] Web application responds to health check
- [ ] API server responds to health check
- [ ] Database connectivity confirmed
- [ ] Redis connectivity confirmed
- [ ] MinIO/storage accessibility confirmed
- [ ] No critical errors in logs (last 1 hour)
- [ ] System resources within normal range
- [ ] SSL certificates valid
- [ ] DNS resolution working

### Performance Check

- [ ] API response times < 500ms (95th percentile)
- [ ] Database query times < 100ms (average)
- [ ] Memory usage < 80%
- [ ] Disk usage < 85%
- [ ] No connection pool exhaustion
- [ ] Background jobs processing normally
- [ ] Cache hit rate > 80%

### Security Check

- [ ] No failed authentication spikes
- [ ] No unusual API access patterns
- [ ] SSL/TLS properly configured
- [ ] Rate limiting functioning
- [ ] Audit logs being generated
- [ ] No unauthorized access attempts

---

**Troubleshooting Guide Version:** 1.0.0
**Platform Version:** 1.0.0
**Last Updated:** 2025-11-18
**Next Review:** 2025-12-18

For immediate assistance: [support@gcmc-kaj.com](mailto:support@gcmc-kaj.com)