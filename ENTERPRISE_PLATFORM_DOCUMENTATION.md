# KAJ-GCMC BTS Platform - Enterprise Documentation

## 📋 Overview

The KAJ-GCMC Business Tax Services (BTS) Platform is an enterprise-grade SaaS compliance solution designed specifically for business tax services in Guyana. This platform provides comprehensive tax compliance, document management, filing automation, and regulatory reporting capabilities.

## 🏗️ System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application<br/>Next.js 16]
        PORTAL[Portal Application<br/>Client Interface]
        MOBILE[Mobile App<br/>React Native]
    end

    subgraph "API Gateway"
        TRPC[tRPC API<br/>Type-safe APIs]
        REST[REST Endpoints<br/>External APIs]
        WS[WebSocket<br/>Real-time]
    end

    subgraph "Application Layer"
        AUTH[Better-Auth<br/>Authentication]
        API[API Package<br/>Business Logic]
        RBAC[RBAC Package<br/>Authorization]
        WORKER[Worker App<br/>Background Jobs]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Primary Database)]
        REDIS[(Redis<br/>Cache & Sessions)]
        MINIO[MinIO<br/>Object Storage]
        SEARCH[(Search Index<br/>ElasticSearch)]
    end

    subgraph "External Services"
        GRA[Guyana Revenue<br/>Authority API]
        EMAIL[Email Service<br/>SMTP/SES]
        SMS[SMS Gateway<br/>Notifications]
        PAYMENT[Payment Gateway<br/>Stripe/PayPal]
    end

    WEB --> TRPC
    PORTAL --> TRPC
    MOBILE --> REST

    TRPC --> AUTH
    TRPC --> API
    REST --> API
    WS --> API

    AUTH --> DB
    API --> DB
    API --> REDIS
    API --> MINIO
    WORKER --> DB
    WORKER --> REDIS

    API --> GRA
    WORKER --> EMAIL
    WORKER --> SMS
    API --> PAYMENT

    style WEB fill:#e1f5fe
    style API fill:#f3e5f5
    style DB fill:#e8f5e8
    style REDIS fill:#fff3e0
```

### Domain-Driven Design Architecture

```mermaid
graph TB
    subgraph "Client Domain"
        CLIENT_ENTITY[Client Entity]
        CLIENT_REPO[Client Repository]
        CLIENT_SERVICE[Client Service]
        CLIENT_EVENTS[Client Events]
    end

    subgraph "Document Domain"
        DOC_ENTITY[Document Entity]
        DOC_REPO[Document Repository]
        DOC_SERVICE[Document Service]
        DOC_EVENTS[Document Events]
    end

    subgraph "Filing Domain"
        FILING_ENTITY[Filing Entity]
        FILING_REPO[Filing Repository]
        FILING_SERVICE[Filing Service]
        FILING_EVENTS[Filing Events]
    end

    subgraph "Compliance Domain"
        COMP_ENTITY[Compliance Entity]
        COMP_REPO[Compliance Repository]
        COMP_SERVICE[Compliance Service]
        COMP_EVENTS[Compliance Events]
    end

    subgraph "Shared Kernel"
        DOMAIN_EVENTS[Domain Event Bus]
        VALUE_OBJECTS[Value Objects]
        SPECIFICATIONS[Business Rules]
        POLICIES[Domain Policies]
    end

    subgraph "Infrastructure"
        DATABASE[Database Layer]
        CACHE[Caching Layer]
        EXTERNAL[External APIs]
        MESSAGING[Message Queue]
    end

    CLIENT_SERVICE --> CLIENT_REPO
    CLIENT_SERVICE --> CLIENT_EVENTS
    CLIENT_EVENTS --> DOMAIN_EVENTS

    DOC_SERVICE --> DOC_REPO
    DOC_SERVICE --> DOC_EVENTS
    DOC_EVENTS --> DOMAIN_EVENTS

    FILING_SERVICE --> FILING_REPO
    FILING_SERVICE --> FILING_EVENTS
    FILING_EVENTS --> DOMAIN_EVENTS

    COMP_SERVICE --> COMP_REPO
    COMP_SERVICE --> COMP_EVENTS
    COMP_EVENTS --> DOMAIN_EVENTS

    CLIENT_REPO --> DATABASE
    DOC_REPO --> DATABASE
    FILING_REPO --> DATABASE
    COMP_REPO --> DATABASE

    DOMAIN_EVENTS --> MESSAGING

    style CLIENT_ENTITY fill:#e3f2fd
    style DOC_ENTITY fill:#f1f8e9
    style FILING_ENTITY fill:#fff3e0
    style COMP_ENTITY fill:#fce4ec
    style DOMAIN_EVENTS fill:#f3e5f5
```

## 🔒 Security Architecture

### Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant A as Auth Service
    participant R as RBAC Service
    participant D as Database
    participant C as Cache

    U->>W: Login Request
    W->>A: Authenticate(email, password)
    A->>D: Validate User Credentials
    D-->>A: User Data + Salt/Hash
    A->>A: Verify Password + MFA

    alt Authentication Success
        A->>D: Create Session
        A->>C: Cache Session Data
        A->>R: Get User Permissions
        R->>D: Query User Roles + Tenant
        D-->>R: Role & Permission Data
        R-->>A: Permissions Object
        A-->>W: JWT Token + Session Cookie
        W-->>U: Login Success + Dashboard
    else Authentication Failed
        A->>C: Log Failed Attempt
        A->>A: Check Account Lockout
        A-->>W: Authentication Error
        W-->>U: Error Message
    end

    Note over A,C: Progressive Lockout:<br/>5 attempts = 5 min<br/>10 attempts = 30 min<br/>15+ attempts = 24 hours
```

### Multi-Tenant Security Model

```mermaid
graph TB
    subgraph "Tenant A"
        TA_USERS[Users A]
        TA_DATA[Data A]
        TA_ROLES[Roles A]
    end

    subgraph "Tenant B"
        TB_USERS[Users B]
        TB_DATA[Data B]
        TB_ROLES[Roles B]
    end

    subgraph "Security Layer"
        TENANT_GUARD[Tenant Isolation Guard]
        ROW_LEVEL[Row Level Security]
        API_AUTH[API Authorization]
        DATA_ENCRYPTION[Data Encryption]
    end

    subgraph "Database Layer"
        TENANT_ID[Tenant ID Column]
        RLS_POLICIES[RLS Policies]
        ENCRYPTED_FIELDS[Encrypted Columns]
    end

    TA_USERS --> TENANT_GUARD
    TB_USERS --> TENANT_GUARD
    TENANT_GUARD --> ROW_LEVEL
    ROW_LEVEL --> TENANT_ID
    ROW_LEVEL --> RLS_POLICIES

    API_AUTH --> DATA_ENCRYPTION
    DATA_ENCRYPTION --> ENCRYPTED_FIELDS

    style TENANT_GUARD fill:#ffebee
    style ROW_LEVEL fill:#f3e5f5
    style DATA_ENCRYPTION fill:#e8f5e8
```

## 💾 Data Architecture

### Database Schema Overview

```mermaid
erDiagram
    TENANT {
        int id PK
        string name
        string code
        json contact_info
        json settings
        datetime created_at
        datetime updated_at
    }

    USER {
        string id PK
        string email UK
        string name
        string password_hash
        boolean email_verified
        datetime created_at
        datetime updated_at
    }

    TENANT_USER {
        int id PK
        string user_id FK
        int tenant_id FK
        int role_id FK
        datetime created_at
    }

    ROLE {
        int id PK
        int tenant_id FK
        string name
        string description
        datetime created_at
    }

    PERMISSION {
        int id PK
        int role_id FK
        string module
        string action
        boolean allowed
    }

    CLIENT {
        int id PK
        int tenant_id FK
        string name
        string tin
        string email
        json contact_info
        datetime created_at
        datetime updated_at
    }

    DOCUMENT {
        int id PK
        int client_id FK
        string title
        string file_path
        string mime_type
        int file_size
        datetime created_at
    }

    FILING {
        int id PK
        int client_id FK
        string type
        string status
        json data
        datetime due_date
        datetime filed_date
    }

    SERVICE_REQUEST {
        int id PK
        int client_id FK
        int service_id FK
        string status
        json workflow_data
        datetime created_at
    }

    TENANT ||--o{ ROLE : "has"
    TENANT ||--o{ TENANT_USER : "has"
    TENANT ||--o{ CLIENT : "has"

    USER ||--o{ TENANT_USER : "belongs to"
    ROLE ||--o{ PERMISSION : "has"
    ROLE ||--o{ TENANT_USER : "assigned to"

    CLIENT ||--o{ DOCUMENT : "has"
    CLIENT ||--o{ FILING : "has"
    CLIENT ||--o{ SERVICE_REQUEST : "requests"
```

### Caching Strategy

```mermaid
graph TB
    subgraph "Application Layer"
        APP[Application Code]
    end

    subgraph "L1 Cache - In-Memory"
        MEM_USER[User Data]
        MEM_PERM[Permissions]
        MEM_CONFIG[Configuration]
    end

    subgraph "L2 Cache - Redis"
        REDIS_SESSION[Sessions]
        REDIS_QUERY[Query Results]
        REDIS_COMPUTED[Computed Data]
    end

    subgraph "Database"
        POSTGRES[PostgreSQL]
    end

    APP --> MEM_USER
    APP --> MEM_PERM
    APP --> MEM_CONFIG

    APP --> REDIS_SESSION
    APP --> REDIS_QUERY
    APP --> REDIS_COMPUTED

    APP --> POSTGRES

    MEM_USER -.->|TTL: 5min| REDIS_SESSION
    REDIS_QUERY -.->|TTL: 1hour| POSTGRES
    REDIS_COMPUTED -.->|TTL: 24hour| POSTGRES

    style MEM_USER fill:#e3f2fd
    style REDIS_SESSION fill:#fff3e0
    style POSTGRES fill:#e8f5e8
```

## 🔄 Business Process Flows

### Client Onboarding Workflow

```mermaid
sequenceDiagram
    participant C as Client
    participant P as Portal
    participant S as System
    participant A as Admin
    participant GRA as GRA API

    C->>P: Submit Registration
    P->>S: Create Client Record
    S->>S: Validate TIN Format
    S->>GRA: Verify Business Registration
    GRA-->>S: Business Details

    alt Verification Success
        S->>S: Create Client Account
        S->>S: Generate Welcome Email
        S-->>A: Notify Admin of New Client
        S-->>C: Account Created Successfully

        C->>P: Upload Required Documents
        P->>S: Store Documents in MinIO
        S->>S: Process Document OCR
        S->>A: Request Document Review

        A->>S: Approve/Reject Documents
        alt Documents Approved
            S-->>C: Account Fully Activated
            S->>S: Setup Default Services
        else Documents Rejected
            S-->>C: Request Document Corrections
        end
    else Verification Failed
        S-->>C: Registration Error
    end
```

### Tax Filing Process

```mermaid
flowchart TD
    START([Start Filing Process]) --> CHECK_DUE[Check Due Dates]
    CHECK_DUE --> COLLECT[Collect Required Data]
    COLLECT --> VALIDATE[Validate Data Completeness]

    VALIDATE -->|Valid| GENERATE[Generate Filing Forms]
    VALIDATE -->|Invalid| REQUEST_INFO[Request Missing Information]
    REQUEST_INFO --> COLLECT

    GENERATE --> REVIEW[Client Review Period]
    REVIEW -->|Approved| SUBMIT_GRA[Submit to GRA API]
    REVIEW -->|Changes| MODIFY[Modify Forms]
    MODIFY --> VALIDATE

    SUBMIT_GRA -->|Success| CONFIRM[Filing Confirmed]
    SUBMIT_GRA -->|Error| RETRY[Retry Logic]
    RETRY --> SUBMIT_GRA

    CONFIRM --> ARCHIVE[Archive Documents]
    ARCHIVE --> NOTIFY[Notify Client]
    NOTIFY --> END([End Process])

    style START fill:#e8f5e8
    style CONFIRM fill:#e3f2fd
    style END fill:#f3e5f5
    style RETRY fill:#fff3e0
```

### Document Processing Pipeline

```mermaid
graph TD
    UPLOAD[Document Upload] --> VALIDATE[File Validation]
    VALIDATE -->|Pass| SCAN[Virus Scan]
    VALIDATE -->|Fail| REJECT[Reject Upload]

    SCAN -->|Clean| STORE[Store in MinIO]
    SCAN -->|Infected| QUARANTINE[Quarantine File]

    STORE --> OCR[OCR Processing]
    OCR --> EXTRACT[Extract Metadata]
    EXTRACT --> CLASSIFY[Auto-Classify Document]

    CLASSIFY --> INDEX[Add to Search Index]
    INDEX --> NOTIFY[Notify Stakeholders]

    NOTIFY --> AUDIT[Log Audit Trail]
    AUDIT --> COMPLETE[Processing Complete]

    style UPLOAD fill:#e3f2fd
    style STORE fill:#e8f5e8
    style COMPLETE fill:#f3e5f5
    style QUARANTINE fill:#ffebee
```

## 🚀 Deployment Architecture

### Production Infrastructure

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[NGINX/CloudFlare]
    end

    subgraph "Application Tier"
        WEB1[Web App Instance 1]
        WEB2[Web App Instance 2]
        API1[API Instance 1]
        API2[API Instance 2]
        WORKER1[Worker Instance 1]
        WORKER2[Worker Instance 2]
    end

    subgraph "Database Tier"
        PG_PRIMARY[PostgreSQL Primary]
        PG_REPLICA[PostgreSQL Replica]
        REDIS_CLUSTER[Redis Cluster]
    end

    subgraph "Storage Tier"
        MINIO_CLUSTER[MinIO Cluster]
        BACKUP[Backup Storage]
    end

    subgraph "Monitoring"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        LOGS[Centralized Logging]
    end

    LB --> WEB1
    LB --> WEB2
    LB --> API1
    LB --> API2

    WEB1 --> PG_PRIMARY
    WEB2 --> PG_PRIMARY
    API1 --> PG_PRIMARY
    API2 --> PG_REPLICA

    WORKER1 --> PG_PRIMARY
    WORKER2 --> PG_PRIMARY

    WEB1 --> REDIS_CLUSTER
    WEB2 --> REDIS_CLUSTER
    API1 --> REDIS_CLUSTER
    API2 --> REDIS_CLUSTER

    API1 --> MINIO_CLUSTER
    API2 --> MINIO_CLUSTER

    PG_PRIMARY --> BACKUP
    MINIO_CLUSTER --> BACKUP

    ALL_SERVICES -.-> PROMETHEUS
    PROMETHEUS --> GRAFANA
    ALL_SERVICES -.-> LOGS

    style LB fill:#e3f2fd
    style PG_PRIMARY fill:#e8f5e8
    style REDIS_CLUSTER fill:#fff3e0
    style BACKUP fill:#f3e5f5
```

### CI/CD Pipeline

```mermaid
graph LR
    DEV[Developer] --> GIT[Git Push]
    GIT --> WEBHOOK[GitHub Webhook]

    WEBHOOK --> BUILD[Build & Test]
    BUILD --> SECURITY[Security Scan]
    SECURITY --> QUALITY[Quality Gates]

    QUALITY -->|Pass| STAGING[Deploy to Staging]
    QUALITY -->|Fail| NOTIFY_DEV[Notify Developer]

    STAGING --> E2E[E2E Tests]
    E2E -->|Pass| APPROVE[Manual Approval]
    E2E -->|Fail| ROLLBACK[Rollback Staging]

    APPROVE --> PROD[Deploy to Production]
    PROD --> MONITOR[Monitor Deployment]
    MONITOR --> HEALTH[Health Checks]

    HEALTH -->|Healthy| SUCCESS[Deployment Success]
    HEALTH -->|Unhealthy| AUTO_ROLLBACK[Auto Rollback]

    style BUILD fill:#e3f2fd
    style STAGING fill:#fff3e0
    style PROD fill:#e8f5e8
    style AUTO_ROLLBACK fill:#ffebee
```

## 📊 Performance & Monitoring

### Application Metrics Dashboard

```mermaid
graph TB
    subgraph "Business Metrics"
        USERS[Active Users]
        FILINGS[Filings Processed]
        REVENUE[Revenue Metrics]
        SATISFACTION[Client Satisfaction]
    end

    subgraph "Technical Metrics"
        RESPONSE[Response Times]
        ERRORS[Error Rates]
        THROUGHPUT[Request Throughput]
        AVAILABILITY[System Availability]
    end

    subgraph "Infrastructure Metrics"
        CPU[CPU Usage]
        MEMORY[Memory Usage]
        DISK[Disk Usage]
        NETWORK[Network I/O]
    end

    subgraph "Database Metrics"
        QUERY_TIME[Query Performance]
        CONNECTIONS[Connection Pool]
        DEADLOCKS[Deadlock Detection]
        REPLICATION[Replication Lag]
    end

    subgraph "Alerting System"
        SLACK[Slack Notifications]
        EMAIL_ALERT[Email Alerts]
        PAGERDUTY[PagerDuty]
        WEBHOOK_ALERT[Webhook Alerts]
    end

    RESPONSE --> EMAIL_ALERT
    ERRORS --> PAGERDUTY
    AVAILABILITY --> SLACK
    CPU --> WEBHOOK_ALERT
    QUERY_TIME --> EMAIL_ALERT

    style USERS fill:#e3f2fd
    style RESPONSE fill:#e8f5e8
    style CPU fill:#fff3e0
    style QUERY_TIME fill:#f3e5f5
    style PAGERDUTY fill:#ffebee
```

## 🔧 Development Guidelines

### Code Architecture Layers

```mermaid
graph TB
    subgraph "Presentation Layer"
        COMPONENTS[React Components]
        PAGES[Next.js Pages]
        HOOKS[Custom Hooks]
    end

    subgraph "Application Layer"
        TRPC_ROUTES[tRPC Routers]
        MIDDLEWARE[Middleware]
        VALIDATION[Input Validation]
    end

    subgraph "Domain Layer"
        ENTITIES[Domain Entities]
        SERVICES[Domain Services]
        EVENTS[Domain Events]
        POLICIES[Business Rules]
    end

    subgraph "Infrastructure Layer"
        REPOSITORIES[Data Repositories]
        EXTERNAL_API[External APIs]
        CACHING[Caching Layer]
        LOGGING[Logging Service]
    end

    COMPONENTS --> HOOKS
    PAGES --> TRPC_ROUTES
    HOOKS --> TRPC_ROUTES

    TRPC_ROUTES --> MIDDLEWARE
    MIDDLEWARE --> VALIDATION
    VALIDATION --> SERVICES

    SERVICES --> ENTITIES
    SERVICES --> EVENTS
    SERVICES --> POLICIES

    SERVICES --> REPOSITORIES
    REPOSITORIES --> EXTERNAL_API
    REPOSITORIES --> CACHING
    REPOSITORIES --> LOGGING

    style COMPONENTS fill:#e3f2fd
    style SERVICES fill:#e8f5e8
    style REPOSITORIES fill:#fff3e0
    style POLICIES fill:#f3e5f5
```

## 🛡️ Security Implementation

### Data Protection Strategy

```mermaid
graph TB
    subgraph "Data Classification"
        PUBLIC[Public Data]
        INTERNAL[Internal Data]
        CONFIDENTIAL[Confidential Data]
        RESTRICTED[Restricted Data]
    end

    subgraph "Encryption Strategy"
        TRANSIT[TLS 1.3 in Transit]
        REST[AES-256 at Rest]
        APPLICATION[Application Level]
        DATABASE[Database Level]
    end

    subgraph "Access Controls"
        RBAC_SYSTEM[RBAC Authorization]
        MFA[Multi-Factor Auth]
        API_KEYS[API Key Management]
        AUDIT[Audit Logging]
    end

    subgraph "Compliance"
        GDPR[GDPR Compliance]
        SOC2[SOC 2 Controls]
        ISO27001[ISO 27001]
        LOCAL_REG[Guyana Regulations]
    end

    PUBLIC --> TRANSIT
    INTERNAL --> TRANSIT
    CONFIDENTIAL --> APPLICATION
    RESTRICTED --> DATABASE

    TRANSIT --> RBAC_SYSTEM
    REST --> MFA
    APPLICATION --> API_KEYS
    DATABASE --> AUDIT

    RBAC_SYSTEM --> GDPR
    MFA --> SOC2
    API_KEYS --> ISO27001
    AUDIT --> LOCAL_REG

    style RESTRICTED fill:#ffebee
    style DATABASE fill:#f3e5f5
    style AUDIT fill:#e8f5e8
    style GDPR fill:#e3f2fd
```

---

## 📚 Additional Resources

- [API Documentation](./api/README.md)
- [Security Guidelines](./docs/security.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Architecture Decision Records](./docs/adr/)

---

*This documentation is automatically generated and updated as part of the enterprise platform upgrade.*