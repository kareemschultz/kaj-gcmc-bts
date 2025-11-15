# GCMC-KAJ Multi-Tenant SaaS Platform

Enterprise-grade compliance and client management platform built with Better-T Stack.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + Hono
- **Runtime**: Bun
- **API**: tRPC v11 (type-safe APIs)
- **Authentication**: Better-Auth (email/password + OAuth ready)
- **Database**: PostgreSQL + Prisma ORM
- **Object Storage**: MinIO (S3-compatible)
- **Job Queue**: BullMQ + Redis
- **Monorepo**: Turborepo
- **Linting/Formatting**: Biome
- **Package Manager**: Bun

## Features

- **Multi-Tenant Architecture**: Complete tenant isolation at database and application level
- **Role-Based Access Control (RBAC)**: 8 roles with granular permissions
- **Client Management**: Individual, company, and partnership clients
- **Document Management**: Version control, MinIO storage, expiry tracking
- **Filing Management**: Tax filings, recurring filings, deadline tracking
- **Compliance Engine**: Rules-based compliance scoring and monitoring
- **Service Requests**: Workflow-based service delivery
- **Task Management**: Internal tasks and client-facing tasks
- **Messaging**: Conversations and notifications
- **Analytics Dashboard**: Compliance metrics, client statistics
- **Client Portal**: Self-service portal for clients
- **Audit Logging**: Complete audit trail for all operations

## Project Structure

```
GCMC-KAJ/
├── apps/
│   ├── web/              # Next.js frontend (port 3001)
│   ├── server/           # Hono API server (port 3000)
│   └── worker/           # BullMQ background jobs
├── packages/
│   ├── api/              # tRPC routers and business logic
│   ├── auth/             # Better-Auth configuration
│   ├── db/               # Prisma schema and client
│   ├── types/            # Shared TypeScript types
│   ├── rbac/             # Role-based access control
│   ├── storage/          # MinIO storage utilities
│   ├── compliance/       # Compliance engine (TODO)
│   ├── queue/            # BullMQ job definitions (TODO)
│   └── config/           # Shared configuration
├── docker-compose.yml    # Full stack orchestration
└── .env.example          # Environment variables template
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Docker](https://www.docker.com/) and Docker Compose
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GCMC-KAJ
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start infrastructure services**
   ```bash
   docker compose up -d postgres redis minio
   ```

5. **Initialize database**
   ```bash
   bun db:push     # Push schema to database
   # OR
   bun db:migrate  # Run migrations (for production)
   ```

6. **Generate Prisma client**
   ```bash
   bun db:generate
   ```

7. **Start development servers**
   ```bash
   bun dev
   ```

   This starts:
   - Next.js app: http://localhost:3001
   - Hono API: http://localhost:3000
   - MinIO console: http://localhost:9001

## Available Scripts

### Root Scripts
- `bun dev` - Start all apps in development mode
- `bun build` - Build all apps and packages
- `bun check-types` - Type-check all packages
- `bun check` - Run Biome linting and formatting
- `bun db:push` - Push Prisma schema to database
- `bun db:migrate` - Run Prisma migrations
- `bun db:generate` - Generate Prisma client
- `bun db:studio` - Open Prisma Studio
- `bun db:start` - Start database in Docker
- `bun db:stop` - Stop database in Docker

### Individual Apps
- `bun dev:web` - Start only the web app
- `bun dev:server` - Start only the API server

## Database Schema

The application uses a comprehensive Prisma schema with:
- **Authentication**: User, Session, Account, Verification (Better-Auth)
- **Multi-Tenancy**: Tenant, TenantUser, Role, Permission
- **Clients**: Client, ClientBusiness
- **Documents**: Document, DocumentVersion, DocumentType
- **Filings**: Filing, FilingType, RecurringFiling
- **Services**: Service, ServiceRequest, ServiceStep
- **Tasks**: Task, ClientTask
- **Compliance**: ComplianceRule, ComplianceScore, RequirementBundle
- **Communication**: Conversation, Message, Notification
- **Audit**: AuditLog
- **Billing**: Plan, Subscription

## Authentication

The platform uses **Better-Auth** for authentication with the following features:
- Email/password authentication
- Session management with cookies
- Multi-tenant user assignment (users can belong to multiple tenants)
- Role-based access control integration

## RBAC System

### Roles
1. **SuperAdmin** - Full system access across all tenants
2. **FirmAdmin** - Full access within tenant
3. **ComplianceManager** - Compliance, filings, client oversight
4. **ComplianceOfficer** - Filings and document review
5. **DocumentOfficer** - Document management
6. **FilingClerk** - Filing preparation and submission
7. **Viewer** - Read-only access
8. **ClientPortalUser** - Client self-service portal

### Permission Modules
- `clients` - Client management
- `documents` - Document management
- `filings` - Filing management
- `services` - Service requests
- `users` - User management
- `settings` - System settings
- `compliance` - Compliance monitoring
- `tasks` - Task management
- `messages` - Messaging
- `analytics` - Analytics and reporting

## Docker Services

The `docker-compose.yml` provides a complete stack:

**Infrastructure:**
- **PostgreSQL** (port 5432): Main database
- **Redis** (port 6379): Job queue backend
- **MinIO** (ports 9000, 9001): Object storage for documents

**Applications:**
- **API Server** (port 3000): Hono + tRPC backend
- **Web App** (port 3001): Next.js frontend
- **Worker**: BullMQ background jobs (compliance, notifications, filings)

### Development with Docker

Start infrastructure only:
```bash
docker compose up -d postgres redis minio
bun dev  # Run apps locally
```

Start full stack:
```bash
docker compose up --build
```

Visit:
- Frontend: http://localhost:3001
- API: http://localhost:3000
- MinIO Console: http://localhost:9001

## Migration Status

✅ **Migration Complete!** All core phases (1-6) are production-ready.

Optional enhancements available - see "Next Steps" below.

### Phase 1: Infrastructure ✅ Complete
- ✅ Prisma schema migration (all models)
- ✅ Better-Auth integration with multi-tenant support
- ✅ tRPC infrastructure with tenant isolation
- ✅ RBAC system (roles, permissions, enforcement)
- ✅ Storage utilities (MinIO)

### Phase 2: Backend API ✅ Complete
- ✅ All 23 tRPC routers migrated
  - users, tenants, roles, clients, clientBusinesses
  - documents, documentTypes, documentUpload
  - filings, filingTypes, recurringFilings
  - services, serviceRequests
  - tasks, conversations, notifications
  - complianceRules, requirementBundles
  - dashboard, analytics
  - wizards, portal
- ✅ RBAC enforcement on all endpoints
- ✅ Tenant isolation
- ✅ Audit logging

### Phase 3: Frontend ✅ Complete
- ✅ Dashboard with real-time stats and compliance charts
- ✅ Clients pages (list, detail, reports integration)
- ✅ Documents pages (list, detail, upload, version history)
- ✅ Filings pages (list, detail, create/edit forms)
- ✅ Tasks pages (list, create/edit)
- ✅ All pages with search, filters, pagination
- ✅ RBAC UI enforcement
- ⏳ Client Portal (future enhancement)

### Phase 4: Worker ✅ Complete
- ✅ BullMQ worker app created
- ✅ Compliance refresh job (daily scoring)
- ✅ Expiry notification job (7-day window)
- ✅ Filing reminder job (overdue filings)
- ✅ Scheduled cron jobs

### Phase 5: Docker ✅ Complete
- ✅ Dockerfiles for web, server, worker
- ✅ docker-compose.yml with full stack
- ✅ Multi-stage builds
- ✅ Health checks
- ✅ Service dependencies

### Phase 6: Testing & PDF Reports ✅ Complete
- ✅ Vitest configuration (root + package configs)
- ✅ Test utilities (test-db, test-context)
- ✅ RBAC tests (100+ tests covering all roles/permissions)
- ✅ Router tests (25+ tests for clients, documents, users)
- ✅ PDF Reports package with 5 professional report types
- ✅ tRPC reports router with 6 endpoints
- ✅ Frontend report download integration
- ⏳ CI/CD pipeline (future enhancement)
- ⏳ Advanced monitoring (future enhancement)

## Development Guidelines

### Adding a New tRPC Router

1. Create router file in `packages/api/src/routers/`
2. Use `rbacProcedure(module, action)` for protected endpoints
3. Always filter by `ctx.tenantId` for tenant isolation
4. Add audit logging for mutations
5. Export router in `packages/api/src/routers/index.ts`

Example:
```typescript
import { z } from "zod";
import { router, rbacProcedure } from "../index";
import prisma from "@GCMC-KAJ/db";

export const exampleRouter = router({
  list: rbacProcedure("module", "view")
    .query(async ({ ctx }) => {
      return prisma.entity.findMany({
        where: { tenantId: ctx.tenantId },
      });
    }),
});
```

### Tenant Isolation

All database queries MUST include tenant isolation:
```typescript
prisma.client.findMany({
  where: { tenantId: ctx.tenantId }, // Always filter by tenant
});
```

### RBAC Enforcement

Use the appropriate procedure:
- `publicProcedure` - No auth required
- `protectedProcedure` - Auth required, no permissions checked
- `rbacProcedure(module, action)` - Auth + specific permission required

## Deployment

### Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Session encryption key
- `MINIO_*` - Object storage configuration
- `REDIS_URL` - Job queue connection
- `SMTP_*` - Email notifications (optional)

### Build

```bash
bun run build
```

Outputs:
- `apps/web/.next` - Next.js production build
- `apps/server/dist` - Hono API bundle
- `apps/worker/dist` - Worker bundle (when completed)

### Docker Production

The Dockerfiles use multi-stage builds optimized for production:

```bash
# Build all images
docker compose build

# Start production stack
docker compose up -d

# View logs
docker compose logs -f api
docker compose logs -f web
docker compose logs -f worker

# Stop all services
docker compose down
```

**Production Environment Variables:**

Set these in your `.env` or docker-compose environment:
- `BETTER_AUTH_SECRET` - Strong random key for session encryption
- `DATABASE_URL` - Production PostgreSQL connection string
- `MINIO_*` - Production S3/MinIO configuration
- `REDIS_URL` - Production Redis connection string
- `BETTER_AUTH_URL` - Your production domain URL

**Security Notes:**
- All app containers run as non-root users
- Health checks ensure services are responding
- Restart policies handle failures automatically
- Volumes persist data across container restarts

## Testing

```bash
bun test        # Run all tests
bun test:watch  # Watch mode
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `bun check` to lint/format
4. Run `bun build` to ensure it compiles
5. Submit a pull request

## Next Steps (Optional Enhancements)

The core platform is complete and production-ready. Optional enhancements include:

1. **Client Portal App** - Separate client-facing application
   - Client login and self-service
   - Document viewing and download
   - Filing status tracking
   - Secure messaging with firm

2. **CI/CD Pipeline** - Automated deployment
   - GitHub Actions workflows
   - Automated testing on PR
   - Docker image builds
   - Deployment to staging/production

3. **Monitoring & Observability**
   - Prometheus metrics collection
   - Grafana dashboards
   - Loki log aggregation
   - Alerting rules

4. **Email Integration** - SMTP notifications
   - Document expiry alerts
   - Filing deadline reminders
   - Task assignments
   - Compliance updates

5. **Advanced Analytics**
   - Revenue analytics
   - Client growth metrics
   - Compliance trends
   - Performance dashboards

6. **Mobile Application** - React Native app
   - iOS and Android support
   - Push notifications
   - Offline document viewing
   - Mobile-optimized workflows

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact the development team.
