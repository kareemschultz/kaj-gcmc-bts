# Technical Architecture Guide

## 🏗️ System Architecture Deep Dive

### Turborepo Monorepo Structure

```mermaid
graph TB
    subgraph "Monorepo Root"
        ROOT[kaj-gcmc-bts/]
    end

    subgraph "Applications"
        WEB[apps/web<br/>Main SaaS Platform]
        PORTAL[apps/portal<br/>Client Portal]
        SERVER[apps/server<br/>API Gateway]
        WORKER[apps/worker<br/>Background Jobs]
    end

    subgraph "Shared Packages"
        API[packages/api<br/>tRPC Routes]
        AUTH[packages/auth<br/>Better-Auth Config]
        DB[packages/db<br/>Prisma Schema]
        RBAC[packages/rbac<br/>Role Definitions]
        TYPES[packages/types<br/>Shared Types]
        UI[packages/ui<br/>Shared Components]
        CONFIG[packages/config<br/>Environment Config]
        SECURITY[packages/security<br/>Security Middleware]
        REPORTS[packages/reports<br/>Report Generation]
        EMAIL[packages/email<br/>Email Templates]
        WORKERS[packages/workers<br/>Job Definitions]
        TOKENS[packages/ui-tokens<br/>Design Tokens]
    end

    ROOT --> WEB
    ROOT --> PORTAL
    ROOT --> SERVER
    ROOT --> WORKER

    WEB --> API
    WEB --> AUTH
    WEB --> DB
    WEB --> UI
    WEB --> TYPES

    PORTAL --> API
    PORTAL --> AUTH
    PORTAL --> UI

    SERVER --> API
    SERVER --> SECURITY
    SERVER --> CONFIG

    WORKER --> WORKERS
    WORKER --> EMAIL
    WORKER --> REPORTS

    style WEB fill:#e3f2fd
    style API fill:#e8f5e8
    style AUTH fill:#f3e5f5
    style SECURITY fill:#ffebee
```

### tRPC API Architecture

```mermaid
graph TB
    subgraph "Client Side"
        REACT[React Components]
        TRPC_CLIENT[tRPC Client]
        HOOKS[React Query Hooks]
    end

    subgraph "Network Layer"
        HTTP[HTTP/HTTPS]
        WS[WebSocket]
        SSE[Server-Sent Events]
    end

    subgraph "Server Side"
        TRPC_SERVER[tRPC Server]
        MIDDLEWARE[Middleware Stack]
        ROUTERS[API Routers]
    end

    subgraph "Business Layer"
        SERVICES[Application Services]
        DOMAIN[Domain Logic]
        EVENTS[Event Handlers]
    end

    subgraph "Data Layer"
        PRISMA[Prisma ORM]
        CACHE[Redis Cache]
        FILES[MinIO Storage]
    end

    REACT --> TRPC_CLIENT
    TRPC_CLIENT --> HOOKS
    HOOKS --> HTTP

    HTTP --> TRPC_SERVER
    WS --> TRPC_SERVER
    SSE --> TRPC_SERVER

    TRPC_SERVER --> MIDDLEWARE
    MIDDLEWARE --> ROUTERS

    ROUTERS --> SERVICES
    SERVICES --> DOMAIN
    SERVICES --> EVENTS

    DOMAIN --> PRISMA
    SERVICES --> CACHE
    SERVICES --> FILES

    style TRPC_CLIENT fill:#e3f2fd
    style TRPC_SERVER fill:#e8f5e8
    style SERVICES fill:#f3e5f5
    style PRISMA fill:#fff3e0
```

### Authentication & Session Management

```mermaid
sequenceDiagram
    participant Browser
    participant NextJS
    participant Auth
    participant Database
    participant Redis

    Browser->>NextJS: Login Request
    NextJS->>Auth: better-auth.signIn()

    Auth->>Database: Verify Credentials
    Database-->>Auth: User Data

    Auth->>Auth: Generate Session
    Auth->>Database: Store Session
    Auth->>Redis: Cache Session

    Auth->>NextJS: Set Cookies (httpOnly, secure)
    NextJS-->>Browser: Login Success + Cookies

    Note over Browser,Redis: Subsequent Requests

    Browser->>NextJS: API Request (with cookies)
    NextJS->>Auth: Verify Session
    Auth->>Redis: Check Cache

    alt Cache Hit
        Redis-->>Auth: Session Data
    else Cache Miss
        Auth->>Database: Query Session
        Database-->>Auth: Session Data
        Auth->>Redis: Update Cache
    end

    Auth-->>NextJS: Session Valid
    NextJS->>NextJS: Process Request
    NextJS-->>Browser: Response
```

### Background Job Processing

```mermaid
graph TB
    subgraph "Job Triggers"
        CRON[Scheduled Jobs]
        API[API Endpoints]
        EVENTS[Domain Events]
        WEBHOOKS[External Webhooks]
    end

    subgraph "Job Queue System"
        REDIS_QUEUE[Redis Queue]
        PRIORITY[Priority Queues]
        DELAY[Delayed Jobs]
        RECURRING[Recurring Jobs]
    end

    subgraph "Worker Processes"
        WORKER1[Worker Instance 1]
        WORKER2[Worker Instance 2]
        WORKER3[Worker Instance 3]
    end

    subgraph "Job Types"
        EMAIL_JOB[Email Sending]
        REPORT_JOB[Report Generation]
        FILING_JOB[Tax Filing Submission]
        CLEANUP_JOB[Data Cleanup]
        BACKUP_JOB[Database Backup]
    end

    subgraph "Monitoring"
        METRICS[Job Metrics]
        ALERTS[Failed Job Alerts]
        DASHBOARD[Admin Dashboard]
    end

    CRON --> REDIS_QUEUE
    API --> REDIS_QUEUE
    EVENTS --> REDIS_QUEUE
    WEBHOOKS --> REDIS_QUEUE

    REDIS_QUEUE --> PRIORITY
    REDIS_QUEUE --> DELAY
    REDIS_QUEUE --> RECURRING

    PRIORITY --> WORKER1
    PRIORITY --> WORKER2
    PRIORITY --> WORKER3

    WORKER1 --> EMAIL_JOB
    WORKER2 --> REPORT_JOB
    WORKER3 --> FILING_JOB
    WORKER1 --> CLEANUP_JOB
    WORKER2 --> BACKUP_JOB

    EMAIL_JOB --> METRICS
    REPORT_JOB --> METRICS
    FILING_JOB --> ALERTS
    CLEANUP_JOB --> DASHBOARD
    BACKUP_JOB --> DASHBOARD

    style REDIS_QUEUE fill:#fff3e0
    style WORKER1 fill:#e8f5e8
    style METRICS fill:#f3e5f5
```

### Document Management System

```mermaid
graph TB
    subgraph "Upload Flow"
        DRAG_DROP[Drag & Drop UI]
        VALIDATION[Client Validation]
        PROGRESS[Upload Progress]
    end

    subgraph "Processing Pipeline"
        RECEIVE[Receive File]
        VALIDATE_SERVER[Server Validation]
        SCAN[Virus Scan]
        OCR[OCR Processing]
        CLASSIFY[Auto Classification]
        INDEX[Search Indexing]
    end

    subgraph "Storage Layer"
        MINIO[MinIO Object Storage]
        METADATA[Document Metadata]
        THUMBNAILS[Thumbnail Generation]
        BACKUP[Backup Storage]
    end

    subgraph "Access Control"
        PERMISSIONS[Permission Check]
        ENCRYPTION[Encryption at Rest]
        AUDIT_LOG[Access Audit Log]
    end

    DRAG_DROP --> VALIDATION
    VALIDATION --> PROGRESS
    PROGRESS --> RECEIVE

    RECEIVE --> VALIDATE_SERVER
    VALIDATE_SERVER --> SCAN
    SCAN --> OCR
    OCR --> CLASSIFY
    CLASSIFY --> INDEX

    INDEX --> MINIO
    INDEX --> METADATA
    INDEX --> THUMBNAILS
    MINIO --> BACKUP

    MINIO --> PERMISSIONS
    PERMISSIONS --> ENCRYPTION
    ENCRYPTION --> AUDIT_LOG

    style DRAG_DROP fill:#e3f2fd
    style SCAN fill:#ffebee
    style MINIO fill:#e8f5e8
    style ENCRYPTION fill:#f3e5f5
```

## 🗄️ Database Design Patterns

### Multi-Tenant Data Isolation

```mermaid
graph TB
    subgraph "Application Layer"
        TENANT_CONTEXT[Tenant Context]
        MIDDLEWARE[Tenant Middleware]
    end

    subgraph "ORM Layer"
        PRISMA_CLIENT[Prisma Client]
        TENANT_FILTER[Automatic Tenant Filtering]
        RLS[Row Level Security]
    end

    subgraph "Database Layer"
        TENANT_COL[tenant_id Column]
        INDEXES[Tenant-based Indexes]
        POLICIES[RLS Policies]
    end

    subgraph "Security Checks"
        QUERY_INTERCEPT[Query Interception]
        TENANT_VERIFY[Tenant Verification]
        ACCESS_LOG[Access Logging]
    end

    TENANT_CONTEXT --> MIDDLEWARE
    MIDDLEWARE --> PRISMA_CLIENT
    PRISMA_CLIENT --> TENANT_FILTER
    TENANT_FILTER --> RLS

    RLS --> TENANT_COL
    RLS --> INDEXES
    RLS --> POLICIES

    TENANT_FILTER --> QUERY_INTERCEPT
    QUERY_INTERCEPT --> TENANT_VERIFY
    TENANT_VERIFY --> ACCESS_LOG

    style TENANT_CONTEXT fill:#e3f2fd
    style TENANT_FILTER fill:#f3e5f5
    style TENANT_VERIFY fill:#ffebee
```

### Database Connection Management

```mermaid
graph TB
    subgraph "Application Instances"
        APP1[App Instance 1]
        APP2[App Instance 2]
        APP3[App Instance 3]
    end

    subgraph "Connection Pool"
        POOL[PgBouncer Pool]
        ACTIVE[Active Connections]
        IDLE[Idle Connections]
        MAX[Max Connections: 100]
    end

    subgraph "Database Cluster"
        PRIMARY[Primary DB<br/>Read/Write]
        REPLICA1[Read Replica 1]
        REPLICA2[Read Replica 2]
    end

    subgraph "Monitoring"
        CONN_METRICS[Connection Metrics]
        SLOW_QUERY[Slow Query Log]
        DEADLOCK[Deadlock Detection]
    end

    APP1 --> POOL
    APP2 --> POOL
    APP3 --> POOL

    POOL --> ACTIVE
    POOL --> IDLE
    POOL --> MAX

    ACTIVE --> PRIMARY
    IDLE --> REPLICA1
    IDLE --> REPLICA2

    PRIMARY --> CONN_METRICS
    REPLICA1 --> SLOW_QUERY
    REPLICA2 --> DEADLOCK

    style PRIMARY fill:#e8f5e8
    style POOL fill:#fff3e0
    style CONN_METRICS fill:#f3e5f5
```

## 🔄 API Design Patterns

### Request/Response Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant Cache
    participant API
    participant DB

    Client->>Gateway: HTTP Request
    Gateway->>Auth: Validate Token
    Auth-->>Gateway: User Context

    Gateway->>Cache: Check Cache
    alt Cache Hit
        Cache-->>Gateway: Cached Data
        Gateway-->>Client: Response (304)
    else Cache Miss
        Gateway->>API: Forward Request
        API->>DB: Query Database
        DB-->>API: Data
        API->>Cache: Update Cache
        API-->>Gateway: Response
        Gateway-->>Client: Response (200)
    end

    Note over Client,DB: Error Handling
    alt Database Error
        DB-->>API: Error
        API->>API: Log Error
        API-->>Gateway: 500 Error
        Gateway-->>Client: Structured Error
    end
```

### Error Handling Strategy

```mermaid
graph TB
    subgraph "Error Types"
        VALIDATION[Validation Errors]
        AUTH_ERROR[Authentication Errors]
        BUSINESS[Business Logic Errors]
        SYSTEM[System Errors]
        EXTERNAL[External API Errors]
    end

    subgraph "Error Processing"
        CATCH[Error Catching]
        CLASSIFY[Error Classification]
        ENRICH[Error Enrichment]
        SANITIZE[Error Sanitization]
    end

    subgraph "Response Strategy"
        USER_MSG[User-friendly Message]
        DEV_INFO[Developer Information]
        CORRELATION[Correlation ID]
        RETRY[Retry Logic]
    end

    subgraph "Monitoring"
        LOG[Structured Logging]
        METRICS[Error Metrics]
        ALERT[Alert System]
        DASHBOARD[Error Dashboard]
    end

    VALIDATION --> CATCH
    AUTH_ERROR --> CATCH
    BUSINESS --> CATCH
    SYSTEM --> CATCH
    EXTERNAL --> CATCH

    CATCH --> CLASSIFY
    CLASSIFY --> ENRICH
    ENRICH --> SANITIZE

    SANITIZE --> USER_MSG
    SANITIZE --> DEV_INFO
    SANITIZE --> CORRELATION
    SANITIZE --> RETRY

    ENRICH --> LOG
    LOG --> METRICS
    METRICS --> ALERT
    ALERT --> DASHBOARD

    style VALIDATION fill:#fff3e0
    style SYSTEM fill:#ffebee
    style LOG fill:#f3e5f5
    style ALERT fill:#e3f2fd
```

## 📊 Performance Optimization

### Caching Hierarchy

```mermaid
graph TB
    subgraph "Browser Cache"
        BROWSER[Browser Cache<br/>Static Assets]
        SERVICE_WORKER[Service Worker<br/>App Shell]
    end

    subgraph "CDN Cache"
        CDN[CloudFlare CDN<br/>Global Edge Cache]
        STATIC[Static Assets Cache]
    end

    subgraph "Application Cache"
        L1[L1 - Memory Cache<br/>Hot Data]
        L2[L2 - Redis Cache<br/>Session & Query Cache]
        L3[L3 - Database Cache<br/>Query Result Cache]
    end

    subgraph "Database"
        QUERY_CACHE[Query Plan Cache]
        BUFFER[Buffer Pool]
        INDEXES[Optimized Indexes]
    end

    BROWSER --> CDN
    SERVICE_WORKER --> CDN
    CDN --> STATIC

    L1 -.->|5 min TTL| L2
    L2 -.->|1 hour TTL| L3
    L3 -.->|24 hour TTL| QUERY_CACHE

    QUERY_CACHE --> BUFFER
    BUFFER --> INDEXES

    style BROWSER fill:#e3f2fd
    style L1 fill:#e8f5e8
    style L2 fill:#fff3e0
    style QUERY_CACHE fill:#f3e5f5
```

### Load Balancing Strategy

```mermaid
graph TB
    subgraph "Global Load Balancer"
        GLB[CloudFlare Global LB]
        GEO[Geo-based Routing]
    end

    subgraph "Regional Load Balancer"
        RLB[Regional Load Balancer]
        HEALTH[Health Check]
        STICKY[Session Affinity]
    end

    subgraph "Application Tier"
        APP1[App Instance 1<br/>CPU: 60%]
        APP2[App Instance 2<br/>CPU: 45%]
        APP3[App Instance 3<br/>CPU: 30%]
        APP4[App Instance 4<br/>Standby]
    end

    subgraph "Auto Scaling"
        SCALE_UP[Scale Up Trigger<br/>CPU > 70%]
        SCALE_DOWN[Scale Down Trigger<br/>CPU < 30%]
        MIN[Min Instances: 2]
        MAX[Max Instances: 10]
    end

    GLB --> GEO
    GEO --> RLB
    RLB --> HEALTH
    RLB --> STICKY

    HEALTH --> APP1
    HEALTH --> APP2
    HEALTH --> APP3
    STICKY --> APP4

    APP1 --> SCALE_UP
    APP2 --> SCALE_DOWN
    SCALE_UP --> MIN
    SCALE_DOWN --> MAX

    style GLB fill:#e3f2fd
    style APP1 fill:#ffebee
    style APP3 fill:#e8f5e8
    style SCALE_UP fill:#fff3e0
```

## 🔐 Security Implementation

### OAuth 2.1 & OIDC Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant AuthServer
    participant ResourceServer

    User->>Client: Initiate Login
    Client->>AuthServer: Authorization Request<br/>(response_type=code, client_id, scope)
    AuthServer->>User: Login Challenge
    User->>AuthServer: Authenticate (MFA)
    AuthServer->>Client: Authorization Code

    Client->>AuthServer: Token Request<br/>(code, client_secret, PKCE)
    AuthServer->>AuthServer: Validate Code & PKCE
    AuthServer-->>Client: Access Token + ID Token + Refresh Token

    Client->>ResourceServer: API Request (Bearer Token)
    ResourceServer->>AuthServer: Validate Token
    AuthServer-->>ResourceServer: Token Info
    ResourceServer-->>Client: Protected Resource
    Client-->>User: Authorized Content

    Note over Client,AuthServer: Token Refresh
    Client->>AuthServer: Refresh Token Request
    AuthServer-->>Client: New Access Token
```

### Encryption Strategy

```mermaid
graph TB
    subgraph "Data in Transit"
        TLS13[TLS 1.3]
        CERT[SSL Certificates]
        HSTS[HSTS Headers]
    end

    subgraph "Data at Rest"
        AES256[AES-256 Encryption]
        KEY_VAULT[Key Management]
        FIELD_ENCRYPT[Field-level Encryption]
    end

    subgraph "Application Level"
        JWT[JWT Token Encryption]
        BCRYPT[Password Hashing]
        SALT[Salt Generation]
    end

    subgraph "Database Level"
        TDE[Transparent Data Encryption]
        BACKUP_ENCRYPT[Backup Encryption]
        LOG_ENCRYPT[Log File Encryption]
    end

    TLS13 --> CERT
    CERT --> HSTS
    HSTS --> AES256

    AES256 --> KEY_VAULT
    KEY_VAULT --> FIELD_ENCRYPT
    FIELD_ENCRYPT --> JWT

    JWT --> BCRYPT
    BCRYPT --> SALT
    SALT --> TDE

    TDE --> BACKUP_ENCRYPT
    BACKUP_ENCRYPT --> LOG_ENCRYPT

    style TLS13 fill:#e8f5e8
    style AES256 fill:#f3e5f5
    style JWT fill:#e3f2fd
    style TDE fill:#fff3e0
```

## 🎛️ Monitoring & Observability

### Application Monitoring Stack

```mermaid
graph TB
    subgraph "Application Metrics"
        APP_METRICS[Application Metrics]
        CUSTOM[Custom Business Metrics]
        PERF[Performance Metrics]
    end

    subgraph "Infrastructure Metrics"
        SYSTEM[System Metrics]
        DOCKER[Container Metrics]
        K8S[Kubernetes Metrics]
    end

    subgraph "Logging Pipeline"
        STRUCTURED[Structured Logging]
        AGGREGATION[Log Aggregation]
        SEARCH[Search & Analysis]
    end

    subgraph "Monitoring Tools"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana Dashboards]
        ELASTIC[Elastic Stack]
        JAEGER[Jaeger Tracing]
    end

    subgraph "Alerting"
        ALERT_MANAGER[Alert Manager]
        SLACK[Slack Integration]
        EMAIL_ALERT[Email Notifications]
        WEBHOOK[Webhook Alerts]
    end

    APP_METRICS --> PROMETHEUS
    CUSTOM --> PROMETHEUS
    PERF --> PROMETHEUS

    SYSTEM --> PROMETHEUS
    DOCKER --> PROMETHEUS
    K8S --> PROMETHEUS

    STRUCTURED --> AGGREGATION
    AGGREGATION --> SEARCH
    SEARCH --> ELASTIC

    PROMETHEUS --> GRAFANA
    PROMETHEUS --> JAEGER
    ELASTIC --> GRAFANA

    PROMETHEUS --> ALERT_MANAGER
    ALERT_MANAGER --> SLACK
    ALERT_MANAGER --> EMAIL_ALERT
    ALERT_MANAGER --> WEBHOOK

    style PROMETHEUS fill:#fff3e0
    style GRAFANA fill:#e8f5e8
    style ALERT_MANAGER fill:#ffebee
```

### Distributed Tracing

```mermaid
sequenceDiagram
    participant Frontend
    participant API_Gateway
    participant Auth_Service
    participant User_Service
    participant Database

    Note over Frontend,Database: Trace ID: abc123, Span Context

    Frontend->>API_Gateway: Request (Trace: abc123, Span: 1)
    API_Gateway->>Auth_Service: Validate Token (Trace: abc123, Span: 2)
    Auth_Service->>Database: Query User (Trace: abc123, Span: 3)
    Database-->>Auth_Service: User Data (Span: 3 end)
    Auth_Service-->>API_Gateway: Token Valid (Span: 2 end)

    API_Gateway->>User_Service: Get User Profile (Trace: abc123, Span: 4)
    User_Service->>Database: Query Profile (Trace: abc123, Span: 5)
    Database-->>User_Service: Profile Data (Span: 5 end)
    User_Service-->>API_Gateway: Profile Response (Span: 4 end)

    API_Gateway-->>Frontend: Complete Response (Span: 1 end)

    Note over Frontend,Database: Full trace: 45ms total<br/>Auth: 12ms, Profile: 23ms, DB: 18ms
```

---

## 📚 Implementation Notes

### Development Environment Setup

```bash
# Clone repository
git clone https://github.com/kareemschultz/kaj-gcmc-bts.git

# Install dependencies
bun install

# Setup environment
cp .env.example .env

# Database setup
bunx prisma generate
bunx prisma db push

# Start development servers
bun dev

# Run tests
bun test
bun test:e2e
```

### Production Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring dashboards configured
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Performance testing passed
- [ ] Health checks configured
- [ ] Rollback plan documented
- [ ] Team training completed

---

*This technical architecture documentation is part of the KAJ-GCMC BTS Platform enterprise upgrade.*