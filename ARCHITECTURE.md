# GCMC-KAJ Digital Transformation Platform - Architecture Documentation

> **Version:** 1.2.0
> **Last Updated:** 2025-11-19
> **Status:** Production Ready

This document provides comprehensive architectural documentation for the GCMC-KAJ Digital Transformation Platform, including system design, migration workflows, and technical implementation details.

---

## 📚 Table of Contents

- [System Overview](#system-overview)
- [Architecture Patterns](#architecture-patterns)
- [Core Infrastructure](#core-infrastructure)
- [Hybrid Migration Architecture](#hybrid-migration-architecture)
- [GRA/NIS Integration Architecture](#grinis-integration-architecture)
- [Dynamic Service Management](#dynamic-service-management)
- [Security Architecture](#security-architecture)
- [Data Architecture](#data-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Scalability Considerations](#scalability-considerations)
- [Performance Optimizations](#performance-optimizations)

---

## 🏗 System Overview

### Digital Transformation Vision

The GCMC-KAJ platform represents a complete transformation from traditional file-based accounting practices to a modern digital ecosystem that seamlessly integrates with Guyana's government services while maintaining the flexibility to support both digital and traditional workflows during migration.

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Applications"
        WEB[Web Dashboard<br/>Next.js]
        PORTAL[Client Portal<br/>Next.js]
        MOBILE[Mobile App<br/>"Padna"]
    end

    subgraph "API Gateway & Services"
        API[API Server<br/>Hono + tRPC]
        WORKER[Background Worker<br/>BullMQ]
        FILEPROC[File Processing<br/>Document OCR]
    end

    subgraph "Core Data Layer"
        DB[(PostgreSQL<br/>Multi-tenant)]
        REDIS[(Redis<br/>Cache & Queues)]
        MINIO[(MinIO<br/>Document Storage)]
    end

    subgraph "Government Integration"
        GRA[GRA OPTIMAL<br/>eservices.gra.gov.gy]
        NIS[NIS eSchedule<br/>esched.nis.org.gy]
        DCRA[DCRA Registry]
        OTHERGOV[Other Agencies<br/>29 Total]
    end

    subgraph "External Services"
        EMAIL[Email Service]
        SMS[SMS Gateway]
        BACKUP[Backup Storage]
    end

    WEB --> API
    PORTAL --> API
    MOBILE --> API

    API --> DB
    API --> REDIS
    API --> MINIO
    API --> GRA
    API --> NIS
    API --> DCRA

    WORKER --> DB
    WORKER --> REDIS
    WORKER --> MINIO
    WORKER --> EMAIL
    WORKER --> SMS

    FILEPROC --> MINIO
    FILEPROC --> API

    style GRA fill:#e1f5fe
    style NIS fill:#e8f5e8
    style DCRA fill:#fff3e0
```

### Core Architecture Principles

1. **Hybrid-First Design**: Support both digital and traditional workflows
2. **Government Integration**: Direct connectivity to GRA/NIS systems
3. **Multi-Tenant Isolation**: Complete data separation between practices
4. **Event-Driven Architecture**: Real-time updates and notifications
5. **Microservices Pattern**: Modular, scalable service design
6. **Security by Design**: Enterprise-grade security throughout

---

## 🔄 Architecture Patterns

### 1. Hybrid Physical-Digital Pattern

```mermaid
flowchart LR
    subgraph "Traditional Workflow"
        PAPER[Physical Documents]
        FILING[File Cabinets]
        MANUAL[Manual Processing]
    end

    subgraph "Transition Layer"
        SCAN[Document Scanning]
        DIGITIZE[Digitization Engine]
        MIGRATE[Migration Tools]
    end

    subgraph "Digital Workflow"
        DIGITAL[Digital Documents]
        SYSTEM[Digital Filing]
        AUTO[Automated Processing]
    end

    PAPER --> SCAN
    FILING --> DIGITIZE
    MANUAL --> MIGRATE

    SCAN --> DIGITAL
    DIGITIZE --> SYSTEM
    MIGRATE --> AUTO

    style PAPER fill:#ffcdd2
    style DIGITAL fill:#c8e6c9
    style SCAN fill:#fff9c4
```

### 2. Multi-Tenant Architecture Pattern

```mermaid
graph TB
    subgraph "Tenant Isolation Layer"
        T1[Tenant 1: KAJ]
        T2[Tenant 2: GCMC]
        T3[Tenant 3: Practice C]
    end

    subgraph "Shared Infrastructure"
        API[API Layer]
        DB[(Database)]
        STORAGE[(File Storage)]
    end

    subgraph "Government Services"
        GRA[GRA eServices]
        NIS[NIS eSchedule]
    end

    T1 --> API
    T2 --> API
    T3 --> API

    API --> DB
    API --> STORAGE
    API --> GRA
    API --> NIS

    style T1 fill:#e3f2fd
    style T2 fill:#e8f5e8
    style T3 fill:#fff3e0
```

---

## 🏗 Core Infrastructure

### Application Services Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        ADMIN[Admin Dashboard<br/>Port 3001]
        CLIENT[Client Portal<br/>Port 3002]
    end

    subgraph "API Layer"
        TRPC[tRPC Router<br/>Port 3000]
        REST[REST Endpoints]
        WS[WebSocket Events]
    end

    subgraph "Business Logic Layer"
        SERVICES[Service Managers]
        WORKFLOWS[Workflow Engine]
        RULES[Business Rules]
    end

    subgraph "Integration Layer"
        GRA_INT[GRA Integration]
        NIS_INT[NIS Integration]
        GOV_INT[Gov Agency APIs]
    end

    subgraph "Data Layer"
        ORM[Prisma ORM]
        CACHE[Redis Cache]
        FILES[MinIO Storage]
    end

    subgraph "Infrastructure Layer"
        DB[(PostgreSQL)]
        QUEUE[(BullMQ)]
        WORKER[Background Workers]
    end

    ADMIN --> TRPC
    CLIENT --> TRPC
    TRPC --> SERVICES
    SERVICES --> WORKFLOWS
    WORKFLOWS --> RULES
    SERVICES --> GRA_INT
    SERVICES --> NIS_INT
    SERVICES --> GOV_INT
    SERVICES --> ORM
    ORM --> DB
    SERVICES --> CACHE
    SERVICES --> FILES
    WORKFLOWS --> QUEUE
    QUEUE --> WORKER

    style ADMIN fill:#2196f3,color:#fff
    style CLIENT fill:#4caf50,color:#fff
    style TRPC fill:#ff9800,color:#fff
```

### Container Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/Traefik]
    end

    subgraph "Application Containers"
        WEB1[Web App 1]
        WEB2[Web App 2]
        PORTAL1[Portal App 1]
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server 3]
        WORKER1[Worker 1]
        WORKER2[Worker 2]
    end

    subgraph "Data Containers"
        PG[PostgreSQL<br/>Primary]
        PG_REPLICA[PostgreSQL<br/>Replica]
        REDIS_M[Redis Master]
        REDIS_S[Redis Slave]
        MINIO1[MinIO Node 1]
        MINIO2[MinIO Node 2]
        MINIO3[MinIO Node 3]
        MINIO4[MinIO Node 4]
    end

    LB --> WEB1
    LB --> WEB2
    LB --> PORTAL1
    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> PG
    API2 --> PG
    API3 --> PG_REPLICA

    API1 --> REDIS_M
    API2 --> REDIS_M
    API3 --> REDIS_S

    WORKER1 --> PG
    WORKER2 --> PG
    WORKER1 --> REDIS_M
    WORKER2 --> REDIS_M

    API1 --> MINIO1
    API2 --> MINIO2
    API3 --> MINIO3
    WORKER1 --> MINIO4
```

---

## 🔄 Hybrid Migration Architecture

### Migration Workflow Engine

```mermaid
flowchart TD
    START[Practice Assessment] --> PLAN[Migration Planning]
    PLAN --> SETUP[System Setup]
    SETUP --> MIGRATE[Data Migration]
    MIGRATE --> TRAIN[Staff Training]
    TRAIN --> PARALLEL[Parallel Operations]
    PARALLEL --> VALIDATE[Validation Phase]
    VALIDATE --> CUTOVER[Digital Cutover]
    CUTOVER --> OPTIMIZE[Optimization]

    subgraph "Assessment Phase"
        PAPER_AUDIT[Paper Document Audit]
        WORKFLOW_MAP[Workflow Mapping]
        COMPLIANCE_REQ[Compliance Requirements]
    end

    subgraph "Migration Phase"
        SCAN[Document Scanning]
        CATEGORIZE[Auto-Categorization]
        INDEX[Digital Indexing]
        VALIDATE_DATA[Data Validation]
    end

    subgraph "Parallel Phase"
        DIGITAL_FLOW[Digital Workflow]
        PAPER_FLOW[Paper Workflow]
        SYNC[Synchronization]
    end

    START --> PAPER_AUDIT
    PAPER_AUDIT --> WORKFLOW_MAP
    WORKFLOW_MAP --> COMPLIANCE_REQ

    MIGRATE --> SCAN
    SCAN --> CATEGORIZE
    CATEGORIZE --> INDEX
    INDEX --> VALIDATE_DATA

    PARALLEL --> DIGITAL_FLOW
    PARALLEL --> PAPER_FLOW
    DIGITAL_FLOW --> SYNC
    PAPER_FLOW --> SYNC
```

### Digital File Cabinet Organization

```mermaid
graph TB
    subgraph "Digital File Cabinet Structure"
        ROOT[Practice Root]

        subgraph "Client Files"
            CLIENT1[Client 1 Folder]
            CLIENT2[Client 2 Folder]
            CLIENTN[Client N Folder]
        end

        subgraph "Client Subfolders"
            PERSONAL[Personal Documents]
            BUSINESS[Business Documents]
            COMPLIANCE[Compliance Files]
            CORRESPONDENCE[Correspondence]
        end

        subgraph "Document Types"
            ID[Identification]
            FINANCIAL[Financial Records]
            TAX[Tax Documents]
            LEGAL[Legal Documents]
            PERMITS[Permits & Licenses]
        end

        subgraph "Agency-Specific"
            GRA_DOCS[GRA Documents]
            NIS_DOCS[NIS Documents]
            DCRA_DOCS[DCRA Documents]
            OTHER_DOCS[Other Agency Docs]
        end
    end

    ROOT --> CLIENT1
    ROOT --> CLIENT2
    ROOT --> CLIENTN

    CLIENT1 --> PERSONAL
    CLIENT1 --> BUSINESS
    CLIENT1 --> COMPLIANCE
    CLIENT1 --> CORRESPONDENCE

    PERSONAL --> ID
    BUSINESS --> FINANCIAL
    COMPLIANCE --> TAX
    COMPLIANCE --> LEGAL
    BUSINESS --> PERMITS

    COMPLIANCE --> GRA_DOCS
    COMPLIANCE --> NIS_DOCS
    COMPLIANCE --> DCRA_DOCS
    COMPLIANCE --> OTHER_DOCS

    style ROOT fill:#1976d2,color:#fff
    style CLIENT1 fill:#388e3c,color:#fff
    style COMPLIANCE fill:#f57c00,color:#fff
    style GRA_DOCS fill:#d32f2f,color:#fff
```

---

## 🏛 GRA/NIS Integration Architecture

### Government API Integration Flow

```mermaid
sequenceDiagram
    participant Client
    participant Platform
    participant AuthService
    participant GRA_API
    participant NIS_API

    Client->>Platform: Submit Tax Return
    Platform->>AuthService: Validate Credentials
    AuthService-->>Platform: Credentials Valid

    Platform->>GRA_API: Authenticate Client
    GRA_API-->>Platform: Access Token

    Platform->>GRA_API: Submit VAT Return
    GRA_API-->>Platform: Submission Receipt

    Platform->>NIS_API: Submit Employee Schedule
    NIS_API-->>Platform: Schedule Receipt

    Platform->>Client: Confirmation & Receipts

    Note over Platform: Update Compliance Status
    Note over Platform: Schedule Follow-up Tasks
```

### Integration Security Model

```mermaid
graph TB
    subgraph "Security Layers"
        TLS[TLS 1.3 Encryption]
        AUTH[OAuth 2.0 / API Keys]
        RATE[Rate Limiting]
        AUDIT[Audit Logging]
    end

    subgraph "Platform Services"
        API[Platform API]
        VAULT[Credential Vault]
        PROXY[Integration Proxy]
    end

    subgraph "Government APIs"
        GRA[GRA OPTIMAL]
        NIS[NIS eSchedule]
        DCRA[DCRA Registry]
    end

    API --> TLS
    TLS --> AUTH
    AUTH --> RATE
    RATE --> AUDIT

    API --> VAULT
    VAULT --> PROXY

    PROXY --> GRA
    PROXY --> NIS
    PROXY --> DCRA

    style TLS fill:#f44336,color:#fff
    style AUTH fill:#ff9800,color:#fff
    style VAULT fill:#4caf50,color:#fff
```

---

## 📦 Dynamic Service Management

### Service Package Architecture

```mermaid
graph TB
    subgraph "Service Package Engine"
        BUILDER[Package Builder]
        CALCULATOR[Pricing Calculator]
        SCHEDULER[Service Scheduler]
        TRACKER[Progress Tracker]
    end

    subgraph "Service Components"
        GRA_SERVICES[GRA Services]
        NIS_SERVICES[NIS Services]
        DCRA_SERVICES[DCRA Services]
        CUSTOM_SERVICES[Custom Services]
    end

    subgraph "Client Management"
        SUBSCRIPTION[Subscription Manager]
        BILLING[Billing Engine]
        COMPLIANCE[Compliance Monitor]
        REPORTING[Service Reports]
    end

    subgraph "Automation Engine"
        WORKFLOWS[Service Workflows]
        REMINDERS[Deadline Reminders]
        SUBMISSIONS[Auto-Submissions]
        NOTIFICATIONS[Client Notifications]
    end

    BUILDER --> GRA_SERVICES
    BUILDER --> NIS_SERVICES
    BUILDER --> DCRA_SERVICES
    BUILDER --> CUSTOM_SERVICES

    CALCULATOR --> SUBSCRIPTION
    SUBSCRIPTION --> BILLING

    SCHEDULER --> WORKFLOWS
    WORKFLOWS --> REMINDERS
    WORKFLOWS --> SUBMISSIONS
    WORKFLOWS --> NOTIFICATIONS

    TRACKER --> COMPLIANCE
    COMPLIANCE --> REPORTING

    style BUILDER fill:#2196f3,color:#fff
    style SUBSCRIPTION fill:#4caf50,color:#fff
    style WORKFLOWS fill:#ff9800,color:#fff
```

### Service Delivery Pipeline

```mermaid
flowchart LR
    subgraph "Service Request"
        REQUEST[Client Request]
        VALIDATE[Validation]
        ASSIGN[Assignment]
    end

    subgraph "Service Execution"
        PREP[Preparation]
        EXECUTE[Execution]
        REVIEW[Quality Review]
    end

    subgraph "Government Submission"
        FORMAT[Format Data]
        SUBMIT[Submit to Agency]
        TRACK[Track Status]
    end

    subgraph "Completion"
        NOTIFY[Notify Client]
        ARCHIVE[Archive Documents]
        INVOICE[Generate Invoice]
    end

    REQUEST --> VALIDATE
    VALIDATE --> ASSIGN
    ASSIGN --> PREP
    PREP --> EXECUTE
    EXECUTE --> REVIEW
    REVIEW --> FORMAT
    FORMAT --> SUBMIT
    SUBMIT --> TRACK
    TRACK --> NOTIFY
    NOTIFY --> ARCHIVE
    ARCHIVE --> INVOICE

    style REQUEST fill:#e3f2fd
    style SUBMIT fill:#ffebee
    style NOTIFY fill:#e8f5e8
```

---

## 🔐 Security Architecture

### Multi-Layer Security Model

```mermaid
graph TB
    subgraph "Perimeter Security"
        WAF[Web Application Firewall]
        DDoS[DDoS Protection]
        GEO[Geographic Filtering]
    end

    subgraph "Application Security"
        AUTH[Authentication Layer]
        RBAC[Role-Based Access Control]
        SESSION[Session Management]
    end

    subgraph "Data Security"
        ENCRYPTION[Data Encryption at Rest]
        TLS[TLS in Transit]
        TOKENIZATION[Data Tokenization]
    end

    subgraph "Infrastructure Security"
        VPC[Virtual Private Cloud]
        SECRETS[Secret Management]
        MONITORING[Security Monitoring]
    end

    subgraph "Compliance Security"
        AUDIT[Audit Logging]
        RETENTION[Data Retention]
        GOVERNANCE[Data Governance]
    end

    WAF --> AUTH
    DDoS --> AUTH
    GEO --> AUTH

    AUTH --> RBAC
    RBAC --> SESSION

    SESSION --> ENCRYPTION
    ENCRYPTION --> TLS
    TLS --> TOKENIZATION

    TOKENIZATION --> VPC
    VPC --> SECRETS
    SECRETS --> MONITORING

    MONITORING --> AUDIT
    AUDIT --> RETENTION
    RETENTION --> GOVERNANCE
```

### RBAC Security Matrix

```mermaid
graph LR
    subgraph "Roles"
        SUPERADMIN[Super Admin]
        FIRMADMIN[Firm Admin]
        COMPLIANCE_MGR[Compliance Manager]
        DOC_OFFICER[Document Officer]
        FILING_CLERK[Filing Clerk]
        VIEWER[Viewer]
    end

    subgraph "Permissions"
        USER_MGMT[User Management]
        CLIENT_MGMT[Client Management]
        DOC_MGMT[Document Management]
        FILING_MGMT[Filing Management]
        COMPLIANCE[Compliance Operations]
        REPORTS[Report Generation]
        GRA_OPS[GRA Operations]
        NIS_OPS[NIS Operations]
    end

    SUPERADMIN --> USER_MGMT
    SUPERADMIN --> CLIENT_MGMT
    SUPERADMIN --> DOC_MGMT
    SUPERADMIN --> FILING_MGMT
    SUPERADMIN --> COMPLIANCE
    SUPERADMIN --> REPORTS
    SUPERADMIN --> GRA_OPS
    SUPERADMIN --> NIS_OPS

    FIRMADMIN --> USER_MGMT
    FIRMADMIN --> CLIENT_MGMT
    FIRMADMIN --> DOC_MGMT
    FIRMADMIN --> FILING_MGMT
    FIRMADMIN --> COMPLIANCE
    FIRMADMIN --> REPORTS

    COMPLIANCE_MGR --> COMPLIANCE
    COMPLIANCE_MGR --> CLIENT_MGMT
    COMPLIANCE_MGR --> DOC_MGMT
    COMPLIANCE_MGR --> FILING_MGMT
    COMPLIANCE_MGR --> GRA_OPS
    COMPLIANCE_MGR --> NIS_OPS

    DOC_OFFICER --> DOC_MGMT
    DOC_OFFICER --> CLIENT_MGMT

    FILING_CLERK --> FILING_MGMT
    FILING_CLERK --> CLIENT_MGMT

    VIEWER --> REPORTS
```

---

## 🗄 Data Architecture

### Multi-Tenant Database Design

```mermaid
erDiagram
    TENANT {
        uuid id PK
        string name
        string domain
        jsonb settings
        boolean active
        timestamp created_at
        timestamp updated_at
    }

    USER {
        uuid id PK
        uuid tenant_id FK
        string email
        string name
        string role
        jsonb permissions
        timestamp created_at
    }

    CLIENT {
        bigint id PK
        uuid tenant_id FK
        string name
        string type
        string tin
        string nis_number
        jsonb metadata
        timestamp created_at
    }

    DOCUMENT {
        bigint id PK
        uuid tenant_id FK
        bigint client_id FK
        string title
        string file_path
        jsonb metadata
        timestamp expiry_date
        timestamp created_at
    }

    FILING {
        bigint id PK
        uuid tenant_id FK
        bigint client_id FK
        string period
        decimal amount
        string status
        timestamp due_date
        timestamp created_at
    }

    SERVICE_PACKAGE {
        uuid id PK
        uuid tenant_id FK
        string name
        boolean includes_gra
        boolean includes_nis
        decimal monthly_fee
        jsonb service_config
    }

    CLIENT_SUBSCRIPTION {
        uuid id PK
        uuid tenant_id FK
        bigint client_id FK
        uuid package_id FK
        jsonb custom_config
        decimal custom_pricing
        timestamp starts_at
        timestamp ends_at
    }

    TENANT ||--o{ USER : "has"
    TENANT ||--o{ CLIENT : "has"
    TENANT ||--o{ DOCUMENT : "has"
    TENANT ||--o{ FILING : "has"
    TENANT ||--o{ SERVICE_PACKAGE : "has"
    TENANT ||--o{ CLIENT_SUBSCRIPTION : "has"
    CLIENT ||--o{ DOCUMENT : "owns"
    CLIENT ||--o{ FILING : "has"
    CLIENT ||--o{ CLIENT_SUBSCRIPTION : "subscribes"
    SERVICE_PACKAGE ||--o{ CLIENT_SUBSCRIPTION : "used_in"
```

### Data Flow Architecture

```mermaid
flowchart TD
    subgraph "Data Sources"
        USER_INPUT[User Input]
        GOV_APIs[Government APIs]
        FILE_UPLOADS[File Uploads]
        EXTERNAL_FEEDS[External Data Feeds]
    end

    subgraph "Data Processing"
        VALIDATION[Data Validation]
        TRANSFORMATION[Data Transformation]
        ENRICHMENT[Data Enrichment]
        NORMALIZATION[Data Normalization]
    end

    subgraph "Data Storage"
        TRANSACTIONAL[(Transactional DB)]
        ANALYTICAL[(Analytics DB)]
        FILE_STORAGE[(File Storage)]
        CACHE[(Cache Layer)]
    end

    subgraph "Data Access"
        APIs[REST/tRPC APIs]
        REPORTS[Report Generator]
        DASHBOARDS[Dashboard Views]
        EXPORTS[Data Exports]
    end

    USER_INPUT --> VALIDATION
    GOV_APIs --> TRANSFORMATION
    FILE_UPLOADS --> ENRICHMENT
    EXTERNAL_FEEDS --> NORMALIZATION

    VALIDATION --> TRANSACTIONAL
    TRANSFORMATION --> ANALYTICAL
    ENRICHMENT --> FILE_STORAGE
    NORMALIZATION --> CACHE

    TRANSACTIONAL --> APIs
    ANALYTICAL --> REPORTS
    FILE_STORAGE --> DASHBOARDS
    CACHE --> EXPORTS
```

---

## 🚀 Deployment Architecture

### Production Deployment Topology

```mermaid
graph TB
    subgraph "Load Balancer Tier"
        ALB[Application Load Balancer]
        CDN[CloudFront CDN]
    end

    subgraph "Application Tier"
        subgraph "Availability Zone 1"
            WEB1[Web App 1]
            API1[API Server 1]
            WORKER1[Worker 1]
        end

        subgraph "Availability Zone 2"
            WEB2[Web App 2]
            API2[API Server 2]
            WORKER2[Worker 2]
        end

        subgraph "Availability Zone 3"
            API3[API Server 3]
            WORKER3[Worker 3]
        end
    end

    subgraph "Data Tier"
        subgraph "Primary Data"
            PG_PRIMARY[(PostgreSQL Primary)]
            REDIS_PRIMARY[(Redis Primary)]
        end

        subgraph "Replica Data"
            PG_REPLICA1[(PostgreSQL Replica 1)]
            PG_REPLICA2[(PostgreSQL Replica 2)]
            REDIS_REPLICA[(Redis Replica)]
        end

        subgraph "Object Storage"
            MINIO_CLUSTER[(MinIO Cluster)]
        end
    end

    subgraph "Monitoring & Logging"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        ELK[ELK Stack]
    end

    CDN --> ALB
    ALB --> WEB1
    ALB --> WEB2
    ALB --> API1
    ALB --> API2
    ALB --> API3

    API1 --> PG_PRIMARY
    API2 --> PG_REPLICA1
    API3 --> PG_REPLICA2

    API1 --> REDIS_PRIMARY
    API2 --> REDIS_PRIMARY
    API3 --> REDIS_REPLICA

    WORKER1 --> PG_PRIMARY
    WORKER2 --> PG_PRIMARY
    WORKER3 --> PG_REPLICA1

    API1 --> MINIO_CLUSTER
    API2 --> MINIO_CLUSTER
    API3 --> MINIO_CLUSTER

    API1 --> PROMETHEUS
    API2 --> PROMETHEUS
    API3 --> PROMETHEUS
    PROMETHEUS --> GRAFANA

    API1 --> ELK
    API2 --> ELK
    API3 --> ELK
```

### Kubernetes Deployment Model

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Namespace: gcmc-kaj-production"
            INGRESS[Ingress Controller]

            subgraph "Frontend Services"
                WEB_SVC[Web Service]
                PORTAL_SVC[Portal Service]
            end

            subgraph "Backend Services"
                API_SVC[API Service]
                WORKER_SVC[Worker Service]
            end

            subgraph "Data Services"
                DB_SVC[Database Service]
                REDIS_SVC[Redis Service]
                MINIO_SVC[MinIO Service]
            end
        end

        subgraph "Persistent Storage"
            DB_PV[Database PV]
            REDIS_PV[Redis PV]
            MINIO_PV[MinIO PV]
        end

        subgraph "ConfigMaps & Secrets"
            CONFIG[ConfigMap]
            SECRETS[Secrets]
        end
    end

    INGRESS --> WEB_SVC
    INGRESS --> PORTAL_SVC
    INGRESS --> API_SVC

    WEB_SVC --> API_SVC
    PORTAL_SVC --> API_SVC
    API_SVC --> DB_SVC
    API_SVC --> REDIS_SVC
    API_SVC --> MINIO_SVC

    WORKER_SVC --> DB_SVC
    WORKER_SVC --> REDIS_SVC
    WORKER_SVC --> MINIO_SVC

    DB_SVC --> DB_PV
    REDIS_SVC --> REDIS_PV
    MINIO_SVC --> MINIO_PV

    API_SVC --> CONFIG
    API_SVC --> SECRETS
    WORKER_SVC --> CONFIG
    WORKER_SVC --> SECRETS
```

---

## 📈 Scalability Considerations

### Horizontal Scaling Strategy

```mermaid
graph LR
    subgraph "Auto-Scaling Groups"
        WEB_ASG[Web Tier<br/>2-10 instances]
        API_ASG[API Tier<br/>3-15 instances]
        WORKER_ASG[Worker Tier<br/>2-8 instances]
    end

    subgraph "Scaling Triggers"
        CPU[CPU > 70%]
        MEMORY[Memory > 80%]
        QUEUE[Queue Length > 100]
        RESPONSE[Response Time > 2s]
    end

    subgraph "Scaling Actions"
        SCALE_OUT[Scale Out]
        SCALE_IN[Scale In]
        ALERT[Alert Admins]
    end

    CPU --> SCALE_OUT
    MEMORY --> SCALE_OUT
    QUEUE --> SCALE_OUT
    RESPONSE --> SCALE_OUT

    SCALE_OUT --> WEB_ASG
    SCALE_OUT --> API_ASG
    SCALE_OUT --> WORKER_ASG

    SCALE_OUT --> ALERT
    SCALE_IN --> ALERT
```

### Database Scaling Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        APP1[App Instance 1]
        APP2[App Instance 2]
        APP3[App Instance 3]
    end

    subgraph "Database Layer"
        PRIMARY[(Primary DB<br/>Writes)]
        READ_REPLICA1[(Read Replica 1)]
        READ_REPLICA2[(Read Replica 2)]
        ANALYTICS_DB[(Analytics DB)]
    end

    subgraph "Connection Pooling"
        PGBOUNCER[PgBouncer<br/>Connection Pooler]
    end

    subgraph "Caching Layer"
        REDIS_CLUSTER[(Redis Cluster)]
    end

    APP1 --> PGBOUNCER
    APP2 --> PGBOUNCER
    APP3 --> PGBOUNCER

    PGBOUNCER --> PRIMARY
    PGBOUNCER --> READ_REPLICA1
    PGBOUNCER --> READ_REPLICA2

    PRIMARY --> ANALYTICS_DB

    APP1 --> REDIS_CLUSTER
    APP2 --> REDIS_CLUSTER
    APP3 --> REDIS_CLUSTER

    style PRIMARY fill:#f44336,color:#fff
    style READ_REPLICA1 fill:#4caf50,color:#fff
    style READ_REPLICA2 fill:#4caf50,color:#fff
```

---

## ⚡ Performance Optimizations

### Caching Strategy

```mermaid
graph TB
    subgraph "Cache Layers"
        CDN_CACHE[CDN Cache<br/>Static Assets]
        APP_CACHE[Application Cache<br/>Redis]
        DB_CACHE[Database Cache<br/>Query Results]
        SESSION_CACHE[Session Cache<br/>User Sessions]
    end

    subgraph "Cache Patterns"
        READ_THROUGH[Read Through]
        WRITE_BEHIND[Write Behind]
        CACHE_ASIDE[Cache Aside]
        REFRESH_AHEAD[Refresh Ahead]
    end

    subgraph "TTL Settings"
        STATIC_TTL[Static Assets: 1 year]
        API_TTL[API Responses: 5 minutes]
        SESSION_TTL[Sessions: 24 hours]
        REPORTS_TTL[Reports: 1 hour]
    end

    CDN_CACHE --> READ_THROUGH
    APP_CACHE --> CACHE_ASIDE
    DB_CACHE --> WRITE_BEHIND
    SESSION_CACHE --> REFRESH_AHEAD

    READ_THROUGH --> STATIC_TTL
    CACHE_ASIDE --> API_TTL
    WRITE_BEHIND --> REPORTS_TTL
    REFRESH_AHEAD --> SESSION_TTL
```

### Query Optimization Strategy

```mermaid
graph TB
    subgraph "Query Optimization"
        INDEX_STRATEGY[Index Strategy]
        QUERY_PLAN[Query Plan Analysis]
        PAGINATION[Efficient Pagination]
        BATCH_OPERATIONS[Batch Operations]
    end

    subgraph "Database Optimizations"
        PARTITIONING[Table Partitioning]
        MATERIALIZED_VIEWS[Materialized Views]
        CONNECTION_POOLING[Connection Pooling]
        VACUUM_STRATEGY[Auto Vacuum Strategy]
    end

    subgraph "Application Optimizations"
        EAGER_LOADING[Eager Loading]
        LAZY_LOADING[Lazy Loading]
        QUERY_BATCHING[Query Batching]
        RESULT_CACHING[Result Caching]
    end

    INDEX_STRATEGY --> PARTITIONING
    QUERY_PLAN --> MATERIALIZED_VIEWS
    PAGINATION --> CONNECTION_POOLING
    BATCH_OPERATIONS --> VACUUM_STRATEGY

    PARTITIONING --> EAGER_LOADING
    MATERIALIZED_VIEWS --> LAZY_LOADING
    CONNECTION_POOLING --> QUERY_BATCHING
    VACUUM_STRATEGY --> RESULT_CACHING
```

---

## 📊 Monitoring and Observability

### Comprehensive Monitoring Stack

```mermaid
graph TB
    subgraph "Metrics Collection"
        PROMETHEUS[Prometheus]
        APP_METRICS[Application Metrics]
        SYS_METRICS[System Metrics]
        BIZ_METRICS[Business Metrics]
    end

    subgraph "Visualization"
        GRAFANA[Grafana Dashboards]
        ALERTS[Alert Manager]
        REPORTS[Automated Reports]
    end

    subgraph "Log Aggregation"
        ELASTICSEARCH[Elasticsearch]
        LOGSTASH[Logstash]
        KIBANA[Kibana]
        FILEBEAT[Filebeat]
    end

    subgraph "Tracing"
        JAEGER[Jaeger Tracing]
        SPAN_COLLECTION[Span Collection]
        TRACE_ANALYSIS[Trace Analysis]
    end

    APP_METRICS --> PROMETHEUS
    SYS_METRICS --> PROMETHEUS
    BIZ_METRICS --> PROMETHEUS

    PROMETHEUS --> GRAFANA
    PROMETHEUS --> ALERTS
    GRAFANA --> REPORTS

    FILEBEAT --> LOGSTASH
    LOGSTASH --> ELASTICSEARCH
    ELASTICSEARCH --> KIBANA

    SPAN_COLLECTION --> JAEGER
    JAEGER --> TRACE_ANALYSIS
```

---

## 📋 Technical Specifications

### Technology Stack Summary

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Bun | 1.0+ | JavaScript runtime and package manager |
| **Frontend** | Next.js | 14+ | React framework for web applications |
| **Backend** | Hono | 4+ | Web framework for API server |
| **API** | tRPC | 10+ | End-to-end typesafe APIs |
| **Database** | PostgreSQL | 16+ | Primary database |
| **ORM** | Prisma | 5+ | Database ORM and migrations |
| **Cache/Queue** | Redis | 7+ | Caching and job queues |
| **Storage** | MinIO | Latest | S3-compatible object storage |
| **Authentication** | Better-Auth | 1+ | Authentication and session management |
| **Background Jobs** | BullMQ | 4+ | Job queue and processing |
| **Monitoring** | Prometheus/Grafana | Latest | Metrics and monitoring |
| **Logging** | ELK Stack | Latest | Log aggregation and analysis |
| **Containerization** | Docker | 24+ | Application containerization |
| **Orchestration** | Kubernetes | 1.28+ | Container orchestration |

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Response Time** | < 200ms | 95th percentile API responses |
| **Page Load** | < 2s | First contentful paint |
| **Throughput** | 1000+ req/s | Sustained API requests |
| **Availability** | 99.9% | Monthly uptime target |
| **Error Rate** | < 0.1% | Failed requests percentage |
| **Database Query** | < 50ms | 95th percentile query time |
| **File Upload** | < 10s | 100MB file upload time |
| **Report Generation** | < 30s | Complex PDF report generation |

---

## 🔍 Architecture Decision Records

### ADR-001: Hybrid Migration Architecture
- **Decision**: Implement dual-mode system supporting both digital and traditional workflows
- **Rationale**: Smooth transition for accounting practices with varying digital maturity
- **Consequences**: Increased complexity but better adoption rates

### ADR-002: Multi-Tenant Database Design
- **Decision**: Single database with tenant isolation via row-level security
- **Rationale**: Better resource utilization and easier maintenance than database-per-tenant
- **Consequences**: Requires careful security implementation but scales better

### ADR-003: tRPC for API Layer
- **Decision**: Use tRPC instead of REST for internal APIs
- **Rationale**: End-to-end type safety and better developer experience
- **Consequences**: Learning curve but significant productivity gains

### ADR-004: Event-Driven Architecture
- **Decision**: Implement event-driven patterns for compliance workflows
- **Rationale**: Better scalability and loose coupling between services
- **Consequences**: Increased complexity but improved reliability

---

**Architecture Documentation Version:** 1.2.0
**Last Updated:** 2025-11-19
**Status:** ✅ Production Ready

For technical questions or architecture discussions, contact: [architecture@gcmc-kaj.com](mailto:architecture@gcmc-kaj.com)