# 🚀 Deployment Guide - GCMC-KAJ System

Complete guide to deploy and run your GCMC-KAJ enterprise SaaS platform.

## Quick Start (Local Development)

### 1. Prerequisites
```bash
# Ensure you have these installed:
- Bun >= 1.1.38
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)
- MinIO (or use Docker)
```

### 2. Start Infrastructure with Docker

```bash
# Start all services (PostgreSQL, Redis, MinIO)
docker compose up -d postgres redis minio

# Wait for services to be ready (~10 seconds)
docker compose ps
```

### 3. Set Up Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values:
DATABASE_URL="postgresql://postgres:password@localhost:5432/gcmc"
REDIS_URL="redis://localhost:6379"
BETTER_AUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
CORS_ORIGIN="http://localhost:3001"
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"
```

### 4. Install Dependencies & Build

```bash
# Install all dependencies
bun install

# Generate Prisma client
bun db:generate

# Run database migrations
bun db:push

# Build all packages
bun run build
```

### 5. Seed Database (Optional)

```bash
# Seed with sample data
bun db:seed
```

### 6. Run the Applications

**Option A: Run all apps concurrently**
```bash
bun run dev
```

**Option B: Run each app separately**

```bash
# Terminal 1: API Server
cd apps/server && bun run dev  # http://localhost:3000

# Terminal 2: Web Admin App
cd apps/web && bun run dev     # http://localhost:3001

# Terminal 3: Client Portal
cd apps/portal && bun run dev  # http://localhost:3002

# Terminal 4: Background Worker
cd apps/worker && bun run dev
```

### 7. Access the Applications

- **Admin Web App**: http://localhost:3001
- **Client Portal**: http://localhost:3002
- **API Server**: http://localhost:3000
- **API Docs**: http://localhost:3000/api
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

---

## 🐳 Docker Deployment (Production)

### Quick Deploy with Docker Compose

```bash
# Build and start all services
docker compose up -d --build

# Check logs
docker compose logs -f

# Check service health
docker compose ps
```

All services will be available at:
- **Web App**: http://localhost:3001
- **Portal**: http://localhost:3002
- **API**: http://localhost:3000
- **MinIO Console**: http://localhost:9001

### Production Docker Compose

```bash
# Use production configuration
docker compose -f docker-compose.prod.yml up -d --build

# Check logs for all services
docker compose -f docker-compose.prod.yml logs -f

# Stop all services
docker compose -f docker-compose.prod.yml down
```

### Individual Service Builds

```bash
# Build individual Docker images
docker build -f apps/web/Dockerfile -t gcmc-web:latest .
docker build -f apps/server/Dockerfile -t gcmc-api:latest .
docker build -f apps/worker/Dockerfile -t gcmc-worker:latest .

# Run individual containers
docker run -d --name gcmc-web -p 3001:3001 gcmc-web:latest
docker run -d --name gcmc-api -p 3000:3000 gcmc-api:latest
docker run -d --name gcmc-worker gcmc-worker:latest
```

---

## ☁️ Cloud Deployment Options

### Option 1: Railway

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

2. **Initialize Project**
```bash
railway init
railway link
```

3. **Add Services**
```bash
# Add PostgreSQL
railway add --database postgres

# Add Redis
railway add --database redis

# Deploy services
railway up
```

4. **Configure Environment Variables**
```bash
railway variables set BETTER_AUTH_SECRET=your-secret
railway variables set MINIO_ENDPOINT=https://your-minio.com
# ... add all required variables
```

### Option 2: Render

1. **Create Blueprint** (render.yaml)
```yaml
services:
  - type: web
    name: gcmc-api
    env: docker
    dockerfilePath: apps/server/Dockerfile
    envVars:
      - key: DATABASE_URL
        fromDatabase: gcmc-db

  - type: web
    name: gcmc-web
    env: docker
    dockerfilePath: apps/web/Dockerfile

  - type: worker
    name: gcmc-worker
    env: docker
    dockerfilePath: apps/worker/Dockerfile

databases:
  - name: gcmc-db
    plan: starter
```

2. **Deploy**
- Push to GitHub
- Connect repository to Render
- Render will auto-deploy using blueprint

### Option 3: AWS (ECS + RDS)

**Prerequisites:**
- AWS Account
- AWS CLI configured
- ECR repository created

**Steps:**

1. **Push Images to ECR**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag gcmc-web:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/gcmc-web:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/gcmc-web:latest
```

2. **Create ECS Task Definitions**
- Define tasks for web, api, worker
- Configure environment variables
- Set up load balancer

3. **Create RDS Database**
```bash
aws rds create-db-instance \
  --db-instance-identifier gcmc-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20
```

4. **Deploy to ECS**
```bash
aws ecs create-service \
  --cluster gcmc-cluster \
  --service-name gcmc-api \
  --task-definition gcmc-api:1 \
  --desired-count 1
```

---

## 🔧 Configuration & Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
REDIS_URL="redis://host:6379"

# Authentication
BETTER_AUTH_SECRET="generated-secret-key"  # openssl rand -base64 32

# Storage
MINIO_ENDPOINT="http://minio:9000"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"

# CORS & URLs
CORS_ORIGIN="https://your-domain.com"
NEXT_PUBLIC_SERVER_URL="https://api.your-domain.com"

# Email (Optional - for email integration)
RESEND_API_KEY="re_your_api_key"

# Worker
NODE_ENV="production"
```

### Optional Variables

```bash
# Logging
LOG_LEVEL="info"  # debug, info, warn, error

# Rate Limiting
RATE_LIMIT_ENABLED="true"

# Analytics
ENABLE_ANALYTICS="true"

# Email Development Mode
EMAIL_DEV_MODE="false"  # Set to true to log emails instead of sending
```

---

## 📊 Health Checks

All services expose health check endpoints:

```bash
# API Server
curl http://localhost:3000/health
# Response: {"status":"ok","timestamp":"2025-11-15T..."}

curl http://localhost:3000/ready
# Response: {"status":"ready","checks":{"database":"connected"}}

# Worker
curl http://localhost:3002/health
# Response: {"status":"healthy","workers":{"compliance":"active",...}}

# Web App (via Next.js)
curl http://localhost:3001/api/health
```

---

## 🗄️ Database Management

### Migrations

```bash
# Create new migration
bunx prisma migrate dev --name your_migration_name

# Apply migrations to production
bunx prisma migrate deploy

# Reset database (development only!)
bunx prisma migrate reset
```

### Seed Data

```bash
# Seed database with sample data
bun db:seed

# Custom seed script
cd packages/db
bun run seed
```

### Backup & Restore

```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

## 📈 Monitoring & Logs

### Docker Logs

```bash
# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f web
docker compose logs -f api
docker compose logs -f worker

# Last 100 lines
docker compose logs --tail=100 api
```

### Application Metrics

- **Prisma Metrics**: Available at http://localhost:3000/metrics (if enabled)
- **BullMQ Dashboard**: Use Bull Board for queue monitoring
- **Next.js Analytics**: Built-in analytics in production mode

---

## 🧪 Testing

### Run All Tests

```bash
# Unit tests
bun test

# E2E tests with Playwright
bunx playwright test

# E2E with UI
bunx playwright test --ui

# Specific test file
bunx playwright test tests/auth.spec.ts
```

### Test in CI

Tests run automatically on every push via GitHub Actions. See `.github/workflows/ci.yml`.

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Generate new BETTER_AUTH_SECRET
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Review and apply Prisma migrations
- [ ] Set NODE_ENV=production
- [ ] Enable health check monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Review security audit report (SECURITY_AUDIT_REPORT.md)

---

## 📦 Build Commands Reference

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Build specific app
bun run build --filter=@GCMC-KAJ/web
bun run build --filter=@GCMC-KAJ/server
bun run build --filter=@GCMC-KAJ/worker

# Development mode
bun run dev

# Type checking
bun run check-types

# Linting
bun run lint

# Format code
bun run format
```

---

## 🐛 Troubleshooting

### Issue: "Workspace dependency not found"

**Solution:** Rebuild from scratch
```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm bun.lockb
bun install
```

### Issue: "Prisma client not generated"

**Solution:** Generate Prisma client
```bash
cd packages/db
bunx prisma generate
```

### Issue: Docker build fails

**Solution:** Clear Docker cache
```bash
docker compose down
docker system prune -a
docker compose up -d --build
```

### Issue: Port already in use

**Solution:** Kill process on port
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Or change ports in .env
PORT=3005
```

### Issue: Database connection fails

**Solution:** Check connection string and service status
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Test connection
psql $DATABASE_URL

# Check logs
docker compose logs postgres
```

---

## 📚 Additional Resources

- **Architecture**: See SYSTEM_ANALYSIS.md
- **Security**: See SECURITY_AUDIT_REPORT.md
- **Docker Guide**: See DOCKER.md
- **CI/CD Setup**: See .github/CICD_SETUP_GUIDE.md
- **Testing**: See TESTING.md (to be created)
- **API Documentation**: Visit http://localhost:3000/api after starting

---

## 🎉 You're Ready!

Your GCMC-KAJ enterprise SaaS platform is production-ready with:

✅ Multi-tenant architecture
✅ Role-based access control (8 roles)
✅ Document management with MinIO storage
✅ Compliance tracking and filings
✅ Task management and workflows
✅ Client portal for self-service
✅ Email notifications
✅ Analytics dashboards with charts
✅ Background job processing
✅ Comprehensive security
✅ Docker deployment
✅ CI/CD pipeline
✅ E2E test coverage

**Start developing:**
```bash
bun run dev
```

**Deploy to production:**
```bash
docker compose -f docker-compose.prod.yml up -d
```

Enjoy your fully-featured enterprise platform! 🚀
