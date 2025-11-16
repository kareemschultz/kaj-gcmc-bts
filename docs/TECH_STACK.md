# GCMC-KAJ Platform Technology Stack

**Last Updated:** 2025-11-16
**Version:** 1.0.0

## Table of Contents

- [Overview](#overview)
- [Core Technologies](#core-technologies)
- [Frontend Stack](#frontend-stack)
- [Backend Stack](#backend-stack)
- [Database & Storage](#database--storage)
- [Infrastructure](#infrastructure)
- [Development Tools](#development-tools)
- [Version Matrix](#version-matrix)
- [Integration Points](#integration-points)

## Overview

The GCMC-KAJ Platform is built using modern, production-ready technologies focused on **type safety**, **performance**, and **developer experience**.

### Technology Philosophy

- **Type-Safe Everything:** TypeScript + tRPC + Prisma + Zod
- **Modern React:** React 19 with Next.js 16 App Router
- **Bun Runtime:** Faster package management and execution
- **Monorepo Architecture:** Turborepo for efficient builds
- **Container-First:** Docker for consistent deployments

## Core Technologies

### Runtime & Package Manager

| Technology | Version | Purpose | Why We Chose It |
|------------|---------|---------|-----------------|
| **Bun** | 1.2.18 | JavaScript runtime & package manager | 10x faster than npm, built-in TypeScript support, superior performance |
| **Node.js** | Compatible | Fallback runtime | Industry standard, extensive ecosystem |
| **TypeScript** | 5.8.2 | Type-safe JavaScript | Prevents runtime errors, excellent DX, self-documenting code |

### Build System

| Technology | Version | Purpose | Why We Chose It |
|------------|---------|---------|-----------------|
| **Turborepo** | 2.5.4 | Monorepo build system | Incremental builds, task caching, parallel execution |
| **tsdown** | 0.16.4 | TypeScript bundler | Fast compilation for packages |
| **Biome** | 2.2.0 | Linter & formatter | 100x faster than ESLint+Prettier, unified toolchain |

## Frontend Stack

### Web Applications (`apps/web` & `apps/portal`)

#### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.3 | React meta-framework |
| **React** | 19.2.0 | UI library |
| **React DOM** | 19.2.0 | React renderer |

**Why Next.js 16?**
- App Router for nested layouts
- Server Components for performance
- Built-in optimization (images, fonts, scripts)
- TypeScript-first development

#### State Management & Data Fetching

| Technology | Version | Purpose |
|------------|---------|---------|
| **TanStack Query** (React Query) | 5.85.5 | Server state management |
| **tRPC Client** | 11.5.0 | Type-safe API client |
| **@trpc/react-query** | 11.5.0 | tRPC + React Query integration |

**Benefits:**
- Automatic caching and refetching
- Optimistic updates
- Pagination and infinite scrolling
- Full type inference from backend to frontend

#### UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.1.10 | Utility-first CSS framework |
| **Radix UI** | 1.4.2 | Unstyled accessible components |
| **class-variance-authority** | 0.7.1 | Type-safe component variants |
| **clsx** | 2.1.1 | Conditional className utility |
| **tailwind-merge** | 3.3.1 | Merge Tailwind classes intelligently |
| **next-themes** | 0.4.6 | Theme management (dark/light mode) |
| **lucide-react** | 0.553.0 | Icon library |

#### Forms & Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| **TanStack React Form** | 1.12.3 | Type-safe form management |
| **Zod** | 4.1.11 | Schema validation |

#### Charts & Visualization

| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | 2.15.0 | React charting library |

#### PDF Generation (Web Only)

| Technology | Version | Purpose |
|------------|---------|---------|
| **jsPDF** | 2.5.2 | Client-side PDF generation |
| **html2canvas** | 1.4.1 | HTML to canvas conversion |

#### Notifications

| Technology | Version | Purpose |
|------------|---------|---------|
| **sonner** | 2.0.5 | Toast notifications |

## Backend Stack

### API Server (`apps/server`)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Hono** | 4.8.2 | Lightweight web framework |
| **tRPC Server** | 11.5.0 | Type-safe API framework |
| **@hono/trpc-server** | 0.4.0 | tRPC adapter for Hono |
| **Better-Auth** | 1.3.28 | Authentication framework |
| **Zod** | 4.1.11 | Input validation |

**Why Hono?**
- Ultra-fast (faster than Express/Fastify)
- Built for edge runtimes
- Excellent TypeScript support
- Minimal overhead

**Why tRPC?**
- End-to-end type safety
- No code generation needed
- Auto-complete in frontend
- Reduces API bugs by 90%

### Background Worker (`apps/worker`)

| Technology | Version | Purpose |
|------------|---------|---------|
| **BullMQ** | 5.34.2 | Job queue & scheduler |
| **IORedis** | 5.4.1 | Redis client |

**Why BullMQ?**
- Battle-tested for production
- Built-in retry logic
- Delayed and scheduled jobs
- Priority queues
- Job concurrency control

## Database & Storage

### Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 16-alpine | Primary database |
| **Prisma** | 6.15.0 | ORM & query builder |
| **@prisma/client** | 6.15.0 | Type-safe database client |

**Why PostgreSQL + Prisma?**
- Industry-standard relational database
- ACID compliance
- JSON support for flexible fields
- Prisma provides:
  - Auto-generated types
  - Migration system
  - Prisma Studio for data exploration
  - Type-safe queries

### File Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| **MinIO** | latest | S3-compatible object storage |
| **minio** (SDK) | 8.0.1 | JavaScript MinIO client |

**Why MinIO?**
- S3-compatible API
- Self-hosted (data sovereignty)
- Multi-tenant bucket isolation
- Pre-signed URLs for secure access

### Caching & Queue

| Technology | Version | Purpose |
|------------|---------|---------|
| **Redis** | 7-alpine | Caching & job queues |

## Infrastructure

### Containerization

| Technology | Version | Purpose |
|------------|---------|---------|
| **Docker** | Compatible | Container runtime |
| **Docker Compose** | v3.9 | Multi-container orchestration |

### Environment Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **dotenv** | 17.2.2 | Environment variable loading |

## Development Tools

### Code Quality

| Technology | Version | Purpose |
|------------|---------|---------|
| **Biome** | 2.2.0 | Linter & formatter |
| **Husky** | 9.1.7 | Git hooks |
| **lint-staged** | 16.1.2 | Run linters on staged files |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | 2.0.0 | Unit testing framework |
| **Playwright** | 1.56.1 | End-to-end testing |

### Email

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Email** | 3.0.3 | Email template framework |
| **@react-email/components** | 0.0.31 | Email UI components |
| **@react-email/render** | 1.0.1 | Render React to HTML email |
| **Resend** | 4.0.1 | Email delivery service |

### PDF Generation (Server)

| Technology | Version | Purpose |
|------------|---------|---------|
| **@react-pdf/renderer** | 4.2.0 | Server-side PDF generation |

### Date & Time

| Technology | Version | Purpose |
|------------|---------|---------|
| **date-fns** | 4.1.0 | Date manipulation utilities |

## Version Matrix

### Critical Dependencies

```json
{
  "runtime": "bun@1.2.18",
  "typescript": "5.8.2",
  "react": "19.2.0",
  "next": "16.0.3",
  "trpc": "11.5.0",
  "prisma": "6.15.0",
  "hono": "4.8.2",
  "better-auth": "1.3.28",
  "zod": "4.1.11",
  "tailwindcss": "4.1.10",
  "postgres": "16-alpine",
  "redis": "7-alpine",
  "minio": "latest"
}
```

### Package Catalog (Workspace-Level)

The monorepo uses a **catalog** feature in `package.json` to ensure version consistency:

```json
{
  "catalog": {
    "hono": "^4.8.2",
    "@trpc/server": "^11.5.0",
    "@trpc/client": "^11.5.0",
    "@trpc/react-query": "^11.5.0",
    "better-auth": "^1.3.28",
    "dotenv": "^17.2.2",
    "zod": "^4.1.11",
    "typescript": "^5.8.2",
    "tsdown": "^0.16.4",
    "@prisma/client": "^6.15.0",
    "prisma": "^6.15.0",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "@types/react": "19.2.5",
    "@types/react-dom": "19.2.3",
    "@types/node": "^22.10.2"
  }
}
```

**Benefits:**
- Single source of truth for versions
- Packages reference with `"dependency": "catalog:"`
- Prevents version drift across workspaces

## Integration Points

### Authentication Flow

```
User Request → Next.js → Hono Server → Better-Auth → PostgreSQL
                   ↓
            Session Cookie
                   ↓
         tRPC Context (user, tenant, role)
```

### API Request Flow

```
React Component → tRPC Client → Hono Server → tRPC Router → Prisma → PostgreSQL
                                       ↓
                                   RBAC Check
                                       ↓
                                  Audit Log
```

### File Upload Flow

```
React Upload Component → tRPC Router → MinIO SDK → MinIO S3
                                ↓
                        Document Record (PostgreSQL)
```

### Background Job Flow

```
API Endpoint → BullMQ Queue → Redis → Worker Process → Job Handler
                                           ↓
                                      Update Database
                                           ↓
                                      Send Notification
```

### Email Flow

```
Action Trigger → Queue Email Job → Redis → Worker → React Email → Resend API → User Inbox
                                                ↓
                                      Log Notification (PostgreSQL)
```

## Technology Choices Rationale

### Why Bun over Node.js?

| Feature | Bun | Node.js |
|---------|-----|---------|
| Package Install Speed | 10-20x faster | Baseline |
| Runtime Performance | ~3x faster | Baseline |
| TypeScript Support | Native | Requires ts-node |
| Built-in Test Runner | Yes | No (requires Jest/Vitest) |
| Built-in Bundler | Yes | No (requires Webpack/Vite) |

### Why tRPC over REST/GraphQL?

| Feature | tRPC | REST | GraphQL |
|---------|------|------|----------|
| Type Safety | Full end-to-end | Manual | Codegen required |
| Auto-complete | Yes | No | With codegen |
| API Definition | TypeScript code | OpenAPI spec | Schema files |
| Learning Curve | Low | Low | Medium-High |
| Runtime Overhead | Minimal | None | Higher |

### Why Prisma over Other ORMs?

| Feature | Prisma | TypeORM | Drizzle |
|---------|--------|---------|---------|
| Type Safety | Excellent | Good | Excellent |
| Migrations | Auto-generated | Manual | Manual |
| Studio GUI | Yes | No | No |
| Query Builder | Fluent API | QueryBuilder | SQL-like |
| Maturity | High | Very High | Growing |

### Why MinIO over AWS S3?

| Feature | MinIO | AWS S3 |
|---------|-------|--------|
| Self-Hosted | Yes | No |
| Cost | Infrastructure only | Pay per GB + requests |
| Data Sovereignty | Full control | AWS regions |
| S3 Compatibility | 100% | Native |
| Multi-Tenancy | Easy bucket isolation | Similar |

## Dependency Categories

### Production Dependencies by Package

#### Apps

**`apps/web`:**
- Next.js 16 + React 19
- tRPC Client + React Query
- Tailwind CSS 4 + Radix UI
- Better-Auth client
- Charts (Recharts)
- PDF export (jsPDF)

**`apps/portal`:**
- Next.js 16 + React 19
- tRPC Client + React Query
- Tailwind CSS 4 + Radix UI
- Better-Auth client

**`apps/server`:**
- Hono
- tRPC Server
- Better-Auth
- Workspace packages: `@GCMC-KAJ/api`, `@GCMC-KAJ/auth`, `@GCMC-KAJ/db`

**`apps/worker`:**
- BullMQ + IORedis
- Workspace packages: `@GCMC-KAJ/db`, `@GCMC-KAJ/email`, `@GCMC-KAJ/types`

#### Packages

**`packages/api`:**
- tRPC Server
- Hono
- BullMQ + IORedis
- Zod
- Dependencies: `auth`, `db`, `email`, `rbac`, `reports`, `types`

**`packages/auth`:**
- Better-Auth
- Zod
- Dependencies: `db`, `types`

**`packages/db`:**
- Prisma Client
- Zod
- PostgreSQL connection

**`packages/storage`:**
- MinIO SDK

**`packages/email`:**
- React Email
- @react-email/components
- @react-email/render
- Resend
- Dependencies: `db`, `types`

**`packages/rbac`:**
- Dependencies: `types`

**`packages/reports`:**
- @react-pdf/renderer
- date-fns
- Dependencies: `db`, `types`

**`packages/types`:**
- No external dependencies (pure TypeScript)

**`packages/config`:**
- TypeScript configuration
- Biome configuration

## Cross-References

- **Project Structure:** See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- **API Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Database Schema:** See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Deployment Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
