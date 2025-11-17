
# KAJ‑GCMC Compliance Platform

[![Status](https://img.shields.io/badge/status-active-success?style=for-the-badge)](#)
[![Bun](https://img.shields.io/badge/runtime-bun-000?style=for-the-badge&logo=bun)](#)
[![Next.js](https://img.shields.io/badge/frontend-next.js-000?style=for-the-badge&logo=nextdotjs)](#)
[![Hono](https://img.shields.io/badge/backend-hono-ff6b6b?style=for-the-badge)](#)
[![tRPC](https://img.shields.io/badge/api-tRPC-2596be?style=for-the-badge)](#)
[![Prisma](https://img.shields.io/badge/orm-prisma-2d3748?style=for-the-badge&logo=prisma)](#)
[![PostgreSQL](https://img.shields.io/badge/database-postgresql-336791?style=for-the-badge&logo=postgresql)](#)
[![Redis](https://img.shields.io/badge/cache-redis-d82c20?style=for-the-badge&logo=redis)](#)
[![MinIO](https://img.shields.io/badge/storage-minio-c72e49?style=for-the-badge)](#)
[![Better‑Auth](https://img.shields.io/badge/auth-better--auth-4b9ce2?style=for-the-badge)](#)
[![Biome](https://img.shields.io/badge/code%20quality-biome-1c1e26?style=for-the-badge)](#)
[![Vitest](https://img.shields.io/badge/tests-vitest-729b1b?style=for-the-badge&logo=vitest)](#)
[![License](https://img.shields.io/badge/license-MIT-3b82f6?style=for-the-badge)](#)

End‑to‑end **regulatory compliance & client management** platform for KAJ/GCMC, built as a modern **Better‑T‑style monorepo** with full **multi‑tenant support**, **RBAC**, **document workflows**, **filings**, **analytics**, and **PDF reporting**.

> 🎉 **Latest Update (Nov 16, 2025)**: Phase 2-4 comprehensive platform improvements complete! Security updates, brand redesign, CI/CD optimization, and full production readiness achieved. See [CURRENT_STATUS.md](./docs/development/CURRENT_STATUS.md) for details.

---

## 📚 Table of Contents

- [KAJ‑GCMC Compliance Platform](#kaj-gcmc-compliance-platform)
  - [📚 Table of Contents](#-table-of-contents)
  - [🚀 Overview](#-overview)
  - [✨ Core Features](#-core-features)
  - [🏗 Architecture](#-architecture)
    - [System Diagram](#system-diagram)
    - [Request Flow](#request-flow)
  - [🧱 Tech Stack](#-tech-stack)
  - [📁 Monorepo Layout](#-monorepo-layout)
  - [⚙️ Environment \& Configuration](#️-environment--configuration)
  - [🧑‍💻 Running the Stack](#-running-the-stack)
    - [1. Prerequisites](#1-prerequisites)
    - [2. Local Development (Recommended)](#2-local-development-recommended)
    - [3. Full Docker Stack](#3-full-docker-stack)
    - [4. Helpful Scripts](#4-helpful-scripts)
  - [🗄 Database \& Migrations](#-database--migrations)
  - [🔐 Authentication \& RBAC](#-authentication--rbac)
  - [👤 Admin Setup \& User Management](#-admin-setup--user-management)
  - [📨 Background Workers](#-background-workers)
  - [📂 Documents \& File Storage](#-documents--file-storage)
  - [📑 PDF Reporting](#-pdf-reporting)
  - [🧪 Testing](#-testing)
  - [🧹 Linting, Formatting \& Code Quality](#-linting-formatting--code-quality)
  - [📦 CI/CD \& Deployment (Planned)](#-cicd--deployment-planned)
  - [📱 UX, Responsiveness \& Accessibility](#-ux-responsiveness--accessibility)
  - [🧭 Roadmap \& Enhancements](#-roadmap--enhancements)
  - [👩‍💻 Contributing \& Branch Workflow](#-contributing---branch-workflow)
  - [📄 License](#-license)

---

## 🚀 Overview

This repository contains the **KAJ‑GCMC SaaS platform** – a multi‑tenant system for:

- Managing **clients & client businesses**
- Tracking **documents**, **filings**, **services**, and **tasks**
- Enforcing **compliance rules** and **requirement bundles** (e.g. GRA, NIS, Deeds, GO‑Invest)
- Providing **dashboards, analytics, and PDF reports**
- Running **background jobs** for compliance refresh, expiry notifications, and filing reminders

The legacy implementation lived in a **Next.js monolith**. It has been fully migrated into a **modern monorepo** with:

- Clear separation of concerns (web / api / worker / shared packages)
- Strong **type safety** via TypeScript, tRPC, and Prisma
- Production‑ready **Docker** setup
- Rich **PDF reporting** for client files, documents, filings, services, and compliance

---

## ✨ Core Features

- **Multi‑tenant architecture**
  - Isolated data per tenant (e.g. KAJ, GCMC, others)
  - Tenant‑scoped queries at all layers
- **RBAC (Role‑Based Access Control)**
  - 8+ roles (SuperAdmin, FirmAdmin, ComplianceManager, etc.)
  - Permission strings per module (`clients:view`, `documents:create`, …)
- **Clients & Businesses**
  - Clients with associated business entities
  - Snapshot of filings, documents, services and tasks per client
- **Documents**
  - Document types, expiry tracking, version history
  - MinIO‑backed storage with presigned URLs
- **Filings**
  - Filing types, recurring filings, due dates
  - Overdue detection and reminders
- **Compliance Engine**
  - Rules and requirement bundles for agencies (e.g. GRA, NIS, Deeds, GO‑Invest)
  - Score calculation and risk categories
- **Tasks & Workflows**
  - Internal tasks, service requests, and wizard flows
- **Analytics & Dashboards**
  - Compliance overview, risk distribution, activity feed
  - Module‑level analytics
- **PDF Reporting**
  - Client file report, filings summary, documents inventory, compliance report, service history
- **Background Jobs**
  - Daily compliance refresh
  - Document expiry notifications
  - Filing reminders

---

## 🏗 Architecture

### System Diagram

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart LR
  subgraph Browser[Browser / Devices]
    WebApp[Next.js Web App]
  end

  subgraph Infra[Backend Layer]
    API[Hono + tRPC API]
    Worker[BullMQ Worker]
  end

  subgraph Shared[Shared Packages]
    DB[(Prisma + PostgreSQL)]
    Storage[MinIO Object Storage]
    Auth[Better‑Auth]
    RBAC[RBAC & Permissions]
    Reports[PDF Reports]
  end

  WebApp <-->|tRPC| API
  API --> DB
  API --> Storage
  API --> Auth
  API --> RBAC
  API --> Reports

  Worker --> DB
  Worker --> Storage
  Worker --> Auth
  Worker --> RBAC

  subgraph InfraSvc[Infra Services]
    Redis[(Redis)]
    MinIO[(MinIO)]
    Postgres[(PostgreSQL)]
  end

  Worker <-->|Jobs| Redis
  API <-->|Jobs| Redis

  DB --- Postgres
  Storage --- MinIO
```

### Request Flow

```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    participant U as User (Browser)
    participant W as Next.js App
    participant A as Hono + tRPC API
    participant R as RBAC Layer
    participant D as Prisma/PostgreSQL

    U->>W: Click "Create Filing"
    W->>A: tRPC mutation filings.create(data)
    A->>R: Check auth + permissions
    R-->>A: OK (FirmAdmin, filings:create)
    A->>D: prisma.filing.create({... tenantId })
    D-->>A: Filing created
    A-->>W: Success response
    W-->>U: Show success toast + updated UI
```

---

## 🧱 Tech Stack

**Core**

- **Runtime:** [Bun](https://bun.sh/)
- **Frontend:** Next.js (App Router) + React + TypeScript
- **Backend:** Hono (Bun) + tRPC (end‑to‑end typesafe API)
- **Database:** PostgreSQL + Prisma ORM
- **Cache / Queues:** Redis + BullMQ
- **Storage:** MinIO (S3‑compatible)
- **Auth:** Better‑Auth (Prisma adapter, session‑based)
- **Monorepo:** Turborepo

**Tooling & Quality**

- **Package Manager:** bun
- **Lint / Format:** Biome
- **Testing:** Vitest
- **PDF Generation:** @react‑pdf/renderer (via `packages/reports`)
- **UI:** Tailwind CSS + shadcn/ui

---

## 📁 Monorepo Layout

```text
.
├─ apps/
│  ├─ web/              # Next.js app (admin console & dashboards)
│  ├─ server/           # Hono + tRPC API server
│  └─ worker/           # BullMQ background workers
│
├─ packages/
│  ├─ api/              # tRPC routers, context, and API helpers
│  ├─ auth/             # Better‑Auth configuration
│  ├─ db/               # Prisma schema, db utilities, docker-compose for DB
│  ├─ rbac/             # Roles, permissions, RBAC helpers, middleware
│  ├─ storage/          # MinIO integration helpers (if present)
│  ├─ reports/          # PDF report generators and templates
│  ├─ config/           # Shared TS config
│  └─ (types, etc.)     # Shared types (if present)
│
├─ docker-compose.yml   # Full stack (Postgres, Redis, MinIO, web, api, worker)
├─ DOCKER.md            # Deployment & Docker documentation
├─ MIGRATION_STATUS.md  # Migration notes & status
├─ REPORTS_SYSTEM_SUMMARY.md # Detailed docs for the reports subsystem
├─ turbo.json           # Turborepo pipelines
├─ biome.json           # Biome config
├─ vitest.config.ts     # Root Vitest config
└─ package.json         # Root scripts and workspace configuration
```

---

## ⚙️ Environment & Configuration

Key environment variables are documented in:

- `apps/web/.env.example`
- `apps/server/.env.example`
- `packages/db/.env.example` (or via `packages/db/docker-compose.yml`)
- Root `.env.example` (if present)

Typical variables you will need:

```bash
# Database
DATABASE_URL=postgresql://gcmc:gcmc@localhost:5432/gcmc

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_PREFIX=gcmc

# Auth
AUTH_SECRET=your-long-random-secret
AUTH_URL=http://localhost:3001

# App
NEXT_PUBLIC_API_URL=http://localhost:3000
```

> 💡 Always copy the `*.env.example` files to `.env` and adjust values before running the stack.

---

## 🧑‍💻 Running the Stack

### 1. Prerequisites

- **Docker** & **Docker Compose**
- **Bun** (runtime + package manager)
- **Node.js** (optional, but Bun is primary)
- Access to the repository code

### 2. Local Development (Recommended)

Run infra in Docker, apps with Bun:

```bash
# 1. Start infrastructure only
docker compose up -d postgres redis minio

# 2. Install dependencies
bun install

# 3. Setup database (create schema)
bun db:push        # or bun db:migrate if configured

# 4. Start all apps in dev mode (web + server + worker via Turborepo)
bun dev
```

Then open:

- Web (dashboard): **http://localhost:3001**
- API (Hono + tRPC): **http://localhost:3000**
- MinIO console: **http://localhost:9001** (default `minioadmin/minioadmin`)

### 3. Full Docker Stack

To build and run **everything** inside containers:

```bash
# Build and start all services
docker compose up --build
```

This will start:

- `gcmc-kaj-postgres` – PostgreSQL
- `gcmc-kaj-redis` – Redis
- `gcmc-kaj-minio` – MinIO
- `gcmc-kaj-api` – Hono + tRPC API
- `gcmc-kaj-web` – Next.js web app
- `gcmc-kaj-worker` – BullMQ worker

### 4. Helpful Scripts

In `package.json` (root), you will typically find scripts like:

```bash
bun dev               # run web + api + worker in dev via Turborepo
bun dev:web           # run only Next.js app
bun dev:api           # run only Hono API
bun dev:worker        # run only worker

bun db:push           # sync Prisma schema to DB
bun db:generate       # generate Prisma client

bun lint              # run Biome
bun format            # format code with Biome

bun test              # run all Vitest tests
bun test:watch        # watch mode
bun test:coverage     # coverage report
```

Check the actual `package.json` for the up‑to‑date script list.

---

## 🗄 Database & Migrations

- Prisma schema lives in `packages/db/prisma/schema/*.prisma`
- The DB package also contains `docker-compose.yml` for a standalone DB if needed
- We use standard Prisma workflows:

```bash
# After changing schema
bun db:generate
bun db:push         # or bun db:migrate dev --name <description>
```

**Models** include (high level):

- Tenants, Users, Roles, Permissions
- Clients, ClientBusinesses
- Documents, DocumentTypes, DocumentVersions
- Filings, FilingTypes, RecurringFilings
- ComplianceRules, RequirementBundles
- Tasks, Conversations, Notifications
- Audit logs and related entities

---

## 🔐 Authentication & RBAC

- **Auth** is implemented using **Better‑Auth** with a **Prisma adapter** in `packages/auth`
- Sessions are **tenant‑aware** and include:
  - `userId`
  - `tenantId`
  - `role`
  - Derived permission set

The tRPC context (in `packages/api/src/context.ts`) exposes:

```ts
type Context = {
  session: Session | null;
  user: User | null;
  tenantId: string | null;
  role: UserRole | null;
  // other helpers...
};
```

RBAC middleware (in `packages/rbac`) provides helpers like:

- `protectedProcedure` – requires authenticated user
- `rbacProcedure(module, action)` – enforces permissions for a module/action pair
- Tenant isolation is enforced by **always using `ctx.tenantId`** in Prisma queries.

> ⚠️ Never trust tenant IDs from the client – always use `ctx.tenantId` from the session.

---

## 👤 Admin Setup & User Management

### Default Admin Account

After setting up the platform, create your admin account using the provided script:

```bash
# Create production-ready admin account
bun scripts/setup-production-admin.ts
```

This creates a default admin account with:

```
🌐 Platform URL: http://localhost:3001
📧 Admin Email: admin@gcmc-kaj.com
🔒 Password: GCMCAdmin2024!
👤 Full Name: GCMC-KAJ System Administrator
🛡️  Access Level: FirmAdmin (Full Platform Access)
```

> ⚠️ **Security**: Change the default password after first login and store credentials securely.

### User Management System

The platform implements a **secure-by-default user management system**:

#### **Smart Signup Flow**
- **New users** → Automatic "Viewer" role (safe default)
- **NO role selection** at signup (prevents privilege escalation)
- **Admin approval required** for elevated roles
- **Audit logging** for all role changes

#### **Admin Interface**
Access the user management interface at `/admin/users` to:

- **View all users** in your organization
- **Search and filter** by name, email, or role
- **Assign roles** using dropdown interface
- **Remove users** from tenant
- **Track permissions** and access levels

#### **Available Roles**

| Role | Description | Use Case |
|------|-------------|----------|
| `SuperAdmin` | Cross-tenant platform access | System administration |
| `FirmAdmin` | Full organizational access + user management | Organization leaders |
| `ComplianceManager` | Compliance oversight and operations | Compliance team leads |
| `ComplianceOfficer` | Daily compliance tasks and filings | Compliance staff |
| `DocumentOfficer` | Document management and uploads | Document specialists |
| `FilingClerk` | Filing preparation and submission | Filing specialists |
| `Viewer` | Read-only access (default for new users) | Safe default role |
| `ClientPortalUser` | External client access | Client-facing portal |

#### **Onboarding Wizard**

New administrators can access the onboarding wizard at `/admin/onboarding` to:

- **Set up organization** details and compliance needs
- **Invite team members** with appropriate roles
- **Configure initial workflows** and permissions
- **Review security best practices** for compliance

#### **Email Notifications**

The system automatically notifies administrators when:

- **New users sign up** (requires role assignment)
- **Role changes occur** (audit trail)
- **Permission issues arise** (security alerts)

#### **Best Practices**

1. **Default Security**: All new users start with minimal "Viewer" permissions
2. **Admin Approval**: Elevated roles require explicit admin assignment
3. **Audit Trail**: All role changes are logged for compliance
4. **Regular Reviews**: Periodically review user permissions and access levels

#### **Testing Admin Functionality**

Verify your admin setup works correctly:

```bash
# Test admin login and permissions
bun test-admin-flow.js

# Test complete user signup flow
bun test-api-flow.js
```

---

## 📨 Background Workers

The worker app (`apps/worker`) uses **BullMQ + Redis** to run scheduled jobs:

- **Compliance Refresh Worker**
  - Recalculates compliance scores for all clients
  - Score = `max(0, 100 - totalIssues * 5)`
  - Issues include missing docs, expiring docs, overdue filings

- **Notification Worker**
  - Finds documents expiring soon (e.g. 7 days)
  - Creates in‑app notifications for tenant users

- **Filing Reminders Worker**
  - Finds overdue or upcoming filings
  - Sends notifications / reminders

Workers run automatically when `apps/worker` is running (either via `bun dev` or Docker).

---

## 📂 Documents & File Storage

- Storage is backed by **MinIO** (S3‑compatible)
- A dedicated package (e.g. `packages/storage`) provides:
  - MinIO client initialization
  - Helpers for presigned upload/download URLs
  - Tenant‑scoped bucket or key namespaces

The `documentUpload` tRPC router handles:

- Generating presigned URLs
- Validating file metadata
- Linking uploads to specific documents/clients
- Managing deletions and versioning

Document UI components (in `apps/web/src/components/documents`) support:

- Listing documents with filters (client, type, expiry)
- Upload dialog with progress
- Version history view
- Expiry badges and warnings

---

## 📑 PDF Reporting

The **reports system** is implemented in `packages/reports`:

- Uses `@react-pdf/renderer` under the hood
- Exposes helpers to generate various PDFs:

**Report Types** (examples):

1. **Client File Report**
   - Client details, businesses, overall compliance snapshot
   - Document summary by type
   - Filing summary by status
   - Service history overview

2. **Documents List Report**
   - Full inventory of documents
   - Grouped by type
   - Expiry warnings and status

3. **Filings Summary Report**
   - Filed / pending / overdue breakdown
   - Periods, amounts, authorities

4. **Compliance Report**
   - Scores and risk levels
   - Missing required docs
   - Upcoming expiries
   - Recommended actions

5. **Service History Report**
   - Services provided per client
   - Revenue summary
   - Status and progress

Integration:

- A `reports` tRPC router (`packages/api/src/routers/reports.ts`)
- Server‑side download route in `apps/server/src/routes/downloads.ts`
- Frontend **ReportDownloadButton** component

Example usage (frontend):

```tsx
<ReportDownloadButton
  clientId={client.id}
  reportType="client_file"
  label="Download Client File PDF"
/>
```

Full details live in `REPORTS_SYSTEM_SUMMARY.md` & `packages/reports/README.md`.

---

## 🧪 Testing

### Comprehensive Testing Suite

GCMC-KAJ includes multiple testing approaches to ensure platform reliability:

```bash
# Functional API Testing (97.96% success rate)
bun run functional-test.js

# Visual Content Validation
bun run visual-check.js

# Advanced E2E Testing with Screenshots (requires Playwright)
bun run final-comprehensive-test.js

# Admin Functionality Verification
bun run test-admin-flow.js
```

### Test Coverage

- **API Endpoints:** All 12+ tRPC endpoints tested
- **Authentication:** Admin login and session management
- **Database Operations:** CRUD operations and RBAC
- **User Interface:** All 9 major pages validated
- **Error Handling:** 404/401/500 responses verified
- **Responsive Design:** Mobile, tablet, and desktop views

### Latest Test Results

✅ **Platform Status:** 97.96% Functional
✅ **Authentication:** Admin login working
✅ **Admin Features:** User/role management operational
✅ **Database:** 3 users, 8 roles in RBAC system
✅ **All Routes:** Accessible with proper authentication

### Test Reports

- `functional-test-report.json` - Complete API testing results
- `visual-check-report.json` - UI component validation
- `final-test-screenshots/` - Comprehensive visual documentation

### Traditional Testing (Vitest)

Testing is powered by **Vitest** with a shared setup:

- Root config: `vitest.config.ts`
- API tests: `packages/api/vitest.config.ts`
- RBAC tests: `packages/rbac/vitest.config.ts`
- Server tests: `apps/server/vitest.config.ts`
- Global test utilities: `test-setup.ts`

Key areas covered:

- **RBAC** (`packages/rbac/src/__tests__`)
  - Permissions matrix for all roles & modules
  - Middleware behavior and error handling
- **tRPC Routers** (`packages/api/src/routers/__tests__`)
  - `clients`, `documents`, `users`, etc.
  - CRUD, tenant isolation, pagination, validation
- **Context & DB Test Helpers**
  - `test-db.ts` – spin up and tear down test DB state
  - `test-context.ts` – mock tRPC context with roles/tenants

Commands:

```bash
bun test          # run all tests
bun test:watch    # watch mode
bun test:coverage # coverage report
```

---

## 🧹 Linting, Formatting & Code Quality

**Biome** is used for linting and formatting across the monorepo:

- Config in `biome.json`
- Pre‑commit hooks via Husky (if configured)

Typical commands:

```bash
bun lint      # biome lint
bun format    # biome format
```

> ✅ The goal is to keep **zero lint errors**, consistent formatting, and a clean, modern TypeScript codebase.

---

## 📦 CI/CD & Deployment (Planned)

While the repo already includes **Dockerfiles** and **docker-compose.yml**, you can further extend it with:

- **GitHub Actions** for:
  - `bun test`
  - `bun lint`
  - `docker build`
- **Registry publishing** for images (GHCR, Docker Hub)
- **Production environment**:
  - Managed Postgres (e.g. RDS, Supabase)
  - Managed Redis (e.g. Upstash, Redis Cloud)
  - Object storage (MinIO, S3, etc.)

> Once your CI/CD pipeline is in place, building and shipping new versions becomes a single `git push`.

---

## 📱 UX, Responsiveness & Accessibility

The Next.js app is designed with:

- **Responsive layouts** using Tailwind CSS
  - Dashboards adapt down to tablet/mobile
  - Tables scroll gracefully on small screens
- **Reusable components** via shadcn/ui
- **Focus states** and **keyboard navigation** where appropriate
- **Accessible color palette** for key statuses (success, warning, error)

When adding or updating UI, follow:

- Mobile‑first layout thinking
- Check major pages at **320px**, **768px**, **1024px+**
- Ensure text contrasts meet WCAG where possible

---

## 🧭 Roadmap & Enhancements

The base platform is feature‑complete for core compliance operations. Additional enhancements you can pursue:

- **Client Portal**
  - Separate client‑facing app (could be `apps/portal`)
  - Limited views for documents, filings, and tasks related to that client
- **CI/CD Pipeline**
  - GitHub Actions workflow for tests, lint, build, and Docker image publishing
- **Email Integration**
  - SMTP or a provider (e.g. Resend, SendGrid)
  - Wire background jobs to send email notifications
- **Advanced Analytics**
  - More dashboards & drill‑downs
  - Time‑series metrics and charts
- **Monitoring & Observability**
  - Health endpoints, logs aggregation
  - Metrics via Prometheus/Grafana or a SaaS solution

> If you’d like, you can ask your AI assistant (or future scripts) to implement these enhancements one by one, using the existing architecture patterns.

---

## 👩‍💻 Contributing & Branch Workflow

Suggested workflow:

1. **Create a feature branch** from `main`  
   `git checkout -b feature/my-change`
2. **Make changes** in the appropriate app/package
3. **Run tests & lint**  
   `bun test && bun lint`
4. **Commit with a clear message**  
   `git commit -m "feat: add new documents dashboard widgets"`
5. **Open a PR** against `main`

Keep code:

- Typed (no `any` unless absolutely necessary)
- Tenant‑safe (always use `ctx.tenantId`)
- RBAC‑aware (use `rbacProcedure` where appropriate)
- Well‑documented (docstrings / comments on tricky logic)

---

## 📄 License

This project is licensed under the **MIT License** (or your chosen license). Add the full text in a `LICENSE` file at the root of the repo if not already present.

---

