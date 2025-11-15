# GCMC-KAJ Multi-Tenant SaaS Platform

Production-ready enterprise compliance and client management platform built with Better-T Stack.

## Status: ✅ Production Ready

**Current Version**: 1.0.0
**Build Status**: ✅ All systems operational
**API Server**: ✅ Running (http://localhost:3000)
**Database**: ✅ Connected
**Docker**: ✅ Build successful

## Tech Stack

- **Framework**: Next.js 16 + Hono API
- **Runtime**: Bun
- **API**: tRPC v11 (type-safe)
- **Auth**: Better-Auth
- **Database**: PostgreSQL + Prisma
- **Storage**: MinIO (S3-compatible)
- **Queue**: BullMQ + Redis
- **Deployment**: Docker + Docker Compose

## Architecture

```
GCMC-KAJ/
├── apps/
│   ├── web/              # Admin frontend (port 3001)
│   ├── server/           # API server (port 3000)
│   └── worker/           # Background jobs
├── packages/
│   ├── api/              # Business logic & tRPC routers
│   ├── db/               # Database schema & client
│   ├── auth/             # Authentication
│   └── rbac/             # Role-based access control
└── docker-compose.yml    # Production stack
```

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) v1.0+
- [Docker](https://www.docker.com/) & Docker Compose

### Production Deployment

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd GCMC-KAJ
   bun install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Update .env with production values
   ```

3. **Deploy full stack**
   ```bash
   docker compose up --build -d
   ```

   **Services:**
   - Frontend: http://localhost:3001
   - API: http://localhost:3000
   - MinIO Console: http://localhost:9001

### Development Mode

```bash
# Start infrastructure only
docker compose up -d postgres redis minio

# Run apps locally
bun dev
```

## Core Features

### Multi-Tenant SaaS Platform
- **Client Management**: Individual, company, and partnership clients
- **Document Management**: Version control with S3-compatible storage
- **Filing Management**: Tax filings with deadline tracking
- **Compliance Engine**: Rules-based scoring and monitoring
- **RBAC System**: 8 roles with granular permissions
- **Audit Logging**: Complete operation trail

### Technology Features
- **Multi-Tenant Architecture**: Complete data isolation
- **Type-Safe APIs**: tRPC v11 with full TypeScript
- **Real-Time Updates**: Optimistic updates with React Query
- **Background Jobs**: BullMQ with Redis for async processing
- **Object Storage**: MinIO for document management
- **Authentication**: Better-Auth with session management

## Environment Configuration

Required environment variables:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/gcmc_kaj"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="https://your-domain.com"

# Storage
MINIO_ENDPOINT="localhost"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"

# Queue
REDIS_URL="redis://localhost:6379"
```

## Production Deployment

### Docker Production Stack

```bash
# Build and deploy
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Health Monitoring

- **API Health**: http://localhost:3000/health
- **Database**: Automatic connection pooling
- **Redis**: Job queue health monitoring
- **MinIO**: Object storage health checks

## Command Reference

```bash
# Development
bun dev                 # Start all services
bun build              # Build for production
bun db:migrate         # Run database migrations
bun db:generate        # Generate Prisma client

# Production
docker compose up -d   # Deploy full stack
docker compose logs    # View service logs
docker compose down    # Stop all services
```

## Security & Compliance

- **Multi-Tenant Isolation**: Database-level tenant separation
- **Authentication**: Session-based with secure cookies
- **Authorization**: 8-role RBAC system
- **Audit Trail**: Complete operation logging
- **Data Protection**: Encrypted storage and transmission
- **Container Security**: Non-root users, health checks

## Support & Documentation

- **Production Issues**: Monitor logs via `docker compose logs`
- **Health Checks**: Built-in endpoints for all services
- **Backup**: PostgreSQL and MinIO data persistence
- **Scaling**: Docker Compose replica configuration ready

## License

Proprietary - All rights reserved
