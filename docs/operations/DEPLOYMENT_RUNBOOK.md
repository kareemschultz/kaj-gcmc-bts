# Production Deployment Runbook

> **KAJ-GCMC BTS Platform - Complete Production Deployment Guide**
> **Version:** 1.0.0
> **Last Updated:** 2025-11-18
> **Target Environment:** Production (Cloud/On-premises)

This runbook provides step-by-step instructions for deploying and maintaining the KAJ-GCMC BTS platform in production environments.

---

## 📚 Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Infrastructure Requirements](#infrastructure-requirements)
- [Deployment Procedures](#deployment-procedures)
- [Environment Configuration](#environment-configuration)
- [Database Migration](#database-migration)
- [Health Checks & Validation](#health-checks--validation)
- [Monitoring & Observability](#monitoring--observability)
- [Backup & Recovery](#backup--recovery)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### Code Readiness

- [ ] **Code Review**: All changes peer-reviewed and approved
- [ ] **Tests Passing**: All unit, integration, and E2E tests green
- [ ] **Security Scan**: No critical vulnerabilities detected
- [ ] **Performance Tests**: Load testing completed successfully
- [ ] **Documentation**: Updated for new features/changes

### Infrastructure Readiness

- [ ] **Server Resources**: CPU, memory, storage capacity verified
- [ ] **Network Configuration**: Firewall rules, load balancer setup
- [ ] **SSL/TLS Certificates**: Valid and properly configured
- [ ] **DNS Configuration**: Domain names pointing to correct endpoints
- [ ] **Backup Systems**: Database and file backup systems operational

### Dependencies

- [ ] **Database**: PostgreSQL cluster healthy and accessible
- [ ] **Cache**: Redis cluster operational
- [ ] **Object Storage**: MinIO/S3 buckets configured and accessible
- [ ] **External Services**: Third-party integrations validated
- [ ] **Monitoring**: Prometheus, Grafana, alerting systems ready

---

## 🏗 Infrastructure Requirements

### Minimum Production Requirements

#### Application Servers (3x instances for HA)

```yaml
Specifications:
  CPU: 4 vCPU cores
  Memory: 8 GB RAM
  Storage: 100 GB SSD
  Network: 1 Gbps
  OS: Ubuntu 22.04 LTS or equivalent

Load Balancer:
  Type: Application Load Balancer (ALB/nginx)
  SSL Termination: Yes
  Health Checks: /health endpoint
  Sticky Sessions: Required for Better-Auth
```

#### Database Cluster

```yaml
PostgreSQL Configuration:
  Version: 15+
  Primary: 8 vCPU, 16 GB RAM, 500 GB SSD
  Replica: 4 vCPU, 8 GB RAM, 500 GB SSD
  Backup: Automated daily backups, 30-day retention

Connection Pool:
  Tool: PgBouncer
  Max Connections: 100
  Pool Size: 25
```

#### Redis Cluster

```yaml
Redis Configuration:
  Version: 7.0+
  Nodes: 3x (1 primary, 2 replicas)
  Memory: 8 GB per node
  Persistence: AOF + RDB snapshots
  Cluster Mode: Enabled for HA
```

#### Object Storage

```yaml
MinIO/S3 Configuration:
  Storage: 1 TB initial, auto-scaling
  Redundancy: Multi-zone replication
  Access: Private with presigned URLs
  Backup: Cross-region replication
```

### Network Architecture

```yaml
Network Topology:
  Public Subnet: Load Balancer, Bastion Host
  Private Subnet: Application Servers, Databases
  Firewall Rules:
    - 443/HTTPS: Internet → Load Balancer
    - 80/HTTP: Internet → Load Balancer (redirect to 443)
    - 3000/API: Load Balancer → App Servers
    - 3001/Web: Load Balancer → App Servers
    - 5432/PostgreSQL: App Servers → Database
    - 6379/Redis: App Servers → Redis
    - 9000/MinIO: App Servers → Object Storage
```

---

## 🚀 Deployment Procedures

### 1. Environment Setup

#### Production Environment Variables

Create `.env.production`:

```bash
# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.gcmc-kaj.com
API_URL=https://api.gcmc-kaj.com

# Database Configuration
DATABASE_URL=postgresql://gcmc_user:STRONG_PASSWORD@db-cluster.gcmc-kaj.internal:5432/gcmc_production?sslmode=require
DATABASE_POOL_SIZE=25
DATABASE_POOL_TIMEOUT=30000

# Redis Configuration
REDIS_URL=redis://redis-cluster.gcmc-kaj.internal:6379
REDIS_CLUSTER_MODE=true
REDIS_PASSWORD=REDIS_STRONG_PASSWORD

# MinIO/S3 Configuration
MINIO_ENDPOINT=storage.gcmc-kaj.internal
MINIO_PORT=9000
MINIO_ACCESS_KEY=MINIO_ACCESS_KEY
MINIO_SECRET_KEY=MINIO_SECRET_KEY
MINIO_USE_SSL=true
MINIO_BUCKET_PREFIX=gcmc-prod

# Authentication
AUTH_SECRET=ULTRA_SECURE_64_CHARACTER_SECRET_KEY_FOR_PRODUCTION_USE
AUTH_URL=https://app.gcmc-kaj.com
AUTH_TRUST_HOST=true

# Security
ALLOWED_ORIGINS=https://app.gcmc-kaj.com,https://portal.gcmc-kaj.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Monitoring & Observability
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
PROMETHEUS_METRICS=true
NEW_RELIC_LICENSE_KEY=YOUR_NEW_RELIC_LICENSE

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@gcmc-kaj.com
SMTP_PASS=EMAIL_APP_PASSWORD
EMAIL_FROM=noreply@gcmc-kaj.com

# Backup Configuration
BACKUP_S3_BUCKET=gcmc-backups
BACKUP_S3_REGION=us-east-1
BACKUP_SCHEDULE="0 2 * * *"
```

#### Docker Production Configuration

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  web:
    image: gcmc-kaj/web:${VERSION}
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "3001:3001"
    networks:
      - gcmc-network
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  api:
    image: gcmc-kaj/api:${VERSION}
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    networks:
      - gcmc-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  worker:
    image: gcmc-kaj/worker:${VERSION}
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    networks:
      - gcmc-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 2G

networks:
  gcmc-network:
    external: true
```

### 2. Build and Deploy Process

#### Build Docker Images

```bash
#!/bin/bash
# scripts/build-production.sh

set -e

# Build version tag from git
VERSION=$(git describe --tags --always)
echo "Building version: $VERSION"

# Build all Docker images
echo "Building web application..."
docker build -t gcmc-kaj/web:$VERSION -t gcmc-kaj/web:latest \
  --file apps/web/Dockerfile \
  --build-arg NODE_ENV=production .

echo "Building API server..."
docker build -t gcmc-kaj/api:$VERSION -t gcmc-kaj/api:latest \
  --file apps/server/Dockerfile \
  --build-arg NODE_ENV=production .

echo "Building worker..."
docker build -t gcmc-kaj/worker:$VERSION -t gcmc-kaj/worker:latest \
  --file apps/worker/Dockerfile \
  --build-arg NODE_ENV=production .

# Push to registry
echo "Pushing images to registry..."
docker push gcmc-kaj/web:$VERSION
docker push gcmc-kaj/web:latest
docker push gcmc-kaj/api:$VERSION
docker push gcmc-kaj/api:latest
docker push gcmc-kaj/worker:$VERSION
docker push gcmc-kaj/worker:latest

echo "Build complete: $VERSION"
```

#### Zero-Downtime Deployment

```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

VERSION=${1:-latest}
ENVIRONMENT=${2:-production}

echo "Starting deployment of version: $VERSION"

# Pre-deployment checks
echo "Running pre-deployment checks..."
./scripts/pre-deployment-checks.sh

# Database migrations (if needed)
echo "Running database migrations..."
docker run --rm \
  --env-file .env.production \
  gcmc-kaj/api:$VERSION \
  bun run db:migrate

# Rolling deployment
echo "Starting rolling deployment..."

# Deploy API first (backend services)
docker service update \
  --image gcmc-kaj/api:$VERSION \
  --update-parallelism 1 \
  --update-delay 30s \
  gcmc-kaj-api

# Wait for API health
./scripts/wait-for-health.sh api 3000

# Deploy worker services
docker service update \
  --image gcmc-kaj/worker:$VERSION \
  --update-parallelism 1 \
  --update-delay 30s \
  gcmc-kaj-worker

# Deploy web frontend
docker service update \
  --image gcmc-kaj/web:$VERSION \
  --update-parallelism 1 \
  --update-delay 30s \
  gcmc-kaj-web

# Wait for web health
./scripts/wait-for-health.sh web 3001

# Post-deployment validation
echo "Running post-deployment validation..."
./scripts/post-deployment-checks.sh

echo "Deployment completed successfully!"
```

### 3. Health Check Scripts

```bash
#!/bin/bash
# scripts/wait-for-health.sh

SERVICE=$1
PORT=$2
MAX_ATTEMPTS=30
ATTEMPT=0

echo "Waiting for $SERVICE health check on port $PORT..."

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -f http://localhost:$PORT/health >/dev/null 2>&1; then
    echo "$SERVICE is healthy!"
    exit 0
  fi

  ATTEMPT=$((ATTEMPT + 1))
  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS failed, retrying in 10 seconds..."
  sleep 10
done

echo "ERROR: $SERVICE failed health check after $MAX_ATTEMPTS attempts"
exit 1
```

```bash
#!/bin/bash
# scripts/post-deployment-checks.sh

set -e

echo "Running post-deployment validation..."

# Test critical endpoints
echo "Testing API health..."
curl -f https://api.gcmc-kaj.com/health

echo "Testing web application..."
curl -f https://app.gcmc-kaj.com/health

echo "Testing authentication..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://app.gcmc-kaj.com/login)
if [ $response -ne 200 ]; then
  echo "ERROR: Login page not accessible"
  exit 1
fi

echo "Testing database connectivity..."
docker run --rm \
  --env-file .env.production \
  gcmc-kaj/api:latest \
  bun run test:db-connection

echo "Testing Redis connectivity..."
docker run --rm \
  --env-file .env.production \
  gcmc-kaj/api:latest \
  bun run test:redis-connection

echo "Testing MinIO connectivity..."
docker run --rm \
  --env-file .env.production \
  gcmc-kaj/api:latest \
  bun run test:storage-connection

echo "All post-deployment checks passed!"
```

---

## 🔧 Environment Configuration

### Load Balancer Configuration (nginx)

```nginx
# /etc/nginx/sites-available/gcmc-kaj
upstream api_backend {
    least_conn;
    server api-1.internal:3000 max_fails=3 fail_timeout=30s;
    server api-2.internal:3000 max_fails=3 fail_timeout=30s;
    server api-3.internal:3000 max_fails=3 fail_timeout=30s;
}

upstream web_backend {
    least_conn;
    server web-1.internal:3001 max_fails=3 fail_timeout=30s;
    server web-2.internal:3001 max_fails=3 fail_timeout=30s;
    server web-3.internal:3001 max_fails=3 fail_timeout=30s;
}

# API Server
server {
    listen 443 ssl http2;
    server_name api.gcmc-kaj.com;

    ssl_certificate /etc/ssl/certs/gcmc-kaj.com.pem;
    ssl_certificate_key /etc/ssl/private/gcmc-kaj.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Health check bypass
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://api_backend;
    }
}

# Web Application
server {
    listen 443 ssl http2;
    server_name app.gcmc-kaj.com;

    ssl_certificate /etc/ssl/certs/gcmc-kaj.com.pem;
    ssl_certificate_key /etc/ssl/private/gcmc-kaj.com.key;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/javascript application/javascript application/json;

    # Static assets caching
    location /_next/static {
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        proxy_pass http://web_backend;
    }

    location / {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Session stickiness for Better-Auth
        ip_hash;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.gcmc-kaj.com app.gcmc-kaj.com;
    return 301 https://$server_name$request_uri;
}
```

### Systemd Service Configuration

```ini
# /etc/systemd/system/gcmc-kaj.service
[Unit]
Description=KAJ-GCMC BTS Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/gcmc-kaj
ExecStart=/usr/bin/docker-compose -f docker-compose.production.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.production.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

---

## 🗃 Database Migration

### Migration Process

```bash
#!/bin/bash
# scripts/migrate-database.sh

set -e

echo "Starting database migration process..."

# Backup before migration
echo "Creating pre-migration backup..."
./scripts/backup-database.sh pre-migration-$(date +%Y%m%d-%H%M%S)

# Check migration status
echo "Checking migration status..."
docker run --rm \
  --env-file .env.production \
  gcmc-kaj/api:latest \
  bun run db:status

# Run migrations
echo "Running database migrations..."
docker run --rm \
  --env-file .env.production \
  gcmc-kaj/api:latest \
  bun run db:migrate

# Verify migration
echo "Verifying migration success..."
docker run --rm \
  --env-file .env.production \
  gcmc-kaj/api:latest \
  bun run db:validate

echo "Database migration completed successfully!"
```

### Rollback Migration

```bash
#!/bin/bash
# scripts/rollback-migration.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

echo "WARNING: This will rollback the database to: $BACKUP_FILE"
echo "All data changes since the backup will be lost!"
read -p "Are you sure? (yes/NO): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Rollback cancelled."
  exit 0
fi

echo "Rolling back database..."
./scripts/restore-database.sh $BACKUP_FILE

echo "Rollback completed. Please restart application services."
```

---

## 🏥 Health Checks & Validation

### Application Health Endpoints

```typescript
// Health check endpoints for monitoring
// GET /health
{
  "status": "healthy",
  "timestamp": "2025-11-18T12:00:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "storage": "healthy",
    "auth": "healthy"
  }
}

// GET /health/detailed
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": "5ms",
      "connections": {
        "active": 12,
        "total": 25
      }
    },
    "redis": {
      "status": "healthy",
      "responseTime": "2ms",
      "memory": {
        "used": "245MB",
        "max": "8GB"
      }
    },
    "storage": {
      "status": "healthy",
      "responseTime": "15ms",
      "buckets": ["documents", "reports", "uploads"]
    }
  }
}
```

### Monitoring Scripts

```bash
#!/bin/bash
# scripts/health-monitor.sh

# Function to check service health
check_service_health() {
  local service=$1
  local url=$2
  local expected_status=$3

  response=$(curl -s -o /dev/null -w "%{http_code}" $url)

  if [ $response -eq $expected_status ]; then
    echo "✅ $service: Healthy (HTTP $response)"
    return 0
  else
    echo "❌ $service: Unhealthy (HTTP $response)"
    return 1
  fi
}

# Health check matrix
echo "🔍 Running comprehensive health checks..."

check_service_health "Web Application" "https://app.gcmc-kaj.com/health" 200
check_service_health "API Server" "https://api.gcmc-kaj.com/health" 200
check_service_health "Authentication" "https://app.gcmc-kaj.com/api/auth/session" 200

# Database connectivity
echo "🗄️ Checking database connectivity..."
if docker exec gcmc-kaj-api bun run test:db-connection; then
  echo "✅ Database: Healthy"
else
  echo "❌ Database: Connection failed"
fi

# Redis connectivity
echo "📦 Checking Redis connectivity..."
if docker exec gcmc-kaj-api bun run test:redis-connection; then
  echo "✅ Redis: Healthy"
else
  echo "❌ Redis: Connection failed"
fi

# Storage connectivity
echo "🗂️ Checking MinIO connectivity..."
if docker exec gcmc-kaj-api bun run test:storage-connection; then
  echo "✅ MinIO: Healthy"
else
  echo "❌ MinIO: Connection failed"
fi

echo "Health check completed."
```

---

## 📊 Monitoring & Observability

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'gcmc-kaj-api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'gcmc-kaj-web'
    static_configs:
      - targets: ['web:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

### Alerting Rules

```yaml
# alerts/gcmc-kaj.yml
groups:
  - name: gcmc-kaj-api
    rules:
      - alert: APIHighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High API error rate detected"
          description: "API error rate is {{ $value }} errors per second"

      - alert: APIHighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency detected"
          description: "95th percentile latency is {{ $value }}s"

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool near limit"

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_config_maxmemory * 100 > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage high"

      - alert: DiskSpaceHigh
        expr: (node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes * 100 > 85
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space usage high on {{ $labels.instance }}"
```

---

## 💾 Backup & Recovery

### Automated Backup Script

```bash
#!/bin/bash
# scripts/backup-production.sh

set -e

BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/opt/backups/gcmc-kaj"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

echo "Starting backup process: $BACKUP_DATE"

# Database backup
echo "Backing up PostgreSQL database..."
docker exec gcmc-kaj-postgres pg_dump \
  -U gcmc_user \
  -d gcmc_production \
  --no-owner --no-privileges \
  | gzip > "$BACKUP_DIR/database-$BACKUP_DATE.sql.gz"

# Redis backup
echo "Backing up Redis data..."
docker exec gcmc-kaj-redis redis-cli BGSAVE
docker cp gcmc-kaj-redis:/data/dump.rdb "$BACKUP_DIR/redis-$BACKUP_DATE.rdb"

# MinIO backup (sync to backup bucket)
echo "Backing up MinIO data..."
docker exec gcmc-kaj-minio mc mirror \
  /data/gcmc-prod \
  backup-bucket/minio-$BACKUP_DATE/

# Application files backup
echo "Backing up application configuration..."
tar -czf "$BACKUP_DIR/config-$BACKUP_DATE.tar.gz" \
  /opt/gcmc-kaj/.env.production \
  /opt/gcmc-kaj/docker-compose.production.yml \
  /etc/nginx/sites-available/gcmc-kaj

# Upload to cloud storage
echo "Uploading backups to cloud storage..."
aws s3 sync $BACKUP_DIR s3://gcmc-backups/daily/

# Cleanup old backups
echo "Cleaning up old backups..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully: $BACKUP_DATE"
```

### Restore Procedure

```bash
#!/bin/bash
# scripts/restore-production.sh

BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
  echo "Usage: $0 <backup_date>"
  echo "Example: $0 20251118-140000"
  exit 1
fi

BACKUP_DIR="/opt/backups/gcmc-kaj"

echo "WARNING: This will restore data from $BACKUP_DATE"
echo "Current data will be overwritten!"
read -p "Are you sure? (yes/NO): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Starting restore process..."

# Stop services
echo "Stopping application services..."
systemctl stop gcmc-kaj

# Restore database
echo "Restoring PostgreSQL database..."
gunzip -c "$BACKUP_DIR/database-$BACKUP_DATE.sql.gz" | \
  docker exec -i gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production

# Restore Redis
echo "Restoring Redis data..."
docker cp "$BACKUP_DIR/redis-$BACKUP_DATE.rdb" gcmc-kaj-redis:/data/dump.rdb
docker restart gcmc-kaj-redis

# Restore MinIO
echo "Restoring MinIO data..."
docker exec gcmc-kaj-minio mc mirror \
  backup-bucket/minio-$BACKUP_DATE/ \
  /data/gcmc-prod/

# Start services
echo "Starting application services..."
systemctl start gcmc-kaj

# Validate restore
echo "Validating restore..."
sleep 30
./scripts/health-monitor.sh

echo "Restore completed successfully!"
```

---

## 🔄 Rollback Procedures

### Application Rollback

```bash
#!/bin/bash
# scripts/rollback-application.sh

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: $0 <previous_version>"
  echo "Example: $0 v1.0.5"
  exit 1
fi

echo "Rolling back to version: $PREVIOUS_VERSION"

# Rollback API
echo "Rolling back API service..."
docker service update \
  --image gcmc-kaj/api:$PREVIOUS_VERSION \
  --update-parallelism 1 \
  --update-delay 30s \
  gcmc-kaj-api

# Wait for health
./scripts/wait-for-health.sh api 3000

# Rollback worker
echo "Rolling back worker service..."
docker service update \
  --image gcmc-kaj/worker:$PREVIOUS_VERSION \
  gcmc-kaj-worker

# Rollback web
echo "Rolling back web service..."
docker service update \
  --image gcmc-kaj/web:$PREVIOUS_VERSION \
  --update-parallelism 1 \
  --update-delay 30s \
  gcmc-kaj-web

# Wait for health
./scripts/wait-for-health.sh web 3001

echo "Rollback completed to version: $PREVIOUS_VERSION"
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Service Won't Start

**Symptoms:**
- Docker container exits immediately
- Health checks fail
- Connection refused errors

**Diagnosis:**
```bash
# Check container logs
docker logs gcmc-kaj-api --tail 50

# Check resource usage
docker stats

# Check environment variables
docker exec gcmc-kaj-api env | grep -E "(DATABASE|REDIS|AUTH)"
```

**Solutions:**
- Verify environment variables
- Check database connectivity
- Ensure sufficient resources
- Validate SSL certificates

#### 2. Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- Authentication failures
- Connection pool exhausted

**Diagnosis:**
```bash
# Test database connection
docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production -c "SELECT 1"

# Check connection count
docker exec gcmc-kaj-postgres psql -U gcmc_user -d gcmc_production \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

**Solutions:**
- Restart PostgreSQL service
- Increase connection pool size
- Check firewall rules
- Verify credentials

#### 3. Redis Connectivity Problems

**Symptoms:**
- Cache misses
- Session issues
- Worker queue failures

**Diagnosis:**
```bash
# Test Redis connection
docker exec gcmc-kaj-redis redis-cli ping

# Check Redis memory usage
docker exec gcmc-kaj-redis redis-cli info memory
```

**Solutions:**
- Restart Redis service
- Check network connectivity
- Verify Redis password
- Clear Redis data if corrupted

#### 4. High Memory Usage

**Symptoms:**
- Out of memory errors
- Slow response times
- Container restarts

**Diagnosis:**
```bash
# Check memory usage
docker stats --no-stream

# Check application metrics
curl https://api.gcmc-kaj.com/metrics | grep memory
```

**Solutions:**
- Increase container memory limits
- Optimize database queries
- Clear Redis cache
- Restart services

#### 5. SSL/TLS Certificate Issues

**Symptoms:**
- Browser security warnings
- API connection failures
- Certificate expired errors

**Diagnosis:**
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/gcmc-kaj.com.pem -text -noout

# Test SSL connection
openssl s_client -connect api.gcmc-kaj.com:443
```

**Solutions:**
- Renew SSL certificates
- Update certificate configuration
- Restart load balancer
- Check certificate chain

---

## 📞 Emergency Contact Information

### Escalation Matrix

| Issue Severity | Primary Contact | Secondary Contact | Response Time |
|---------------|----------------|-------------------|---------------|
| **P1 - Critical** | DevOps Lead | Platform Architect | 15 minutes |
| **P2 - High** | Platform Engineer | Lead Developer | 1 hour |
| **P3 - Medium** | Development Team | Support Team | 4 hours |
| **P4 - Low** | Support Team | - | Next business day |

### Emergency Procedures

1. **Complete System Outage**
   - Activate incident response team
   - Check infrastructure status
   - Implement emergency rollback if needed
   - Communicate with stakeholders

2. **Data Loss/Corruption**
   - Stop all write operations
   - Activate backup restoration procedures
   - Engage database specialist
   - Document incident for post-mortem

3. **Security Breach**
   - Isolate affected systems
   - Engage security team
   - Preserve evidence
   - Implement containment measures

---

## 📋 Deployment Checklist

### Pre-Deployment (1 hour before)

- [ ] **Code freeze** - No new commits to main branch
- [ ] **Final tests** - All automated tests passing
- [ ] **Backup verification** - Recent backups available and tested
- [ ] **Team notification** - Deployment team standing by
- [ ] **Monitoring setup** - Extra monitoring enabled

### During Deployment (30-60 minutes)

- [ ] **Environment preparation** - Infrastructure ready
- [ ] **Database migration** - Schema updates applied
- [ ] **Service deployment** - Rolling update initiated
- [ ] **Health validation** - All services responding
- [ ] **Smoke testing** - Critical features verified

### Post-Deployment (30 minutes)

- [ ] **Performance monitoring** - Response times normal
- [ ] **Error monitoring** - No error spikes detected
- [ ] **Feature validation** - New features working correctly
- [ ] **User acceptance** - Stakeholder sign-off received
- [ ] **Documentation update** - Deployment recorded

---

**Runbook Version:** 1.0.0
**Platform Version:** 1.0.0
**Last Updated:** 2025-11-18
**Next Review:** 2025-12-18

For emergencies, contact: [devops@gcmc-kaj.com](mailto:devops@gcmc-kaj.com)