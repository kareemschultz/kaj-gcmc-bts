# GCMC-KAJ Platform Deployment Guide

**Last Updated:** 2025-11-16
**Version:** 1.0.0

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Docker Services](#docker-services)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Scaling Considerations](#scaling-considerations)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

## Overview

The GCMC-KAJ Platform is containerized using **Docker** and orchestrated with **Docker Compose**. The platform supports both development and production deployment configurations.

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Load Balancer                        │
│                      (Nginx/Traefik/etc.)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼──────┐              ┌───────▼──────┐
│   Web App    │              │  API Server  │
│  (Port 3001) │              │ (Port 3000)  │
│   Replicas   │              │   Replicas   │
└───────┬──────┘              └───────┬──────┘
        │                             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼──────┐  ┌──────▼──────┐  ┌─▼─────────┐
│  PostgreSQL  │  │    Redis    │  │   MinIO   │
│  (Port 5432) │  │ (Port 6379) │  │(Port 9000)│
└──────────────┘  └─────────────┘  └───────────┘
                       │
                ┌──────▼──────┐
                │   Worker    │
                │ (Port 3002) │
                └─────────────┘
```

### Service Communication

- **Frontend Network:** Web ↔ API
- **Backend Network:** API ↔ Databases
- **Isolation:** Services on separate networks

## Prerequisites

### Development

- **Bun:** v1.2.18 or higher
- **Docker:** v20.10 or higher
- **Docker Compose:** v2.0 or higher
- **Git:** Latest version

### Production

- **Docker:** v20.10 or higher
- **Docker Compose:** v2.0 or higher (or Docker Swarm)
- **Reverse Proxy:** Nginx, Traefik, or Caddy
- **SSL Certificates:** Let's Encrypt or commercial CA
- **Domain Names:** Configured DNS records

### Recommended Server Specifications

**Minimum (Development):**
- 2 vCPUs
- 4GB RAM
- 20GB Storage
- Ubuntu 22.04 LTS

**Recommended (Production):**
- 4+ vCPUs
- 8GB+ RAM
- 100GB+ SSD Storage
- Ubuntu 22.04 LTS or Debian 12

**Scaling (Production):**
- 8+ vCPUs
- 16GB+ RAM
- 500GB+ SSD Storage
- Load balancer
- Separate database server

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd kaj-gcmc-bts
```

### 2. Install Bun (Development Only)

```bash
curl -fsSL https://bun.sh/install | bash
bun --version  # Should be 1.2.18+
```

### 3. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env  # or vim, code, etc.
```

**Critical Variables to Set:**

```bash
# Database
POSTGRES_PASSWORD="<strong-password>"

# Authentication
BETTER_AUTH_SECRET="<generate-with-openssl>"
BETTER_AUTH_URL="https://your-domain.com"

# MinIO
MINIO_ROOT_USER="<admin-username>"
MINIO_ROOT_PASSWORD="<strong-password>"

# Email (Production)
EMAIL_PROVIDER="resend"  # or "smtp"
RESEND_API_KEY="<your-api-key>"
```

**Generate Secure Secrets:**

```bash
# Generate Better-Auth secret
openssl rand -base64 32

# Generate strong password
openssl rand -base64 24
```

## Development Deployment

### Quick Start

```bash
# Install dependencies
bun install

# Start infrastructure services
docker compose up -d

# Run database migrations
bun run db:push

# Start development servers
bun run dev
```

**Services will be available at:**
- API Server: http://localhost:3000
- Web App: http://localhost:3001
- Client Portal: http://localhost:3002
- MinIO Console: http://localhost:9001
- Prisma Studio: Run `bun run db:studio`

### Development Workflow

```bash
# Start all services in development mode
bun run dev

# Or start individual services
bun run dev:web      # Web app only
bun run dev:server   # API server only
bun run dev:worker   # Worker only

# Database operations
bun run db:push      # Push schema changes
bun run db:studio    # Open Prisma Studio
bun run db:migrate   # Create migration

# Docker operations
bun run docker:up    # Start infrastructure
bun run docker:down  # Stop infrastructure
bun run docker:logs  # View logs
```

### Development Docker Compose

**File:** `docker-compose.yml`

**Services:**
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO (ports 9000, 9001)
- MinIO Setup (one-time bucket creation)

**Volumes:**
- `postgres_data` - Database data
- `redis_data` - Redis persistence
- `minio_data` - File storage

## Production Deployment

### Pre-Deployment Checklist

- [ ] Server provisioned with required specs
- [ ] Docker and Docker Compose installed
- [ ] SSL certificates obtained
- [ ] DNS records configured
- [ ] Environment variables configured
- [ ] Backup strategy planned
- [ ] Monitoring setup prepared

### Production Deployment Steps

#### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

#### 2. Clone and Configure

```bash
# Clone repository
git clone <repository-url>
cd kaj-gcmc-bts

# Create production environment file
cp .env.example .env.production

# Edit production variables
nano .env.production
```

#### 3. Build Images

```bash
# Build all production images
docker compose -f docker-compose.prod.yml build

# Or build specific service
docker compose -f docker-compose.prod.yml build api
docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml build worker
```

#### 4. Run Database Migrations

```bash
# Start database only
docker compose -f docker-compose.prod.yml up -d postgres

# Wait for database to be ready
sleep 10

# Run migrations
docker compose -f docker-compose.prod.yml run --rm api bun run db:migrate deploy
```

#### 5. Start All Services

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

#### 6. Verify Deployment

```bash
# Check health endpoints
curl http://localhost:3000/health  # API
curl http://localhost:3001/api/health  # Web
curl http://localhost:3002/health  # Worker

# Check database connection
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d gcmc_kaj -c "SELECT 1;"

# Check Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

### Production Docker Compose

**File:** `docker-compose.prod.yml`

**Key Features:**
- Resource limits and reservations
- Health checks on all services
- Restart policies
- Logging configuration
- Network isolation
- Service replicas support

**Service Replicas:**
```bash
# Configure in .env.production
API_REPLICAS=2      # API server instances
WEB_REPLICAS=2      # Web app instances
WORKER_REPLICAS=1   # Worker instances
```

## Docker Services

### PostgreSQL

**Image:** `postgres:16-alpine`

**Configuration:**
- Database: `gcmc_kaj`
- Port: 5432
- Encoding: UTF-8
- Max connections: 100 (default)

**Resource Limits (Production):**
- CPU: 2 cores max, 1 core reserved
- Memory: 2GB max, 1GB reserved

**Volumes:**
- `postgres_data:/var/lib/postgresql/data`

**Health Check:**
```bash
pg_isready -U postgres -d gcmc_kaj
```

### Redis

**Image:** `redis:7-alpine`

**Configuration:**
- Port: 6379
- Max memory: 256MB (production)
- Eviction policy: allkeys-lru
- Persistence: AOF enabled

**Resource Limits (Production):**
- CPU: 1 core max, 0.5 cores reserved
- Memory: 512MB max, 256MB reserved

**Volumes:**
- `redis_data:/data`

**Health Check:**
```bash
redis-cli ping
```

### MinIO

**Image:** `minio/minio:latest`

**Configuration:**
- API Port: 9000
- Console Port: 9001
- Storage: `/data`

**Resource Limits (Production):**
- CPU: 2 cores max, 1 core reserved
- Memory: 2GB max, 1GB reserved

**Volumes:**
- `minio_data:/data`

**Health Check:**
```bash
curl -f http://localhost:9000/minio/health/live
```

**Bucket Structure:**
```
tenant-1-documents/
tenant-2-documents/
tenant-N-documents/
```

### API Server

**Image:** Custom build from `apps/server/Dockerfile`

**Configuration:**
- Port: 3000
- Runtime: Bun
- Framework: Hono + tRPC

**Resource Limits (Production):**
- CPU: 2 cores max, 1 core reserved
- Memory: 2GB max, 1GB reserved

**Replicas:** 2 (configurable via `API_REPLICAS`)

**Health Check:**
```bash
curl -f http://localhost:3000/health
```

### Web App

**Image:** Custom build from `apps/web/Dockerfile`

**Configuration:**
- Port: 3001
- Framework: Next.js 16
- Mode: Production build

**Resource Limits (Production):**
- CPU: 2 cores max, 1 core reserved
- Memory: 2GB max, 1GB reserved

**Replicas:** 2 (configurable via `WEB_REPLICAS`)

**Health Check:**
```bash
curl -f http://localhost:3001/api/health
```

### Worker

**Image:** Custom build from `apps/worker/Dockerfile`

**Configuration:**
- Health Port: 3002
- Queue: BullMQ
- Redis: Connection to redis:6379

**Resource Limits (Production):**
- CPU: 2 cores max, 0.5 cores reserved
- Memory: 2GB max, 512MB reserved

**Replicas:** 1 (configurable via `WORKER_REPLICAS`)

**Health Check:**
```bash
curl -f http://localhost:3002/health
```

## Environment Variables

### Required Variables (Production)

```bash
# ========================================
# Database
# ========================================
POSTGRES_DB=gcmc_kaj
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<REQUIRED>  # Strong password
DATABASE_URL=postgresql://postgres:<password>@postgres:5432/gcmc_kaj

# ========================================
# Authentication
# ========================================
BETTER_AUTH_SECRET=<REQUIRED>  # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=<REQUIRED>     # https://your-domain.com
CORS_ORIGIN=<REQUIRED>         # https://app.your-domain.com

# ========================================
# MinIO
# ========================================
MINIO_ROOT_USER=<REQUIRED>     # Admin username
MINIO_ROOT_PASSWORD=<REQUIRED> # Strong password (min 8 chars)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false  # true if behind SSL proxy
MINIO_REGION=us-east-1
MINIO_BUCKET_PREFIX=tenant

# ========================================
# Redis
# ========================================
REDIS_URL=redis://redis:6379

# ========================================
# Application
# ========================================
NODE_ENV=production
NEXT_PUBLIC_API_URL=<REQUIRED>  # https://api.your-domain.com
PORTAL_URL=<REQUIRED>           # https://portal.your-domain.com
SUPPORT_EMAIL=<REQUIRED>        # support@your-domain.com

# ========================================
# Email (Choose provider)
# ========================================
EMAIL_PROVIDER=resend  # or "smtp" or "log"

# If using Resend:
RESEND_API_KEY=<REQUIRED>

# If using SMTP:
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=<username>
SMTP_PASS=<password>
SMTP_FROM=noreply@your-domain.com

# ========================================
# Scaling (Optional)
# ========================================
API_REPLICAS=2
WEB_REPLICAS=2
WORKER_REPLICAS=1

# ========================================
# Docker Registry (Optional)
# ========================================
DOCKER_REGISTRY=your-registry.azurecr.io
VERSION=v1.0.0
```

### Optional Variables

```bash
# Feature flags
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_COMPLIANCE_ENGINE=true
ENABLE_ANALYTICS=true

# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Health check port for worker
HEALTH_PORT=3002
```

### Environment Variable Loading

**Development:**
```bash
# Loads from .env automatically
bun run dev
```

**Production:**
```bash
# Load from .env.production
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

## Database Migrations

### Development Migrations

```bash
# Create migration
bun run db:migrate

# Push schema without migration (dev only)
bun run db:push

# Reset database (WARNING: deletes all data)
bun run db:migrate reset
```

### Production Migrations

```bash
# 1. Generate migration (on development machine)
cd packages/db
bun run db:migrate dev --name add_feature

# 2. Commit migration files
git add prisma/migrations
git commit -m "Add database migration"
git push

# 3. Deploy to production server
git pull

# 4. Run migration
docker compose -f docker-compose.prod.yml run --rm api \
  bunx prisma migrate deploy

# 5. Restart services
docker compose -f docker-compose.prod.yml restart api web worker
```

### Migration Best Practices

**Pre-Deployment:**
1. Review migration SQL
2. Test on staging environment
3. Backup database
4. Plan rollback strategy

**During Deployment:**
1. Enable maintenance mode
2. Run migration
3. Verify data integrity
4. Restart services
5. Disable maintenance mode

**Rollback Plan:**
1. Restore from backup
2. Revert code deployment
3. Verify system state

## Scaling Considerations

### Horizontal Scaling

**API Server:**
```bash
# Scale to 4 instances
docker compose -f docker-compose.prod.yml up -d --scale api=4

# Or set in .env.production
API_REPLICAS=4
```

**Web App:**
```bash
# Scale to 4 instances
docker compose -f docker-compose.prod.yml up -d --scale web=4

# Or set in .env.production
WEB_REPLICAS=4
```

**Worker:**
```bash
# Scale to 2 instances for higher throughput
docker compose -f docker-compose.prod.yml up -d --scale worker=2

# Or set in .env.production
WORKER_REPLICAS=2
```

### Load Balancing

**Nginx Configuration Example:**

```nginx
upstream api_backend {
    least_conn;
    server localhost:3000 max_fails=3 fail_timeout=30s;
}

upstream web_backend {
    least_conn;
    server localhost:3001 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;

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
    }
}
```

### Database Scaling

**Connection Pooling:**
```
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
```

**Read Replicas:**
- Configure PostgreSQL streaming replication
- Direct read queries to replicas
- Write queries to primary

**Vertical Scaling:**
```yaml
postgres:
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 8G
```

### Caching Strategy

**Redis Caching:**
- Dashboard statistics
- Analytics aggregations
- Frequently accessed reference data

**CDN Integration:**
- Static assets (Next.js)
- Document downloads (MinIO with CloudFront/CloudFlare)

## Monitoring & Logging

### Health Checks

**API Server:**
```bash
curl http://localhost:3000/health
# Response: {"status": "ok"}
```

**Database:**
```bash
docker compose exec postgres pg_isready
```

**Redis:**
```bash
docker compose exec redis redis-cli ping
```

### Logging

**View Logs:**
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 api
```

**Log Configuration:**
- **Driver:** json-file
- **Max Size:** 100MB (apps), 50MB (infrastructure)
- **Max Files:** 5
- **Compression:** Enabled (production)

**Log Aggregation (Recommended):**
- **ELK Stack:** Elasticsearch + Logstash + Kibana
- **Grafana Loki:** Lightweight log aggregation
- **CloudWatch Logs:** AWS native solution

### Monitoring Tools

**Recommended Stack:**
- **Prometheus:** Metrics collection
- **Grafana:** Visualization
- **AlertManager:** Alerting

**Key Metrics:**
- CPU and memory usage
- Request latency
- Error rates
- Database connection pool
- Queue lengths
- Disk usage

## Backup & Recovery

### Database Backup

**Automated Backup (Daily):**

```bash
#!/bin/bash
# /etc/cron.daily/backup-gcmc-db

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="gcmc_kaj_${DATE}.sql.gz"

# Create backup
docker compose exec -T postgres pg_dump -U postgres gcmc_kaj | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 30 days
find ${BACKUP_DIR} -name "gcmc_kaj_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" s3://your-bucket/backups/
```

**Manual Backup:**

```bash
# Backup database
docker compose exec postgres pg_dump -U postgres gcmc_kaj > backup.sql

# Compressed backup
docker compose exec postgres pg_dump -U postgres gcmc_kaj | gzip > backup.sql.gz
```

**Restore from Backup:**

```bash
# Stop applications
docker compose -f docker-compose.prod.yml stop api web worker

# Restore database
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U postgres gcmc_kaj

# Restart applications
docker compose -f docker-compose.prod.yml start api web worker
```

### File Storage Backup

**MinIO Backup:**

```bash
# Backup MinIO data
docker compose exec minio mc mirror /data /backup/minio-data

# Or backup volume
docker run --rm -v gcmc_minio_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/minio-backup.tar.gz /data
```

### Disaster Recovery Plan

**RPO (Recovery Point Objective):** 24 hours
**RTO (Recovery Time Objective):** 4 hours

**Recovery Steps:**
1. Provision new server
2. Install Docker and Docker Compose
3. Clone repository
4. Restore environment variables
5. Restore database from backup
6. Restore MinIO data
7. Start all services
8. Verify functionality
9. Update DNS records

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check service status
docker compose -f docker-compose.prod.yml ps

# Restart specific service
docker compose -f docker-compose.prod.yml restart api
```

#### Database Connection Errors

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check database health
docker compose exec postgres pg_isready

# Check connection string
docker compose exec api env | grep DATABASE_URL

# Test connection manually
docker compose exec postgres psql -U postgres -d gcmc_kaj -c "SELECT 1;"
```

#### Redis Connection Errors

```bash
# Check Redis is running
docker compose ps redis

# Test Redis connection
docker compose exec redis redis-cli ping

# Check memory usage
docker compose exec redis redis-cli info memory
```

#### MinIO Upload Failures

```bash
# Check MinIO is running
docker compose ps minio

# Check bucket permissions
docker compose exec minio mc ls myminio/

# Verify credentials
docker compose exec minio mc admin info myminio
```

#### High Memory Usage

```bash
# Check container resource usage
docker stats

# Check PostgreSQL connections
docker compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis memory
docker compose exec redis redis-cli info memory

# Restart services with memory issues
docker compose -f docker-compose.prod.yml restart <service>
```

### Debug Mode

**Enable Debug Logging:**

```bash
# Set in .env
LOG_LEVEL=debug

# Restart services
docker compose -f docker-compose.prod.yml restart
```

**Access Container Shell:**

```bash
# API server
docker compose exec api sh

# Database
docker compose exec postgres bash

# Redis
docker compose exec redis sh
```

### Performance Issues

**Database Slow Queries:**

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 1 second
SELECT pg_reload_conf();

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

**API Latency:**

```bash
# Check API response time
time curl http://localhost:3000/health

# Monitor tRPC calls with React Query DevTools
# Available at: http://localhost:3001 (development)
```

## Cross-References

- **Project Structure:** See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- **Technology Stack:** See [TECH_STACK.md](./TECH_STACK.md)
- **API Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Database Schema:** See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
