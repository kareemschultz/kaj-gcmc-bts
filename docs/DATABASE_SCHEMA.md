# GCMC-KAJ Platform Database Schema

**Last Updated:** 2025-11-16
**Version:** 1.0.0

## Table of Contents

- [Overview](#overview)
- [Database Technology](#database-technology)
- [Schema Organization](#schema-organization)
- [Core Models](#core-models)
- [Entity Relationships](#entity-relationships)
- [Indexes & Performance](#indexes--performance)
- [Multi-Tenancy Strategy](#multi-tenancy-strategy)
- [Migration Strategy](#migration-strategy)

## Overview

The GCMC-KAJ Platform uses **PostgreSQL 16** with **Prisma ORM** for type-safe database access. The schema supports a **multi-tenant SaaS architecture** with comprehensive audit logging and RBAC.

### Database Statistics

- **Total Models:** 30
- **Authentication Models:** 4 (Better-Auth)
- **Business Logic Models:** 26
- **Total Indexes:** 100+
- **Unique Constraints:** 15+

### Key Features

- Multi-tenant data isolation
- Comprehensive audit trail
- Soft deletes with cascades
- Optimized indexes for common queries
- JSON fields for flexible metadata
- Full-text search support

## Database Technology

### PostgreSQL Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| **Version** | 16 (Alpine) | Latest stable release |
| **Port** | 5432 | Standard PostgreSQL port |
| **Database Name** | `gcmc_kaj` | Application database |
| **Encoding** | UTF-8 | Full Unicode support |
| **Timezone** | UTC | Consistent datetime handling |

### Prisma Configuration

```prisma
generator client {
  provider     = "prisma-client-js"
  output       = "../generated"
  moduleFormat = "esm"
  runtime      = "bun"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Connection String Format:**
```
postgresql://postgres:password@localhost:5432/gcmc_kaj
```

## Schema Organization

The schema is organized into **8 logical domains**:

### 1. Authentication (Better-Auth Models)

| Model | Purpose |
|-------|---------|
| `User` | User accounts and profiles |
| `Session` | User sessions |
| `Account` | OAuth and password accounts |
| `Verification` | Email verification tokens |

### 2. Multi-Tenant Core

| Model | Purpose |
|-------|---------|
| `Tenant` | Organization/company instances |
| `TenantUser` | User-tenant-role associations |
| `Role` | Tenant-specific roles |
| `Permission` | Role permissions (module:action) |

### 3. Client Management

| Model | Purpose |
|-------|---------|
| `Client` | Clients (individuals/companies) |
| `ClientBusiness` | Business entities owned by clients |
| `ClientPortalAccess` | Client portal access control |

### 4. Document Management

| Model | Purpose |
|-------|---------|
| `DocumentType` | Document type definitions |
| `Document` | Document records |
| `DocumentVersion` | Document file versions |

### 5. Filing Management

| Model | Purpose |
|-------|---------|
| `FilingType` | Filing type definitions (tax, regulatory) |
| `Filing` | Filing records |
| `FilingDocument` | Document-filing associations |
| `RecurringFiling` | Scheduled recurring filings |

### 6. Service Management

| Model | Purpose |
|-------|---------|
| `Service` | Service catalog |
| `ServiceRequestTemplate` | Service workflow templates |
| `ServiceRequest` | Service request instances |
| `ServiceStep` | Service request workflow steps |

### 7. Task & Communication

| Model | Purpose |
|-------|---------|
| `Task` | Internal tasks |
| `ClientTask` | Client-facing tasks |
| `Conversation` | Conversation threads |
| `Message` | Conversation messages |

### 8. Compliance & System

| Model | Purpose |
|-------|---------|
| `ComplianceRuleSet` | Rule set definitions |
| `ComplianceRule` | Individual rules |
| `ComplianceScore` | Client compliance scores |
| `RequirementBundle` | Grouped requirements |
| `RequirementBundleItem` | Bundle items |
| `Notification` | System notifications |
| `AuditLog` | Audit trail |
| `Plan` | Subscription plans |
| `Subscription` | Tenant subscriptions |

## Core Models

### Authentication Models

#### User

**Purpose:** Central user account model

```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  phone         String?
  avatarUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  sessions      Session[]
  accounts      Account[]
  tenantUsers   TenantUser[]
  // ... (business relations)
}
```

**Key Fields:**
- `id` - CUID for globally unique IDs
- `email` - Unique, used for authentication
- `emailVerified` - Email verification status

**Indexes:**
- `email` (unique)
- `createdAt` (for sorting)

#### Session

**Purpose:** User session management

```prisma
model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Indexes:**
- `userId` (lookup sessions by user)
- `expiresAt` (cleanup expired sessions)
- `token` (unique, for fast lookups)

### Multi-Tenant Models

#### Tenant

**Purpose:** Organization/company container

```prisma
model Tenant {
  id          Int      @id @default(autoincrement())
  name        String
  code        String   @unique
  contactInfo Json?
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // All business entities belong to tenant
  tenantUsers   TenantUser[]
  roles         Role[]
  clients       Client[]
  documents     Document[]
  // ... (all tenant-scoped relations)
}
```

**Key Fields:**
- `code` - Unique tenant identifier (slug)
- `contactInfo` - JSON for flexible contact details
- `settings` - JSON for tenant-specific configuration

**Unique Constraints:**
- `code` (business identifier)

#### TenantUser

**Purpose:** User-tenant-role association (many-to-many with role)

```prisma
model TenantUser {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  userId    String
  roleId    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Restrict)

  @@unique([tenantId, userId])
}
```

**Unique Constraints:**
- `[tenantId, userId]` - One role per user per tenant

**Indexes:**
- `userId` (user's tenants)
- `tenantId` (tenant's users)
- `roleId` (role membership)

#### Role & Permission

**Purpose:** RBAC implementation

```prisma
model Role {
  id          Int          @id @default(autoincrement())
  tenantId    Int
  name        String
  description String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  permissions Permission[]
  tenantUsers TenantUser[]
  tenant      Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, name])
}

model Permission {
  id        Int      @id @default(autoincrement())
  roleId    Int
  module    String   // e.g., "clients", "documents"
  action    String   // e.g., "view", "create", "edit", "delete"
  allowed   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, module, action])
}
```

**Permission Model:**
- Format: `module:action`
- Examples: `clients:view`, `documents:create`

### Client Management Models

#### Client

**Purpose:** Client records (individuals or companies)

```prisma
model Client {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  name      String
  type      String   // individual/company/partnership
  email     String?
  phone     String?
  address   String?
  tin       String?  // Tax Identification Number
  nisNumber String?  // National Insurance Number
  sector    String?
  riskLevel String?  // low/medium/high
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant           Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businesses       ClientBusiness[]
  documents        Document[]
  filings          Filing[]
  // ... (all client relations)
}
```

**Indexes:**
- `tenantId` (tenant isolation)
- `[tenantId, type]` (filter by type)
- `[tenantId, riskLevel]` (filter by risk)
- `[tenantId, sector]` (filter by sector)
- `createdAt` (chronological sorting)

#### ClientBusiness

**Purpose:** Business entities owned by clients

```prisma
model ClientBusiness {
  id                 Int       @id @default(autoincrement())
  tenantId           Int
  clientId           Int
  name               String
  registrationNumber String?
  registrationType   String?
  incorporationDate  DateTime?
  country            String?
  sector             String?
  status             String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  tenant  Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  client  Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  // ... (business relations)
}
```

**Indexes:**
- `tenantId` (tenant isolation)
- `clientId` (client's businesses)
- `[tenantId, clientId]` (composite lookup)
- `status` (filter by status)

### Document Management Models

#### DocumentType

**Purpose:** Document type taxonomy

```prisma
model DocumentType {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  name        String
  category    String   // license, permit, certificate, etc.
  description String?
  tags        String[] // Array field
  authority   String?  // Issuing authority
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant    Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  documents Document[]

  @@unique([tenantId, name, category])
}
```

**Unique Constraints:**
- `[tenantId, name, category]` - No duplicate types per tenant

#### Document & DocumentVersion

**Purpose:** Document records with version history

```prisma
model Document {
  id               Int      @id @default(autoincrement())
  tenantId         Int
  clientId         Int
  clientBusinessId Int?
  documentTypeId   Int
  title            String
  description      String?
  status           String   // valid, expired, pending_review, rejected
  authority        String?
  tags             String[]
  latestVersionId  Int?     @unique
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  tenant         Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  client         Client            @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientBusiness ClientBusiness?   @relation(fields: [clientBusinessId], references: [id], onDelete: SetNull)
  documentType   DocumentType      @relation(fields: [documentTypeId], references: [id], onDelete: Restrict)
  versions       DocumentVersion[]
  latestVersion  DocumentVersion?  @relation("LatestDocumentVersion", fields: [latestVersionId], references: [id], onDelete: SetNull)
}

model DocumentVersion {
  id               Int       @id @default(autoincrement())
  documentId       Int
  fileUrl          String
  storageProvider  String    // minio, s3, etc.
  fileSize         Int?
  mimeType         String?
  issueDate        DateTime?
  expiryDate       DateTime?
  issuingAuthority String?
  ocrText          String?   // OCR extracted text
  aiSummary        String?   // AI-generated summary
  metadata         Json?
  uploadedById     String?
  uploadedAt       DateTime  @default(now())
  isLatest         Boolean   @default(false)

  document         Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  latestOfDocument Document? @relation("LatestDocumentVersion")
}
```

**Key Features:**
- Version history tracking
- Latest version pointer
- OCR and AI summary support
- Expiry date tracking

**Indexes (Document):**
- `tenantId`, `clientId`, `clientBusinessId`, `documentTypeId`
- `status`, `[tenantId, status]`, `[clientId, status]`
- `[tenantId, clientId]` (composite)
- `createdAt` (chronological)

**Indexes (DocumentVersion):**
- `documentId`
- `[documentId, isLatest]` (get latest version)
- `[documentId, uploadedAt]` (chronological)
- `expiryDate` (find expiring documents)
- `isLatest` (filter latest versions)

### Filing Management Models

#### FilingType

**Purpose:** Tax and regulatory filing definitions

```prisma
model FilingType {
  id              Int      @id @default(autoincrement())
  tenantId        Int
  name            String
  code            String   // Unique code (e.g., GRA_VAT)
  authority       String   // GRA, NIS, DCRA, etc.
  frequency       String   // monthly/quarterly/annual/one_off
  defaultDueDay   Int?
  defaultDueMonth Int?
  description     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant           Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  filings          Filing[]
  recurringFilings RecurringFiling[]

  @@unique([tenantId, code])
}
```

**Unique Constraints:**
- `[tenantId, code]` - Unique filing type codes per tenant

**Indexes:**
- `tenantId`, `authority`, `frequency`

#### Filing

**Purpose:** Filing records (submissions to authorities)

```prisma
model Filing {
  id               Int       @id @default(autoincrement())
  tenantId         Int
  clientId         Int
  clientBusinessId Int?
  filingTypeId     Int
  periodStart      DateTime?
  periodEnd        DateTime?
  periodLabel      String?   // e.g., "Q1 2024"
  status           String    // draft, prepared, submitted, approved, rejected, overdue, archived
  referenceNumber  String?
  taxAmount        Float?
  penalties        Float?
  interest         Float?
  total            Float?
  submissionDate   DateTime?
  approvalDate     DateTime?
  internalNotes    String?
  aiSummary        String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  tenant         Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  client         Client           @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientBusiness ClientBusiness?  @relation(fields: [clientBusinessId], references: [id], onDelete: SetNull)
  filingType     FilingType       @relation(fields: [filingTypeId], references: [id], onDelete: Restrict)
  documents      FilingDocument[]
  serviceSteps   ServiceStep[]
  tasks          Task[]
}
```

**Indexes:**
- `tenantId`, `clientId`, `clientBusinessId`, `filingTypeId`
- `status`, `[tenantId, status]`, `[tenantId, status, periodEnd]`
- `periodEnd` (find upcoming filings)
- `submissionDate` (chronological)
- `createdAt` (chronological)

### Service Management Models

#### Service & ServiceRequest

**Purpose:** Service catalog and request management

```prisma
model Service {
  id            Int      @id @default(autoincrement())
  tenantId      Int
  name          String
  category      String   // registration, filing, advisory, etc.
  description   String?
  basePrice     Float?
  estimatedDays Int?
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tenant          Tenant                   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  serviceRequests ServiceRequest[]
  templates       ServiceRequestTemplate[]
}

model ServiceRequest {
  id               Int      @id @default(autoincrement())
  tenantId         Int
  clientId         Int
  clientBusinessId Int?
  serviceId        Int
  templateId       Int?
  status           String   // new, in_progress, awaiting_client, awaiting_authority, completed, cancelled
  priority         String?
  currentStepOrder Int?
  metadata         Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  tenant         Tenant                  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  client         Client                  @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientBusiness ClientBusiness?         @relation(fields: [clientBusinessId], references: [id], onDelete: SetNull)
  service        Service                 @relation(fields: [serviceId], references: [id], onDelete: Restrict)
  template       ServiceRequestTemplate? @relation(fields: [templateId], references: [id], onDelete: SetNull)
  steps          ServiceStep[]
  tasks          Task[]
  clientTasks    ClientTask[]
  conversations  Conversation[]
}
```

**Service Request Workflow:**
1. Create from service + template
2. Generate workflow steps
3. Track progress through steps
4. Complete or cancel

### Compliance Models

#### ComplianceScore

**Purpose:** Client compliance scoring

```prisma
model ComplianceScore {
  id                  Int      @id @default(autoincrement())
  tenantId            Int
  clientId            Int
  scoreValue          Float    // 0-100
  level               String   // excellent, good, fair, poor
  missingCount        Int
  expiringCount       Int
  overdueFilingsCount Int
  lastCalculatedAt    DateTime
  breakdown           Json?    // Detailed breakdown

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@unique([tenantId, clientId])
}
```

**Unique Constraints:**
- `[tenantId, clientId]` - One score per client

**Indexes:**
- `level` (filter by compliance level)
- `scoreValue` (sort by score)
- `lastCalculatedAt` (recalculation tracking)
- `[tenantId, level]` (tenant compliance distribution)

### System Models

#### AuditLog

**Purpose:** Comprehensive audit trail

```prisma
model AuditLog {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  actorUserId String?
  clientId    Int?
  entityType  String   // client, document, filing, etc.
  entityId    Int
  action      String   // create, update, delete
  changes     Json?    // Before/after data
  createdAt   DateTime @default(now())
  ipAddress   String?
  userAgent   String?

  tenant Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  actor  User?   @relation("AuditActor", fields: [actorUserId], references: [id], onDelete: SetNull)
  client Client? @relation(fields: [clientId], references: [id], onDelete: SetNull)
}
```

**Indexes:**
- `tenantId`, `actorUserId`, `clientId`, `entityType`, `action`
- `createdAt` (chronological)
- `[tenantId, createdAt]` (tenant audit trail)
- `[tenantId, actorUserId]` (user activity)
- `[tenantId, entityType]` (entity type filtering)

## Entity Relationships

### Core Relationship Diagram

```mermaid
erDiagram
    User ||--o{ TenantUser : has
    User ||--o{ Session : has
    User ||--o{ Account : has

    Tenant ||--o{ TenantUser : contains
    Tenant ||--o{ Role : has
    Tenant ||--o{ Client : manages

    TenantUser }o--|| Role : "assigned to"

    Role ||--o{ Permission : has

    Client ||--o{ ClientBusiness : owns
    Client ||--o{ Document : has
    Client ||--o{ Filing : has
    Client ||--o{ ServiceRequest : requests

    DocumentType ||--o{ Document : categorizes
    Document ||--o{ DocumentVersion : versions

    FilingType ||--o{ Filing : categorizes
    Filing ||--o{ FilingDocument : includes
    Document ||--o{ FilingDocument : "attached to"

    Service ||--o{ ServiceRequest : instances
    ServiceRequest ||--o{ ServiceStep : contains
    ServiceStep }o--|| Filing : "may create"

    Client ||--|| ComplianceScore : "scored by"
```

### Cascade Behavior

**On Delete Cascade:**
- `Tenant` deletion cascades to all tenant-scoped entities
- `Client` deletion cascades to businesses, documents, filings
- `Document` deletion cascades to versions
- `ServiceRequest` deletion cascades to steps

**On Delete SetNull:**
- Client business deletion sets nullable references to null
- User deletion sets audit log actor to null

**On Delete Restrict:**
- Cannot delete DocumentType if documents exist
- Cannot delete FilingType if filings exist
- Cannot delete Service if service requests exist
- Cannot delete Role if users assigned

## Indexes & Performance

### Index Strategy

**Primary Indexes:**
- All `id` fields (auto-indexed)
- All foreign keys (auto-indexed)

**Unique Indexes:**
- `User.email`
- `Session.token`
- `Tenant.code`
- `Role.[tenantId, name]`
- `Permission.[roleId, module, action]`
- `ComplianceScore.[tenantId, clientId]`

**Performance Indexes:**
- Tenant isolation: `tenantId` on all tenant-scoped models
- Date ranges: `createdAt`, `updatedAt`, `expiryDate`, `periodEnd`
- Status filtering: `status` fields
- Full-text search: Prepared for pg_trgm extension

### Query Optimization

**Composite Indexes for Common Queries:**

```sql
-- Client lookup by tenant
CREATE INDEX idx_client_tenant ON Client(tenantId);

-- Document expiry monitoring
CREATE INDEX idx_document_version_expiry ON DocumentVersion(expiryDate);

-- Filing deadlines
CREATE INDEX idx_filing_period_end ON Filing(tenantId, status, periodEnd);

-- User tasks
CREATE INDEX idx_task_assigned ON Task(assignedToId, status, dueDate);

-- Compliance score filtering
CREATE INDEX idx_compliance_level ON ComplianceScore(tenantId, level);
```

**Indexed Combinations:**
- `[tenantId, status]` - Filter by tenant and status
- `[tenantId, clientId]` - Client-specific data
- `[assignedToId, status, dueDate]` - User task management
- `[documentId, isLatest]` - Latest document version

## Multi-Tenancy Strategy

### Tenant Isolation

**Every business entity includes `tenantId`:**

```prisma
model Client {
  tenantId Int
  // ...
  tenant Tenant @relation(...)
  @@index([tenantId])
}
```

**Query Pattern:**

```typescript
// All queries MUST filter by tenantId
const clients = await prisma.client.findMany({
  where: { tenantId: ctx.tenantId },
});

// Enforced in tRPC middleware
```

### Shared vs Tenant-Scoped

**Shared Across Tenants:**
- `User` - Users can belong to multiple tenants
- `Plan` - Subscription plans are global

**Tenant-Scoped:**
- Everything else (Client, Document, Filing, etc.)

### Data Partitioning

**Current:** Single database with `tenantId` filtering

**Future Scalability Options:**
1. **Schema-per-tenant:** Create PostgreSQL schemas
2. **Database-per-tenant:** Separate databases
3. **Row-level security:** PostgreSQL RLS policies

## Migration Strategy

### Prisma Migrations

**Development Workflow:**

```bash
# Generate migration
bun run db:migrate

# Apply migration
prisma migrate deploy

# Reset database (dev only)
prisma migrate reset
```

**Production Workflow:**

```bash
# Generate SQL migration
prisma migrate dev --create-only

# Review generated SQL
cat prisma/migrations/*/migration.sql

# Apply to production
prisma migrate deploy
```

### Migration Files Location

```
packages/db/prisma/migrations/
├── 20240101000000_init/
│   └── migration.sql
├── 20240115000000_add_compliance/
│   └── migration.sql
└── migration_lock.toml
```

### Zero-Downtime Migrations

**Best Practices:**
1. **Additive Changes:** Add new columns/tables first
2. **Backfill Data:** Populate new columns
3. **Update Code:** Deploy code using new schema
4. **Remove Old:** Drop old columns/tables in next migration

**Example:**

```sql
-- Migration 1: Add new column (nullable)
ALTER TABLE clients ADD COLUMN risk_score INTEGER;

-- Backfill (separate script)
UPDATE clients SET risk_score = calculate_score(id);

-- Migration 2: Make non-nullable
ALTER TABLE clients ALTER COLUMN risk_score SET NOT NULL;
```

### Seed Data

**Development Seeds:**

```typescript
// packages/db/prisma/seed.ts
async function main() {
  // Create demo tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Demo Company",
      code: "demo",
    },
  });

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: "Administrator",
      permissions: {
        create: [
          { module: "clients", action: "view", allowed: true },
          { module: "clients", action: "create", allowed: true },
          // ...
        ],
      },
    },
  });
}
```

## Database Maintenance

### Regular Tasks

**Daily:**
- Monitor connection pool usage
- Check slow query log
- Verify backup completion

**Weekly:**
- Analyze query performance
- Review audit log growth
- Clean up expired sessions

**Monthly:**
- Vacuum and analyze tables
- Review index usage
- Archive old audit logs

### Performance Monitoring

**Key Metrics:**
- Query response time
- Connection pool utilization
- Table bloat
- Index hit ratio
- Cache hit ratio

### Backup Strategy

**Development:**
- Docker volume backups

**Production:**
- Continuous WAL archiving
- Daily full backups
- Point-in-time recovery enabled
- Offsite backup storage
- Retention: 30 days

## Cross-References

- **Project Structure:** See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- **Technology Stack:** See [TECH_STACK.md](./TECH_STACK.md)
- **API Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Deployment Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
