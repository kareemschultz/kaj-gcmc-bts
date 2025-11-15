# Docker Deployment Guide

Complete guide for running KAJ-GCMC platform with Docker.

## Quick Start

### Development Mode

Start infrastructure only (apps run locally):
```bash
docker compose up -d postgres redis minio
bun install
bun db:push
bun dev
```

### Full Stack Mode

Start everything in containers:
```bash
docker compose up --build
```

Visit:
- **Web App**: http://localhost:3001
- **API**: http://localhost:3000
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)

## Services Overview

### Infrastructure Services

#### PostgreSQL
- **Port**: 5432
- **Database**: gcmc_kaj
- **User**: postgres
- **Password**: postgres (change in production)
- **Volume**: postgres_data

#### Redis
- **Port**: 6379
- **Volume**: redis_data
- **Purpose**: BullMQ job queue backend

#### MinIO
- **API Port**: 9000
- **Console Port**: 9001
- **Credentials**: minioadmin / minioadmin (change in production)
- **Volume**: minio_data
- **Purpose**: S3-compatible object storage for documents

### Application Services

#### API Server
- **Port**: 3000
- **Image**: Built from apps/server/Dockerfile
- **Purpose**: Hono + tRPC backend
- **Health Check**: GET /health
- **Depends on**: postgres, redis, minio

#### Web App
- **Port**: 3001
- **Image**: Built from apps/web/Dockerfile
- **Purpose**: Next.js frontend
- **Depends on**: api, postgres

#### Worker
- **No exposed ports**
- **Image**: Built from apps/worker/Dockerfile
- **Purpose**: BullMQ background jobs
- **Jobs**:
  - Compliance refresh (daily at 2 AM)
  - Expiry notifications (daily at 8 AM)
  - Filing reminders (daily at 9 AM)
- **Depends on**: postgres, redis

## Docker Commands

### Build & Start

```bash
# Build all images
docker compose build

# Build single service
docker compose build api
docker compose build web
docker compose build worker

# Start all services
docker compose up -d

# Start specific services
docker compose up -d postgres redis minio
docker compose up -d api web worker

# Start with live logs
docker compose up
```

### Manage Services

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f           # All services
docker compose logs -f api       # API only
docker compose logs -f worker    # Worker only

# Restart services
docker compose restart api
docker compose restart worker

# Stop services
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove volumes (⚠️ data loss)
docker compose down -v
```

### Database Operations

```bash
# Run migrations inside container
docker compose exec api bun db:push

# Access Prisma Studio
docker compose exec api bun db:studio

# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d gcmc_kaj

# Backup database
docker compose exec postgres pg_dump -U postgres gcmc_kaj > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U postgres gcmc_kaj
```

### Debugging

```bash
# Execute command in container
docker compose exec api sh
docker compose exec web sh
docker compose exec worker sh

# View container resource usage
docker stats

# Inspect service configuration
docker compose config

# View service health
docker compose ps
```

## Environment Configuration

### Development (.env.local)

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gcmc_kaj

# Auth
BETTER_AUTH_SECRET=dev-secret-change-in-production
BETTER_AUTH_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_REGION=us-east-1

# App URLs
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Production (.env.production)

```bash
# Database (use managed PostgreSQL)
DATABASE_URL=postgresql://user:password@db.example.com:5432/gcmc_kaj

# Auth (CRITICAL: Use strong random secret)
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=https://api.yourdomain.com

# Redis (use managed Redis)
REDIS_URL=redis://redis.example.com:6379

# MinIO/S3 (use AWS S3 or managed MinIO)
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=<aws-access-key>
MINIO_SECRET_KEY=<aws-secret-key>
MINIO_REGION=us-east-1

# App URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Optional: Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@yourdomain.com
SMTP_PASSWORD=<smtp-password>
SMTP_FROM=noreply@yourdomain.com
```

## Production Deployment

### Prerequisites

1. **Server Requirements**:
   - Docker 24+ and Docker Compose V2
   - 4GB+ RAM recommended
   - 20GB+ disk space

2. **Generate Secrets**:
   ```bash
   # Generate BETTER_AUTH_SECRET
   openssl rand -base64 32
   ```

3. **Set up Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

### Deployment Steps

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd GCMC-KAJ
   ```

2. **Configure Environment**:
   ```bash
   nano .env  # Set production values
   ```

3. **Build Images**:
   ```bash
   docker compose build
   ```

4. **Start Services**:
   ```bash
   docker compose up -d
   ```

5. **Run Database Migrations**:
   ```bash
   docker compose exec api bun db:push
   ```

6. **Verify Services**:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

7. **Health Checks**:
   ```bash
   curl http://localhost:3000/health  # API
   curl http://localhost:3001         # Web
   ```

### Production docker-compose.yml

For production, create `docker-compose.prod.yml`:

```yaml
version: "3.9"

services:
  api:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL}
      REDIS_URL: ${REDIS_URL}
      MINIO_ENDPOINT: ${MINIO_ENDPOINT}
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      - api

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: gcmc_kaj
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups  # For backup storage
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--pass", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

Run with:
```bash
docker compose -f docker-compose.prod.yml up -d
```

## Security Best Practices

### 1. Secrets Management
- Never commit `.env` files
- Use Docker secrets or environment variables
- Rotate secrets regularly
- Use strong random values for `BETTER_AUTH_SECRET`

### 2. Network Security
- Use reverse proxy (nginx/Traefik) for SSL/TLS
- Restrict PostgreSQL/Redis to internal network
- Enable firewall rules
- Use VPC in cloud deployments

### 3. Data Persistence
- Regular database backups
- Volume backups before major updates
- Test restore procedures

### 4. Updates
```bash
# Pull latest code
git pull

# Rebuild images
docker compose build

# Rolling update
docker compose up -d --no-deps --build api
docker compose up -d --no-deps --build web
docker compose up -d --no-deps --build worker
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs api

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Test connection
docker compose exec postgres pg_isready -U postgres

# Verify DATABASE_URL format
# Should be: postgresql://user:password@postgres:5432/gcmc_kaj
```

### MinIO Connection Issues

```bash
# Check MinIO is running
docker compose ps minio

# Access MinIO console
# Visit http://localhost:9001

# Verify buckets exist
docker compose exec minio mc ls local
```

### Worker Not Processing Jobs

```bash
# Check worker logs
docker compose logs -f worker

# Verify Redis connection
docker compose exec redis redis-cli ping

# Check job queues
docker compose exec worker bun run -e "
import { Queue } from 'bullmq';
import Redis from 'ioredis';
const connection = new Redis(process.env.REDIS_URL);
const queue = new Queue('compliance-refresh', { connection });
const jobs = await queue.getJobs();
console.log('Jobs:', jobs.length);
"
```

### Memory Issues

```bash
# Check resource usage
docker stats

# Limit container memory (in docker-compose.yml)
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
```

## Monitoring

### Health Checks

API health endpoint:
```bash
curl http://localhost:3000/health
```

### Logs

```bash
# Follow all logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Specific service
docker compose logs -f worker

# Export logs
docker compose logs > app.log
```

### Metrics

Consider adding:
- Prometheus for metrics collection
- Grafana for visualization
- Loki for log aggregation

## Backup & Restore

### Database Backup

```bash
# Create backup
docker compose exec postgres pg_dump -U postgres gcmc_kaj > backup-$(date +%Y%m%d).sql

# Automated daily backups (cron)
0 2 * * * cd /path/to/GCMC-KAJ && docker compose exec -T postgres pg_dump -U postgres gcmc_kaj > /backups/gcmc-$(date +\%Y\%m\%d).sql
```

### Database Restore

```bash
# Stop applications
docker compose stop api web worker

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U postgres gcmc_kaj

# Restart applications
docker compose start api web worker
```

### MinIO Backup

```bash
# Backup MinIO data
docker compose exec minio mc mirror local/tenant-1-documents /backups/minio/tenant-1-documents

# Or backup volume
docker run --rm -v gcmc-kaj_minio_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/minio-backup.tar.gz /data
```

## Scaling

### Horizontal Scaling

```bash
# Scale workers
docker compose up -d --scale worker=3

# Scale API (requires load balancer)
docker compose up -d --scale api=3
```

### Resource Limits

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Migration from Development to Production

1. **Backup Development Data**:
   ```bash
   docker compose exec postgres pg_dump -U postgres gcmc_kaj > dev-backup.sql
   ```

2. **Set Up Production Environment**:
   - Configure `.env` with production values
   - Set up managed PostgreSQL, Redis
   - Configure S3 or managed MinIO

3. **Deploy Production Stack**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Restore Data** (if needed):
   ```bash
   cat dev-backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres gcmc_kaj
   ```

5. **Verify**:
   - Test API endpoints
   - Test web app
   - Monitor worker logs
   - Check job processing

## Support

For issues:
1. Check logs: `docker compose logs`
2. Verify environment variables
3. Check service health: `docker compose ps`
4. Review this guide's troubleshooting section
5. Contact development team

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Better-T Stack Docs](https://better-t-stack.com/)
- Project README.md
