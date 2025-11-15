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
│   └── worker/           # BullMQ background jobs (TODO)
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
├── docker-compose.yml    # Local development services
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

The `docker-compose.yml` provides:
- **PostgreSQL** (port 5432): Main database
- **Redis** (port 6379): Job queue backend
- **MinIO** (ports 9000, 9001): Object storage for documents

Start all services:
```bash
docker compose up -d
```

## Migration Status

⚠️ **This is a work-in-progress migration from the legacy platform.**

See [MIGRATION_STATUS.md](./MIGRATION_STATUS.md) for detailed progress and remaining tasks.

### Completed
- ✅ Prisma schema migration (all models)
- ✅ Better-Auth integration with multi-tenant support
- ✅ tRPC infrastructure with tenant isolation
- ✅ RBAC system (roles, permissions, enforcement)
- ✅ Storage utilities (MinIO)
- ✅ Example router migration (clients)
- ✅ Docker Compose configuration

### In Progress
- 🚧 Remaining 21 tRPC routers
- 🚧 Frontend pages and components
- 🚧 BullMQ worker jobs
- 🚧 Compliance engine
- 🚧 Tests migration

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

A production Dockerfile will be added in future updates.

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

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact the development team.
