# System Architecture Documentation

> **KAJ-GCMC BTS Platform - Complete System Architecture Guide**
> **Version:** 1.0.0
> **Last Updated:** 2025-11-18

This document provides comprehensive documentation of the KAJ-GCMC Business Tax Services platform architecture, including system design, data flow, security architecture, and deployment patterns.

---

## 📚 Table of Contents

- [Architecture Overview](#architecture-overview)
- [System Components](#system-components)
- [Data Architecture](#data-architecture)
- [Security Architecture](#security-architecture)
- [Network Architecture](#network-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Integration Architecture](#integration-architecture)
- [Performance Architecture](#performance-architecture)
- [Monitoring Architecture](#monitoring-architecture)

---

## 🏗 Architecture Overview

### Design Principles

The KAJ-GCMC BTS platform follows these core architectural principles:

1. **Modularity**: Loosely coupled, highly cohesive components
2. **Scalability**: Horizontal and vertical scaling capabilities
3. **Security**: Defense-in-depth security strategy
4. **Reliability**: High availability and fault tolerance
5. **Maintainability**: Clear separation of concerns and clean code
6. **Performance**: Optimized for speed and efficiency

### High-Level Architecture

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "Client Layer"
        WEB[Web Application<br/>Next.js]
        MOBILE[Mobile App<br/>React Native]
        API_CLIENTS[API Clients<br/>Third-party]
    end

    subgraph "Load Balancer"
        LB[nginx Load Balancer<br/>SSL Termination]
    end

    subgraph "Application Layer"
        API[API Server<br/>Hono + tRPC]
        WORKER[Background Worker<br/>BullMQ]
        AUTH[Authentication<br/>Better-Auth]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Primary Database)]
        REDIS[(Redis<br/>Cache & Queue)]
        STORAGE[(MinIO<br/>Object Storage)]
    end

    subgraph "External Services"
        EMAIL[Email Service<br/>SMTP]
        GRA[GRA API<br/>Government Services]
        MONITORING[Monitoring<br/>Prometheus/Grafana]
    end

    WEB --> LB
    MOBILE --> LB
    API_CLIENTS --> LB

    LB --> API
    LB --> AUTH

    API --> DB
    API --> REDIS
    API --> STORAGE

    WORKER --> DB
    WORKER --> REDIS
    WORKER --> EMAIL
    WORKER --> GRA

    AUTH --> DB
    AUTH --> REDIS

    API --> MONITORING
    WORKER --> MONITORING
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript | User interface and client-side logic |
| **API** | Hono, tRPC, TypeScript | Type-safe API layer with runtime validation |
| **Authentication** | Better-Auth, Prisma | Session-based authentication with RBAC |
| **Database** | PostgreSQL 15+, Prisma ORM | Primary data storage with type-safe queries |
| **Cache** | Redis 7+, BullMQ | Caching layer and background job processing |
| **Storage** | MinIO (S3-compatible) | File storage for documents and reports |
| **Runtime** | Bun | High-performance JavaScript runtime |
| **Monitoring** | Prometheus, Grafana, Sentry | Application performance monitoring |

---

## 🧩 System Components

### Web Application (Frontend)

```mermaid
%%{init: {'theme': 'dark'}}%%
graph LR
    subgraph "Next.js Application"
        PAGES[Pages<br/>App Router]
        COMPONENTS[Components<br/>React + shadcn/ui]
        HOOKS[Hooks<br/>tRPC Client]
        UTILS[Utilities<br/>Shared Logic]
    end

    subgraph "State Management"
        TRPC[tRPC Client<br/>API State]
        REACT_QUERY[TanStack Query<br/>Server State]
        LOCAL[Local State<br/>React State]
    end

    subgraph "UI Layer"
        SHADCN[shadcn/ui<br/>Component Library]
        TAILWIND[Tailwind CSS<br/>Styling]
        ICONS[Lucide Icons<br/>Icon System]
    end

    PAGES --> COMPONENTS
    COMPONENTS --> HOOKS
    HOOKS --> TRPC
    TRPC --> REACT_QUERY
    COMPONENTS --> SHADCN
    SHADCN --> TAILWIND
```

#### Key Features
- **Server-Side Rendering (SSR)**: Optimal performance and SEO
- **Type Safety**: End-to-end TypeScript integration
- **Component Reusability**: Modular component architecture
- **Responsive Design**: Mobile-first design approach
- **Accessibility**: WCAG 2.1 AA compliance

### API Server (Backend)

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "API Layer"
        HONO[Hono Framework<br/>HTTP Server]
        TRPC_SERVER[tRPC Server<br/>Type-safe API]
        MIDDLEWARE[Middleware<br/>Auth, CORS, Rate Limiting]
    end

    subgraph "Business Logic"
        ROUTERS[tRPC Routers<br/>Feature Modules]
        SERVICES[Services<br/>Business Logic]
        VALIDATION[Validation<br/>Zod Schemas]
    end

    subgraph "Data Access"
        PRISMA[Prisma ORM<br/>Database Client]
        RBAC[RBAC System<br/>Permissions]
        AUDIT[Audit Logging<br/>Activity Tracking]
    end

    HONO --> TRPC_SERVER
    TRPC_SERVER --> MIDDLEWARE
    MIDDLEWARE --> ROUTERS
    ROUTERS --> SERVICES
    SERVICES --> VALIDATION
    SERVICES --> PRISMA
    PRISMA --> RBAC
    PRISMA --> AUDIT
```

#### API Architecture Patterns
- **tRPC Router Pattern**: Type-safe procedure definitions
- **Middleware Chain**: Request/response processing pipeline
- **Service Layer**: Business logic abstraction
- **Repository Pattern**: Data access abstraction
- **Event-Driven Architecture**: Asynchronous processing

### Background Worker System

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "Worker Processes"
        COMPLIANCE[Compliance Worker<br/>Score Calculation]
        NOTIFICATIONS[Notification Worker<br/>Email/SMS Alerts]
        FILINGS[Filing Worker<br/>Deadline Processing]
        REPORTS[Report Worker<br/>PDF Generation]
    end

    subgraph "Queue Management"
        BULLMQ[BullMQ<br/>Job Queue]
        SCHEDULER[Cron Scheduler<br/>Recurring Jobs]
        MONITOR[Queue Monitor<br/>Job Tracking]
    end

    subgraph "External Integrations"
        EMAIL_SVC[Email Service]
        GRA_API[GRA Integration]
        SMS_SVC[SMS Service]
        STORAGE_SVC[File Storage]
    end

    SCHEDULER --> BULLMQ
    BULLMQ --> COMPLIANCE
    BULLMQ --> NOTIFICATIONS
    BULLMQ --> FILINGS
    BULLMQ --> REPORTS

    NOTIFICATIONS --> EMAIL_SVC
    FILINGS --> GRA_API
    NOTIFICATIONS --> SMS_SVC
    REPORTS --> STORAGE_SVC

    MONITOR --> BULLMQ
```

---

## 🗄 Data Architecture

### Database Schema Overview

```mermaid
%%{init: {'theme': 'dark'}}%%
erDiagram
    TENANT ||--o{ USER : "has many"
    TENANT ||--o{ CLIENT : "has many"
    USER ||--o{ AUDIT_LOG : "creates"
    CLIENT ||--o{ DOCUMENT : "has many"
    CLIENT ||--o{ FILING : "has many"
    CLIENT ||--o{ SERVICE_REQUEST : "has many"
    CLIENT ||--o{ CLIENT_BUSINESS : "has many"
    DOCUMENT }o--|| DOCUMENT_TYPE : "belongs to"
    FILING }o--|| FILING_TYPE : "belongs to"
    SERVICE_REQUEST }o--|| SERVICE : "belongs to"
    USER }o--|| ROLE : "has"
    ROLE ||--o{ ROLE_PERMISSION : "has many"
    PERMISSION ||--o{ ROLE_PERMISSION : "belongs to"

    TENANT {
        string id PK
        string name
        string subdomain
        json contactInfo
        json settings
        datetime createdAt
        datetime updatedAt
    }

    USER {
        string id PK
        string tenantId FK
        string email
        string name
        string role
        boolean emailVerified
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
    }

    CLIENT {
        int id PK
        string tenantId FK
        string name
        string type
        string email
        string tin
        string nisNumber
        string riskLevel
        datetime createdAt
        datetime updatedAt
    }

    DOCUMENT {
        int id PK
        int clientId FK
        int documentTypeId FK
        string title
        string referenceNumber
        date issueDate
        date expiryDate
        string status
        datetime createdAt
        datetime updatedAt
    }

    FILING {
        int id PK
        int clientId FK
        int filingTypeId FK
        string period
        date dueDate
        decimal amount
        string status
        datetime submittedAt
        datetime createdAt
        datetime updatedAt
    }
```

### Data Flow Architecture

```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    participant Client as Web Client
    participant LB as Load Balancer
    participant API as API Server
    participant Auth as Auth Service
    participant DB as PostgreSQL
    participant Redis as Redis Cache
    participant Worker as Background Worker
    participant Storage as MinIO

    Client->>LB: HTTP Request
    LB->>API: Forward Request
    API->>Auth: Validate Session
    Auth->>Redis: Check Session
    Redis-->>Auth: Session Data
    Auth-->>API: User Context

    API->>Redis: Check Cache
    alt Cache Hit
        Redis-->>API: Cached Data
    else Cache Miss
        API->>DB: Query Database
        DB-->>API: Raw Data
        API->>Redis: Store in Cache
    end

    API-->>LB: Response
    LB-->>Client: HTTP Response

    Note over API, Worker: Async Processing
    API->>Worker: Queue Background Job
    Worker->>DB: Process Data
    Worker->>Storage: Store Files
    Worker->>Client: Send Notification
```

### Data Consistency Patterns

#### Multi-Tenant Data Isolation

```sql
-- All queries automatically include tenant isolation
SELECT * FROM clients
WHERE tenant_id = $1 AND id = $2;

-- Prisma middleware ensures tenant isolation
prisma.client.findMany({
  where: {
    tenantId: ctx.tenantId, // Automatically injected
    // other filters...
  }
});
```

#### Audit Trail Pattern

```typescript
// Automatic audit logging for all mutations
await prisma.$transaction(async (tx) => {
  const client = await tx.client.update({
    where: { id: clientId },
    data: updateData,
  });

  await tx.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      actorUserId: ctx.user.id,
      entityType: 'client',
      entityId: client.id,
      action: 'update',
      changes: { from: originalData, to: client },
    },
  });

  return client;
});
```

---

## 🔐 Security Architecture

### Defense in Depth Strategy

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "Perimeter Security"
        WAF[Web Application Firewall]
        DDoS[DDoS Protection]
        RATE[Rate Limiting]
    end

    subgraph "Application Security"
        AUTH[Authentication]
        RBAC[Role-Based Access Control]
        CSRF[CSRF Protection]
        XSS[XSS Prevention]
    end

    subgraph "Data Security"
        ENCRYPT[Data Encryption]
        HASH[Password Hashing]
        MASK[Data Masking]
        BACKUP[Secure Backups]
    end

    subgraph "Infrastructure Security"
        VPC[Private Networks]
        FW[Firewall Rules]
        TLS[TLS/SSL]
        SECRETS[Secret Management]
    end

    subgraph "Monitoring Security"
        SIEM[Security Monitoring]
        AUDIT[Audit Logging]
        ALERT[Threat Detection]
        FORENSICS[Incident Response]
    end

    WAF --> AUTH
    AUTH --> ENCRYPT
    RBAC --> VPC
    AUDIT --> SIEM
```

### Authentication Flow

```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    participant User as User
    participant Web as Web App
    participant Auth as Auth Service
    participant DB as Database
    participant Redis as Session Store

    User->>Web: Enter Credentials
    Web->>Auth: Login Request
    Auth->>DB: Validate User
    DB-->>Auth: User Data

    alt Valid Credentials
        Auth->>Redis: Create Session
        Auth->>Web: Set Session Cookie
        Web->>User: Redirect to Dashboard
    else Invalid Credentials
        Auth->>Web: Error Response
        Web->>User: Show Error
    end

    Note over User, Redis: Subsequent Requests
    User->>Web: Make Request
    Web->>Auth: Validate Session
    Auth->>Redis: Check Session
    Redis-->>Auth: Session Data
    Auth-->>Web: User Context
    Web-->>User: Authorized Response
```

### Role-Based Access Control (RBAC)

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "Roles Hierarchy"
        SUPER[SuperAdmin]
        FIRM[FirmAdmin]
        COMP_MGR[ComplianceManager]
        COMP_OFF[ComplianceOfficer]
        DOC_OFF[DocumentOfficer]
        FILING[FilingClerk]
        VIEWER[Viewer]
        CLIENT[ClientPortalUser]
    end

    subgraph "Permissions Matrix"
        CLIENTS[clients:*]
        DOCS[documents:*]
        FILINGS[filings:*]
        USERS[users:*]
        REPORTS[reports:*]
        ADMIN[admin:*]
    end

    SUPER --> ADMIN
    FIRM --> CLIENTS
    FIRM --> DOCS
    FIRM --> FILINGS
    FIRM --> USERS
    FIRM --> REPORTS

    COMP_MGR --> CLIENTS
    COMP_MGR --> DOCS
    COMP_MGR --> FILINGS
    COMP_MGR --> REPORTS

    COMP_OFF --> CLIENTS
    COMP_OFF --> DOCS
    COMP_OFF --> FILINGS

    DOC_OFF --> DOCS
    FILING --> FILINGS

    VIEWER --> CLIENTS
    VIEWER --> DOCS
    VIEWER --> FILINGS

    CLIENT --> CLIENTS
    CLIENT --> DOCS
```

### Data Protection Measures

#### Encryption at Rest

```typescript
// Database encryption configuration
const encryptedFields = {
  tin: encrypt(plainText, encryptionKey),
  nisNumber: encrypt(plainText, encryptionKey),
  bankAccount: encrypt(plainText, encryptionKey),
};

// Automatic encryption/decryption middleware
prisma.$use(async (params, next) => {
  if (params.action === 'create' || params.action === 'update') {
    if (params.args?.data) {
      params.args.data = encryptSensitiveFields(params.args.data);
    }
  }

  const result = await next(params);

  if (params.action === 'findMany' || params.action === 'findUnique') {
    return decryptSensitiveFields(result);
  }

  return result;
});
```

#### Data Masking

```typescript
// Sensitive data masking for logs and non-production environments
const maskSensitiveData = (data: any): any => {
  const sensitiveFields = ['tin', 'nisNumber', 'email', 'phone'];

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      sensitiveFields.includes(key) ? maskString(String(value)) : value
    ])
  );
};

// Usage in logging
logger.info('Client created', maskSensitiveData(clientData));
```

---

## 🌐 Network Architecture

### Production Network Topology

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "Internet"
        USERS[Users]
        APIS[API Clients]
    end

    subgraph "DMZ (Demilitarized Zone)"
        CDN[CloudFlare CDN]
        LB[Load Balancer]
        WAF[Web Application Firewall]
    end

    subgraph "Public Subnet"
        WEB1[Web Server 1]
        WEB2[Web Server 2]
        API1[API Server 1]
        API2[API Server 2]
    end

    subgraph "Private Subnet"
        DB_PRIMARY[(Database Primary)]
        DB_REPLICA[(Database Replica)]
        REDIS_PRIMARY[(Redis Primary)]
        REDIS_REPLICA[(Redis Replica)]
        STORAGE[(MinIO Cluster)]
    end

    subgraph "Management Subnet"
        BASTION[Bastion Host]
        MONITORING[Monitoring Stack]
        BACKUP[Backup Services]
    end

    USERS --> CDN
    APIS --> CDN
    CDN --> WAF
    WAF --> LB

    LB --> WEB1
    LB --> WEB2
    LB --> API1
    LB --> API2

    WEB1 --> DB_PRIMARY
    WEB2 --> DB_PRIMARY
    API1 --> DB_PRIMARY
    API2 --> DB_PRIMARY

    WEB1 --> REDIS_PRIMARY
    WEB2 --> REDIS_PRIMARY
    API1 --> REDIS_PRIMARY
    API2 --> REDIS_PRIMARY

    API1 --> STORAGE
    API2 --> STORAGE

    BASTION --> DB_PRIMARY
    BASTION --> REDIS_PRIMARY
    MONITORING --> WEB1
    MONITORING --> API1
```

### Security Groups and Firewall Rules

```yaml
Security Groups:
  web-tier:
    inbound:
      - port: 443 (HTTPS) from load-balancer
      - port: 80 (HTTP) from load-balancer
    outbound:
      - port: 5432 (PostgreSQL) to database-tier
      - port: 6379 (Redis) to cache-tier
      - port: 9000 (MinIO) to storage-tier

  api-tier:
    inbound:
      - port: 3000 (API) from load-balancer
      - port: 3001 (Web) from web-tier
    outbound:
      - port: 5432 (PostgreSQL) to database-tier
      - port: 6379 (Redis) to cache-tier
      - port: 9000 (MinIO) to storage-tier

  database-tier:
    inbound:
      - port: 5432 (PostgreSQL) from api-tier
      - port: 5432 (PostgreSQL) from bastion-host
    outbound:
      - port: 443 (HTTPS) for replication

  cache-tier:
    inbound:
      - port: 6379 (Redis) from api-tier
      - port: 6379 (Redis) from bastion-host
    outbound:
      - port: 6379 (Redis) for replication

  storage-tier:
    inbound:
      - port: 9000 (MinIO) from api-tier
      - port: 9001 (Console) from bastion-host
    outbound:
      - port: 9000 (MinIO) for replication
```

---

## 🚀 Deployment Architecture

### Container Architecture

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "Docker Containers"
        subgraph "Application Containers"
            WEB[gcmc-web<br/>Next.js App]
            API[gcmc-api<br/>Hono Server]
            WORKER[gcmc-worker<br/>BullMQ Worker]
        end

        subgraph "Infrastructure Containers"
            NGINX[nginx<br/>Reverse Proxy]
            DB[postgresql<br/>Database]
            REDIS[redis<br/>Cache & Queue]
            MINIO[minio<br/>Object Storage]
        end

        subgraph "Monitoring Containers"
            PROM[prometheus<br/>Metrics Collection]
            GRAFANA[grafana<br/>Visualization]
            ALERT[alertmanager<br/>Alerting]
        end
    end

    subgraph "Persistent Volumes"
        DB_VOL[database-data]
        REDIS_VOL[redis-data]
        MINIO_VOL[minio-data]
        LOG_VOL[application-logs]
    end

    WEB --> NGINX
    API --> NGINX
    API --> DB
    API --> REDIS
    API --> MINIO
    WORKER --> DB
    WORKER --> REDIS
    WORKER --> MINIO

    DB --> DB_VOL
    REDIS --> REDIS_VOL
    MINIO --> MINIO_VOL
    WEB --> LOG_VOL
    API --> LOG_VOL
    WORKER --> LOG_VOL

    PROM --> API
    PROM --> WORKER
    GRAFANA --> PROM
    ALERT --> PROM
```

### Kubernetes Deployment (Alternative)

```yaml
# Kubernetes deployment architecture
apiVersion: v1
kind: Namespace
metadata:
  name: gcmc-kaj

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gcmc-api
  template:
    metadata:
      labels:
        app: gcmc-api
    spec:
      containers:
      - name: api
        image: gcmc-kaj/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: gcmc-api
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

### High Availability Setup

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "Load Balancers"
        LB1[Primary LB]
        LB2[Secondary LB]
    end

    subgraph "Application Servers"
        API1[API Server 1<br/>Zone A]
        API2[API Server 2<br/>Zone B]
        API3[API Server 3<br/>Zone C]

        WEB1[Web Server 1<br/>Zone A]
        WEB2[Web Server 2<br/>Zone B]
        WEB3[Web Server 3<br/>Zone C]
    end

    subgraph "Database Cluster"
        DB_PRIMARY[(Primary DB<br/>Zone A)]
        DB_REPLICA1[(Replica 1<br/>Zone B)]
        DB_REPLICA2[(Replica 2<br/>Zone C)]
    end

    subgraph "Cache Cluster"
        REDIS_MASTER[(Redis Master<br/>Zone A)]
        REDIS_SLAVE1[(Redis Slave 1<br/>Zone B)]
        REDIS_SLAVE2[(Redis Slave 2<br/>Zone C)]
    end

    LB1 --> API1
    LB1 --> API2
    LB1 --> API3
    LB2 --> WEB1
    LB2 --> WEB2
    LB2 --> WEB3

    API1 --> DB_PRIMARY
    API2 --> DB_PRIMARY
    API3 --> DB_PRIMARY

    DB_PRIMARY --> DB_REPLICA1
    DB_PRIMARY --> DB_REPLICA2

    API1 --> REDIS_MASTER
    API2 --> REDIS_MASTER
    API3 --> REDIS_MASTER

    REDIS_MASTER --> REDIS_SLAVE1
    REDIS_MASTER --> REDIS_SLAVE2
```

---

## 🔌 Integration Architecture

### External Service Integrations

```mermaid
%%{init: {'theme': 'dark'}}%%
graph LR
    subgraph "KAJ-GCMC Platform"
        API[API Server]
        WORKER[Background Worker]
        WEB[Web Application]
    end

    subgraph "Government Services"
        GRA[Guyana Revenue Authority<br/>Tax Filing API]
        NIS[National Insurance Scheme<br/>Contribution API]
        DEEDS[Deeds Registry<br/>Property API]
        GO_INVEST[GO-Invest<br/>Investment API]
    end

    subgraph "Third-Party Services"
        EMAIL[Email Service<br/>SendGrid/SMTP]
        SMS[SMS Service<br/>Twilio]
        PAYMENT[Payment Gateway<br/>Stripe/PayPal]
        BACKUP[Backup Service<br/>AWS S3/Azure]
    end

    subgraph "Financial Services"
        BANKS[Banking APIs<br/>Local Banks]
        FOREX[Currency Exchange<br/>Exchange Rates]
        CREDIT[Credit Bureau<br/>Credit Checks]
    end

    API --> GRA
    API --> NIS
    API --> DEEDS
    API --> GO_INVEST

    WORKER --> EMAIL
    WORKER --> SMS
    API --> PAYMENT
    WORKER --> BACKUP

    API --> BANKS
    API --> FOREX
    API --> CREDIT

    WEB --> API
```

### Integration Patterns

#### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage
const graCircuitBreaker = new CircuitBreaker();

export async function submitToGRA(filingData: any) {
  return graCircuitBreaker.execute(async () => {
    return await graApi.submitFiling(filingData);
  });
}
```

#### Retry Pattern with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Maximum retries exceeded');
}
```

---

## ⚡ Performance Architecture

### Caching Strategy

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "Caching Layers"
        CDN[CDN Cache<br/>Static Assets]
        APP[Application Cache<br/>API Responses]
        DB_CACHE[Database Cache<br/>Query Results]
        SESSION[Session Cache<br/>User Data]
    end

    subgraph "Cache Storage"
        REDIS_CACHE[Redis Cluster<br/>Distributed Cache]
        MEMORY[In-Memory Cache<br/>Local Cache]
        BROWSER[Browser Cache<br/>Client Cache]
    end

    subgraph "Cache Patterns"
        READ_THROUGH[Read-Through]
        WRITE_THROUGH[Write-Through]
        WRITE_BEHIND[Write-Behind]
        CACHE_ASIDE[Cache-Aside]
    end

    CDN --> BROWSER
    APP --> REDIS_CACHE
    DB_CACHE --> MEMORY
    SESSION --> REDIS_CACHE

    APP --> READ_THROUGH
    DB_CACHE --> WRITE_THROUGH
    SESSION --> CACHE_ASIDE
```

### Database Optimization

```sql
-- Performance optimization strategies

-- Indexing strategy
CREATE INDEX CONCURRENTLY idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX CONCURRENTLY idx_documents_client_expiry ON documents(client_id, expiry_date);
CREATE INDEX CONCURRENTLY idx_filings_due_date ON filings(due_date) WHERE status = 'pending';

-- Partitioning for large tables
CREATE TABLE audit_logs_2024 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Connection pooling configuration
-- max_connections = 200
-- shared_buffers = 256MB
-- effective_cache_size = 4GB
-- work_mem = 8MB
-- maintenance_work_mem = 128MB
```

### Load Balancing Strategy

```nginx
upstream api_backend {
    least_conn;
    server api-1.internal:3000 max_fails=3 fail_timeout=30s weight=3;
    server api-2.internal:3000 max_fails=3 fail_timeout=30s weight=2;
    server api-3.internal:3000 max_fails=3 fail_timeout=30s weight=1;

    keepalive 32;
    keepalive_requests 100;
    keepalive_timeout 60s;
}

# Health check configuration
location /health {
    access_log off;
    proxy_pass http://api_backend;
    proxy_next_upstream error timeout http_502 http_503 http_504;
}
```

---

## 📊 Monitoring Architecture

### Observability Stack

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "Application Layer"
        APP1[API Server 1]
        APP2[API Server 2]
        WORKER1[Worker 1]
        WORKER2[Worker 2]
    end

    subgraph "Metrics Collection"
        PROMETHEUS[Prometheus<br/>Metrics Database]
        EXPORTERS[Node Exporters<br/>System Metrics]
        APP_METRICS[Application Metrics<br/>Custom Metrics]
    end

    subgraph "Logging"
        FLUENTD[Fluentd<br/>Log Aggregation]
        ELASTICSEARCH[Elasticsearch<br/>Log Storage]
        KIBANA[Kibana<br/>Log Analysis]
    end

    subgraph "Monitoring & Alerting"
        GRAFANA[Grafana<br/>Visualization]
        ALERTMANAGER[AlertManager<br/>Alert Routing]
        PAGERDUTY[PagerDuty<br/>Incident Management]
    end

    subgraph "Distributed Tracing"
        JAEGER[Jaeger<br/>Trace Collection]
        TEMPO[Tempo<br/>Trace Storage]
    end

    APP1 --> APP_METRICS
    APP2 --> APP_METRICS
    WORKER1 --> APP_METRICS
    WORKER2 --> APP_METRICS

    APP_METRICS --> PROMETHEUS
    EXPORTERS --> PROMETHEUS

    APP1 --> FLUENTD
    APP2 --> FLUENTD
    FLUENTD --> ELASTICSEARCH
    ELASTICSEARCH --> KIBANA

    PROMETHEUS --> GRAFANA
    PROMETHEUS --> ALERTMANAGER
    ALERTMANAGER --> PAGERDUTY

    APP1 --> JAEGER
    APP2 --> JAEGER
    JAEGER --> TEMPO
```

### Custom Metrics

```typescript
// Application metrics implementation
import { createPrometheusMetrics } from '@prometheus/client';

export const metrics = {
  // HTTP request metrics
  httpRequests: new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'tenant_id'],
  }),

  httpRequestDuration: new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'tenant_id'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  }),

  // Business metrics
  clientsTotal: new promClient.Gauge({
    name: 'clients_total',
    help: 'Total number of clients',
    labelNames: ['tenant_id', 'risk_level'],
  }),

  documentsExpiring: new promClient.Gauge({
    name: 'documents_expiring_total',
    help: 'Number of documents expiring soon',
    labelNames: ['tenant_id', 'document_type'],
  }),

  filingsDue: new promClient.Gauge({
    name: 'filings_due_total',
    help: 'Number of filings due',
    labelNames: ['tenant_id', 'filing_type'],
  }),

  // Queue metrics
  jobsProcessed: new promClient.Counter({
    name: 'jobs_processed_total',
    help: 'Total number of background jobs processed',
    labelNames: ['job_type', 'status'],
  }),

  queueSize: new promClient.Gauge({
    name: 'queue_size',
    help: 'Current queue size',
    labelNames: ['queue_name'],
  }),
};

// Middleware to collect HTTP metrics
export function metricsMiddleware() {
  return async (c: Context, next: Next) => {
    const start = Date.now();

    await next();

    const duration = (Date.now() - start) / 1000;
    const route = c.req.routePath || 'unknown';
    const method = c.req.method;
    const statusCode = c.res.status;
    const tenantId = c.get('tenantId') || 'unknown';

    metrics.httpRequests.inc({
      method,
      route,
      status_code: statusCode.toString(),
      tenant_id: tenantId,
    });

    metrics.httpRequestDuration.observe(
      { method, route, tenant_id: tenantId },
      duration
    );
  };
}
```

---

## 📋 Architecture Decision Records (ADRs)

### ADR-001: Technology Stack Selection

**Status:** Accepted
**Date:** 2025-11-18

**Decision:** Use Bun + Hono + tRPC + Prisma + PostgreSQL + Redis + MinIO

**Rationale:**
- **Performance**: Bun provides superior JavaScript runtime performance
- **Type Safety**: tRPC ensures end-to-end type safety
- **Developer Experience**: Prisma provides excellent TypeScript integration
- **Scalability**: PostgreSQL handles complex queries and high transaction volumes
- **Caching**: Redis provides high-performance caching and queue management

### ADR-002: Multi-Tenant Architecture

**Status:** Accepted
**Date:** 2025-11-18

**Decision:** Implement multi-tenancy using tenant ID in all data models

**Rationale:**
- **Data Isolation**: Strong tenant data separation for compliance
- **Scalability**: Single application instance serves multiple organizations
- **Cost Efficiency**: Reduced infrastructure costs compared to separate instances
- **Maintenance**: Single codebase for all tenants

### ADR-003: Authentication Strategy

**Status:** Accepted
**Date:** 2025-11-18

**Decision:** Use Better-Auth with session-based authentication and RBAC

**Rationale:**
- **Security**: Session-based auth is more secure for web applications
- **Integration**: Better-Auth integrates well with Prisma and tRPC
- **Flexibility**: RBAC provides fine-grained permission control
- **Compliance**: Meets regulatory requirements for audit trails

---

**Architecture Documentation Version:** 1.0.0
**Platform Version:** 1.0.0
**Last Updated:** 2025-11-18
**Next Review:** 2025-12-18

For architecture questions: [architecture@gcmc-kaj.com](mailto:architecture@gcmc-kaj.com)