# Docker Deployment Guide

Complete guide for deploying and managing the GCMC-KAJ platform with Docker. This guide covers development, production deployment, scaling, monitoring, and troubleshooting.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Health Checks](#health-checks)
- [Scaling](#scaling)
- [Monitoring](#monitoring)
- [Backup and Restore](#backup-and-restore)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Security Best Practices](#security-best-practices)

## Architecture Overview

The application consists of 6 main services orchestrated with Docker Compose:

### Services

1. **PostgreSQL** (Port: 5432)
   - Primary relational database
   - Stores application data, users, documents, filings
   - Health check: `pg_isready`

2. **Redis** (Port: 6379)
   - Job queue backend (BullMQ)
   - Session storage and caching
   - Health check: `redis-cli ping`

3. **MinIO** (Ports: 9000, 9001)
   - S3-compatible object storage
   - Document file storage
   - Health check: HTTP endpoint

4. **API Server** (Port: 3000)
   - Hono + tRPC backend
   - RESTful and tRPC endpoints
   - Health endpoints: `/health`, `/ready`

5. **Web Application** (Port: 3001)
   - Next.js frontend
   - Server-side rendering
   - Health endpoint: `/api/health`

6. **Worker** (Port: 3002)
   - BullMQ background job processor
   - Scheduled tasks (compliance, notifications, filings)
   - Health endpoint: `/health` on port 3002

### Container Features

All application containers include:
- **Multi-stage builds**: Optimized for minimal image size
- **Non-root users**: Security-hardened
- **Signal handling**: Proper SIGTERM forwarding with tini
- **Health checks**: Automatic recovery and monitoring
- **Resource limits**: CPU and memory constraints
- **Log rotation**: Automatic log management

## Prerequisites

### Required Software

- **Docker Engine**: 20.10+ ([Install](https://docs.docker.com/engine/install/))
- **Docker Compose**: 2.0+ ([Install](https://docs.docker.com/compose/install/))

### System Requirements

- **RAM**: Minimum 8GB, recommended 16GB
- **Disk Space**: Minimum 20GB free
- **CPU**: 4+ cores recommended

### Verify Installation

```bash
docker --version
# Docker version 24.0.0+

docker-compose --version
# Docker Compose version v2.20.0+
```

## Quick Start

### Development Mode

```bash
# Clone repository
git clone <repository-url>
cd kaj-gcmc-bts

# Start infrastructure only
docker-compose up -d postgres redis minio

# Install dependencies and run locally
bun install
bun run db:push
bun dev
```

### Full Stack Mode

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Access Services

- **Web App**: http://localhost:3001
- **API Server**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **Worker Health**: http://localhost:3002/health

## Development Deployment

### Building Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build api
docker-compose build web
docker-compose build worker

# Build with no cache (clean build)
docker-compose build --no-cache

# Build with progress output
docker-compose build --progress=plain
```

### Starting Services

```bash
# Start all services (detached)
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis minio
docker-compose up -d api web worker

# Start with live logs (foreground)
docker-compose up

# Start single service
docker-compose up -d api
```

### Managing Services

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f              # All services
docker-compose logs -f api          # API only
docker-compose logs -f --tail=100   # Last 100 lines

# Restart services
docker-compose restart api
docker-compose restart worker

# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove volumes (⚠️ DATA LOSS)
docker-compose down -v
```

### Database Operations

```bash
# Run migrations
docker-compose exec api bun run db:push

# Generate Prisma client
docker-compose exec api bun run db:generate

# Open Prisma Studio
docker-compose exec api bun run db:studio

# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d gcmc_kaj

# Run SQL query
docker-compose exec postgres psql -U postgres -d gcmc_kaj -c "SELECT COUNT(*) FROM \"User\";"
```

### Debugging

```bash
# Execute shell in container
docker-compose exec api sh
docker-compose exec web sh
docker-compose exec worker sh

# View container stats
docker stats

# Inspect service configuration
docker-compose config

# View service details
docker inspect gcmc-kaj-api
```

## Production Deployment

### Step 1: Environment Configuration

Create a production `.env` file:

```bash
# Database
POSTGRES_DB=gcmc_kaj_prod
POSTGRES_USER=gcmc_admin
POSTGRES_PASSWORD=<generate-secure-password>

# Authentication (CRITICAL: Generate secure random value)
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=https://api.yourdomain.com

# MinIO
MINIO_ROOT_USER=<secure-username>
MINIO_ROOT_PASSWORD=<generate-secure-password>
MINIO_BUCKET_PREFIX=prod

# Application URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://app.yourdomain.com

# Docker Registry (optional)
DOCKER_REGISTRY=registry.yourdomain.com/gcmc-kaj
VERSION=1.0.0

# Data Storage
DATA_PATH=/var/lib/gcmc-kaj

# Scaling
API_REPLICAS=2
WEB_REPLICAS=2
WORKER_REPLICAS=1
```

### Step 2: Generate Secure Secrets

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32

# Generate passwords
openssl rand -base64 24

# Or use uuidgen
uuidgen
```

### Step 3: Prepare Data Directories

```bash
# Create data directories
sudo mkdir -p /var/lib/gcmc-kaj/{postgres,redis,minio}

# Set permissions
sudo chown -R $(whoami):$(whoami) /var/lib/gcmc-kaj

# Or use specific user
sudo chown -R 1001:1001 /var/lib/gcmc-kaj
```

### Step 4: Deploy with Production Config

```bash
# Deploy using production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View deployment status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Follow logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### Step 5: Initialize Database

```bash
# Run migrations
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec api bun run db:push

# Seed initial data (if needed)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec api bun run db:seed
```

### Step 6: Verify Deployment

```bash
# Check health endpoints
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/ready

# Check service status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View resource usage
docker stats
```

### Docker Swarm Deployment (Recommended for Production)

For high availability and automatic orchestration:

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml gcmc-kaj

# List services
docker service ls

# View service logs
docker service logs -f gcmc-kaj_api

# Scale services
docker service scale gcmc-kaj_api=5
docker service scale gcmc-kaj_web=3

# Update service
docker service update --image gcmc-kaj/api:1.1.0 gcmc-kaj_api

# Remove stack
docker stack rm gcmc-kaj
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | `secure_random_password_123` |
| `BETTER_AUTH_SECRET` | JWT signing secret (32+ chars) | `<openssl-rand-base64-32>` |
| `BETTER_AUTH_URL` | Auth service URL | `https://api.example.com` |
| `MINIO_ROOT_USER` | MinIO admin username | `minio_admin` |
| `MINIO_ROOT_PASSWORD` | MinIO admin password | `secure_password_456` |
| `NEXT_PUBLIC_API_URL` | API endpoint for frontend | `https://api.example.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `gcmc_kaj` |
| `POSTGRES_USER` | Database user | `postgres` |
| `DATA_PATH` | Host data directory | `./data` |
| `API_REPLICAS` | Number of API instances | `2` |
| `WEB_REPLICAS` | Number of web instances | `2` |
| `WORKER_REPLICAS` | Number of worker instances | `1` |
| `CORS_ORIGIN` | Allowed CORS origins | `` |
| `MINIO_REGION` | MinIO/S3 region | `us-east-1` |
| `MINIO_BUCKET_PREFIX` | Bucket name prefix | `tenant` |

### Development Variables

```bash
# .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gcmc_kaj
REDIS_URL=redis://localhost:6379
BETTER_AUTH_SECRET=dev-secret-change-in-production
BETTER_AUTH_URL=http://localhost:3000
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Health Checks

All services include comprehensive health monitoring.

### API Server Health Endpoints

**Liveness Check** (basic availability):
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T10:30:00.000Z"
}
```

**Readiness Check** (with dependency validation):
```bash
curl http://localhost:3000/ready
```

Response:
```json
{
  "status": "ready",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "checks": {
    "database": "connected"
  }
}
```

### Web Application Health

```bash
curl http://localhost:3001/api/health
```

### Worker Health

```bash
curl http://localhost:3002/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "workers": {
    "compliance": "active",
    "notifications": "active",
    "filings": "active"
  }
}
```

### Container Health Status

```bash
# View health status in docker-compose
docker-compose ps

# Inspect health details
docker inspect --format='{{json .State.Health}}' gcmc-kaj-api | jq

# View health logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' gcmc-kaj-api
```

## Scaling

### Horizontal Scaling with Docker Compose

```bash
# Scale API servers
docker-compose up -d --scale api=3

# Scale web servers
docker-compose up -d --scale web=2

# Scale workers
docker-compose up -d --scale worker=2

# Note: Requires load balancer for API/Web scaling
```

### Horizontal Scaling with Docker Swarm

```bash
# Scale services dynamically
docker service scale gcmc-kaj_api=5
docker service scale gcmc-kaj_web=3
docker service scale gcmc-kaj_worker=2

# Auto-scaling based on load (requires external orchestrator)
```

### Resource Limits

Services have configured resource constraints:

| Service | CPU Limit | Memory Limit | CPU Reserved | Memory Reserved |
|---------|-----------|--------------|--------------|-----------------|
| PostgreSQL | 2 cores | 2GB | 1 core | 1GB |
| Redis | 1 core | 512MB | 0.5 core | 256MB |
| MinIO | 2 cores | 2GB | 1 core | 1GB |
| API | 2 cores | 2GB | 1 core | 1GB |
| Web | 2 cores | 2GB | 1 core | 1GB |
| Worker | 2 cores | 2GB | 0.5 core | 512MB |

### Adjusting Resource Limits

Edit `docker-compose.prod.yml`:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '4'        # Increase CPU limit
          memory: 4G       # Increase memory limit
        reservations:
          cpus: '2'
          memory: 2G
```

## Monitoring

### Log Management

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f api

# Last N lines
docker-compose logs --tail=100 api

# Since specific time
docker-compose logs --since 30m api

# Export logs to file
docker-compose logs --no-color > application.log

# Follow logs with timestamps
docker-compose logs -f -t
```

### Resource Monitoring

```bash
# Real-time resource usage
docker stats

# Specific containers only
docker stats gcmc-kaj-api gcmc-kaj-web gcmc-kaj-worker

# Single snapshot
docker stats --no-stream

# With custom format
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Log Rotation

Automatic log rotation is configured:

**Development**:
- Max file size: 10MB
- Max files: 3
- Total: ~30MB per service

**Production**:
- Max file size: 100MB
- Max files: 5
- Compression: Enabled
- Total: ~500MB per service

## Backup and Restore

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres gcmc_kaj > backup-$(date +%Y%m%d).sql

# Create compressed backup
docker-compose exec postgres pg_dump -U postgres gcmc_kaj | gzip > backup-$(date +%Y%m%d).sql.gz

# Backup specific schema
docker-compose exec postgres pg_dump -U postgres -n public gcmc_kaj > backup-public.sql

# Automated daily backups (crontab)
0 2 * * * cd /path/to/kaj-gcmc-bts && docker-compose exec -T postgres pg_dump -U postgres gcmc_kaj | gzip > /backups/gcmc-$(date +\%Y\%m\%d).sql.gz
```

### Database Restore

```bash
# Stop application services
docker-compose stop api web worker

# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres gcmc_kaj

# Restore from compressed backup
gunzip < backup.sql.gz | docker-compose exec -T postgres psql -U postgres gcmc_kaj

# Restart application services
docker-compose start api web worker
```

### Volume Backup

```bash
# Backup PostgreSQL volume
docker run --rm \
  -v gcmc-kaj_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-$(date +%Y%m%d).tar.gz /data

# Backup MinIO volume
docker run --rm \
  -v gcmc-kaj_minio_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/minio-$(date +%Y%m%d).tar.gz /data

# Restore volume
docker run --rm \
  -v gcmc-kaj_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/postgres-20251115.tar.gz -C /
```

### MinIO Backup

```bash
# Using MinIO client inside container
docker-compose exec minio mc mirror /data/tenant-1-documents /backups/tenant-1

# Export bucket to local
docker-compose exec minio mc cp --recursive /data/tenant-1-documents /backups/
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs service-name

# Check container exit code
docker-compose ps

# Inspect container
docker inspect gcmc-kaj-service

# Check resource availability
docker system df
docker system info

# Rebuild service
docker-compose up -d --force-recreate service-name

# Clean rebuild
docker-compose build --no-cache service-name
docker-compose up -d service-name
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres pg_isready -U postgres

# Verify connectivity from API
docker-compose exec api sh -c 'bunx prisma db pull'

# Check DATABASE_URL format
# Correct: postgresql://user:password@postgres:5432/gcmc_kaj
```

### Redis Connection Issues

```bash
# Test Redis connectivity
docker-compose exec redis redis-cli ping

# Check Redis info
docker-compose exec redis redis-cli info

# View connected clients
docker-compose exec redis redis-cli client list

# Monitor Redis commands
docker-compose exec redis redis-cli monitor
```

### MinIO Connection Issues

```bash
# Check MinIO status
docker-compose ps minio

# View MinIO logs
docker-compose logs minio

# Access MinIO console
# http://localhost:9001 (minioadmin/minioadmin)

# Verify buckets
docker-compose exec minio mc ls local
```

### Worker Not Processing Jobs

```bash
# Check worker logs
docker-compose logs -f worker

# Verify worker is healthy
curl http://localhost:3002/health

# Check Redis connectivity
docker-compose exec worker sh -c 'bunx redis-cli -u $REDIS_URL ping'

# View worker database connection
docker-compose exec worker sh -c 'bunx prisma db pull'
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory

# Adjust service limits in docker-compose.prod.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 4G  # Increase from 2G
```

### Build Failures

```bash
# Clean Docker build cache
docker builder prune

# Remove all build cache
docker builder prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check .dockerignore exists
cat .dockerignore

# Verify disk space
docker system df
df -h
```

### Permission Issues

```bash
# Fix data directory permissions
sudo chown -R $(whoami):$(whoami) ./data

# For production
sudo chown -R $(whoami):$(whoami) /var/lib/gcmc-kaj

# Container user mismatch (view UIDs)
docker-compose exec api id
docker-compose exec web id
docker-compose exec worker id
```

### Complete Reset

```bash
# Stop all containers
docker-compose down

# Remove volumes (⚠️ DATA LOSS)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean entire system
docker system prune -a --volumes

# Rebuild and start
docker-compose build
docker-compose up -d
```

## Performance Optimization

### Docker Build Optimization

1. **Layer Caching**: Dockerfiles are structured to maximize cache hits
2. **.dockerignore**: Reduces build context size (~90% reduction)
3. **Multi-stage Builds**: Minimal runtime images
4. **Parallel Builds**: Build multiple images simultaneously

```bash
# Build all images in parallel
docker-compose build

# Enable BuildKit for better caching
DOCKER_BUILDKIT=1 docker-compose build
```

### Image Sizes

Optimized image sizes (compressed):

- **API Server**: ~300MB
- **Web Application**: ~350MB
- **Worker**: ~300MB

### Network Optimization

Production uses isolated networks:

- **Frontend Network**: Web ↔ API (172.20.0.0/24)
- **Backend Network**: API/Worker ↔ Database/Redis/MinIO (172.21.0.0/24)

### Database Optimization

Connection pooling configured in DATABASE_URL:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
```

### Redis Optimization

Production configuration:
- Memory limit: 256MB
- Eviction policy: allkeys-lru
- Persistence: AOF with everysec fsync

```yaml
services:
  redis:
    command: >
      redis-server
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --appendonly yes
      --appendfsync everysec
```

## Security Best Practices

### 1. Secrets Management

- Never commit `.env` files to version control
- Use Docker secrets or external secret managers (Vault, AWS Secrets Manager)
- Rotate secrets regularly (quarterly recommended)
- Use strong random values (32+ characters)

```bash
# Generate secure secrets
openssl rand -base64 32
openssl rand -hex 32
```

### 2. Network Security

- Use reverse proxy (nginx/Traefik) for SSL/TLS termination
- Restrict database/Redis to internal networks only
- Enable firewall rules on host
- Use VPC in cloud deployments

Example nginx reverse proxy:

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/ssl/certs/api.example.com.crt;
    ssl_certificate_key /etc/ssl/private/api.example.com.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Container Security

- All containers run as non-root users
- Read-only root filesystems where possible
- Minimal attack surface with multi-stage builds
- Regular security updates to base images

### 4. Data Security

- Regular automated backups
- Encrypted volumes in production
- Backup testing and validation
- Disaster recovery plan

### 5. Updates and Patching

```bash
# Pull latest code
git pull origin main

# Rebuild images with latest security patches
docker-compose build --pull

# Rolling update (zero downtime)
docker-compose up -d --no-deps --build api
docker-compose up -d --no-deps --build web
docker-compose up -d --no-deps --build worker
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Docker Swarm Tutorial](https://docs.docker.com/engine/swarm/swarm-tutorial/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Project README](./README.md)

## Support

For issues or questions:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review service logs: `docker-compose logs -f`
3. Verify health checks: `curl http://localhost:3000/health`
4. Check service status: `docker-compose ps`
5. Create an issue in the repository
6. Contact the development team

---

**Version**: 1.0.0
**Last Updated**: 2025-11-15
**Maintained By**: GCMC-KAJ Development Team
