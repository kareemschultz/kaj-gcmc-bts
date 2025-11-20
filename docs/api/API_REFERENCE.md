# GCMC-KAJ Digital Transformation Platform - Complete API Reference

> **Version:** 1.2.0
> **Protocol:** tRPC
> **Authentication:** Better-Auth Session-based
> **GRA Integration:** OPTIMAL Revenue Management System
> **NIS Integration:** Electronic Schedule Submission
> **Last Updated:** 2025-11-19

The GCMC-KAJ Digital Transformation Platform provides a comprehensive tRPC API for managing compliance operations, client relationships, business processes, GRA/NIS eServices integration, and dynamic service package management. This reference documents all available endpoints with authentication requirements, request/response schemas, and interactive examples.

---

## 📚 Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Core Concepts](#core-concepts)
- [API Endpoints](#api-endpoints)
  - [System & Health](#system--health)
  - [User Management](#user-management)
  - [Client Management](#client-management)
  - [Document Management](#document-management)
  - [Filing Management](#filing-management)
  - [Service Management](#service-management)
  - [Dynamic Service Packages](#dynamic-service-packages)
  - [GRA/NIS Integration](#grinis-integration)
  - [Compliance Engine](#compliance-engine)
  - [Analytics & Reporting](#analytics--reporting)
  - [Notifications](#notifications)
  - [Background Tasks](#background-tasks)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Code Examples](#code-examples)

---

## 🚀 Getting Started

### Base URL

```
Production: https://api.gcmc-kaj.com
Development: http://localhost:3000
```

### tRPC Client Setup

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@GCMC-KAJ/api';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      headers: {
        // Include session cookie for authentication
        cookie: document.cookie,
      },
    }),
  ],
});
```

### Next.js Setup (Recommended)

```typescript
// utils/trpc.ts
import { createTRPCNext } from '@trpc/next';
import type { AppRouter } from '@GCMC-KAJ/api';

export const trpc = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    };
  },
  ssr: false,
});
```

---

## 🔐 Authentication

The API uses session-based authentication via Better-Auth. All protected endpoints require a valid session cookie.

### Authentication Flow

1. **Login via Better-Auth**
   ```typescript
   import { signIn } from '@GCMC-KAJ/auth/client';

   await signIn.email({
     email: 'admin@gcmc-kaj.com',
     password: 'your-password',
   });
   ```

2. **Session Context**
   ```typescript
   // Session context includes:
   interface SessionContext {
     userId: string;
     tenantId: string;
     role: UserRole;
     permissions: string[];
   }
   ```

3. **RBAC Permissions**
   All endpoints enforce role-based permissions:
   ```typescript
   // Permission format: "module:action"
   'clients:view'     // View clients
   'clients:create'   // Create clients
   'clients:edit'     // Update clients
   'clients:delete'   // Delete clients
   ```

### Available Roles

| Role | Description | Typical Permissions |
|------|-------------|-------------------|
| `SuperAdmin` | Cross-tenant platform access | All permissions |
| `FirmAdmin` | Full organizational access | All tenant permissions + user management |
| `ComplianceManager` | Compliance oversight | Compliance, clients, documents, filings |
| `ComplianceOfficer` | Daily compliance tasks | Compliance operations, document review |
| `DocumentOfficer` | Document management | Document upload, management, versioning |
| `FilingClerk` | Filing preparation | Filing creation, submission |
| `Viewer` | Read-only access | View-only permissions |
| `ClientPortalUser` | External client access | Limited client portal access |

---

## 🏗 Core Concepts

### Tenant Isolation

All data is isolated by tenant. Every request automatically filters data based on the authenticated user's `tenantId`.

```typescript
// Automatic tenant scoping in all queries
const clients = await prisma.client.findMany({
  where: { tenantId: ctx.tenantId }, // Automatically enforced
});
```

### Pagination

List endpoints support consistent pagination:

```typescript
interface PaginationInput {
  page?: number;      // Default: 1
  pageSize?: number;  // Default: 20, Max: 100
}

interface PaginationResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

### Search & Filtering

Most list endpoints support search and filtering:

```typescript
interface ListFilters {
  search?: string;        // Full-text search
  dateFrom?: Date;        // Date range filtering
  dateTo?: Date;
  status?: string;        // Status filtering
  type?: string;          // Type filtering
}
```

---

## 🔧 API Endpoints

## System & Health

### `healthCheck` (Public)

**Description:** System health check endpoint

```typescript
// No authentication required
const health = await trpc.healthCheck.query();
// Returns: "OK"
```

### `privateData` (Protected)

**Description:** Authentication test endpoint

```typescript
const data = await trpc.privateData.query();
// Returns: { message: "This is private", user: {...}, tenant: {...}, role: "..." }
```

---

## 👥 User Management

### `users.list`

**Description:** List users with filtering and pagination
**Permission:** `users:view`

```typescript
const users = await trpc.users.list.query({
  search: 'john',
  role: 'ComplianceManager',
  page: 1,
  pageSize: 20,
});
```

**Response:**
```typescript
{
  users: User[];
  pagination: PaginationResponse;
}
```

### `users.get`

**Description:** Get user by ID
**Permission:** `users:view`

```typescript
const user = await trpc.users.get.query({ id: 'user-123' });
```

### `users.create`

**Description:** Create new user
**Permission:** `users:create`

```typescript
const user = await trpc.users.create.mutate({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'ComplianceOfficer',
});
```

### `users.update`

**Description:** Update user
**Permission:** `users:edit`

```typescript
const user = await trpc.users.update.mutate({
  id: 'user-123',
  data: {
    name: 'John Smith',
    role: 'ComplianceManager',
  },
});
```

### `users.delete`

**Description:** Delete user
**Permission:** `users:delete`

```typescript
await trpc.users.delete.mutate({ id: 'user-123' });
```

---

## 🏢 Client Management

### `clients.list`

**Description:** List clients with filtering and pagination
**Permission:** `clients:view`

```typescript
const clients = await trpc.clients.list.query({
  search: 'ABC Corp',
  type: 'company',
  sector: 'manufacturing',
  riskLevel: 'medium',
  page: 1,
  pageSize: 20,
});
```

**Response:**
```typescript
{
  clients: Array<{
    id: number;
    name: string;
    type: 'individual' | 'company' | 'partnership';
    email: string | null;
    phone: string | null;
    address: string | null;
    tin: string | null;
    nisNumber: string | null;
    sector: string | null;
    riskLevel: 'low' | 'medium' | 'high' | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      documents: number;
      filings: number;
      serviceRequests: number;
    };
  }>;
  pagination: PaginationResponse;
}
```

### `clients.get`

**Description:** Get client by ID with related data
**Permission:** `clients:view`

```typescript
const client = await trpc.clients.get.query({ id: 123 });
```

**Response:**
```typescript
{
  id: number;
  name: string;
  type: string;
  // ... other client fields
  businesses: ClientBusiness[];
  _count: {
    documents: number;
    filings: number;
    serviceRequests: number;
    tasks: number;
  };
}
```

### `clients.create`

**Description:** Create new client
**Permission:** `clients:create`

```typescript
const client = await trpc.clients.create.mutate({
  name: 'ABC Corporation',
  type: 'company',
  email: 'contact@abc.com',
  phone: '+592-555-0123',
  address: '123 Business St, Georgetown',
  tin: 'TIN123456789',
  nisNumber: 'NIS987654321',
  sector: 'manufacturing',
  riskLevel: 'medium',
  notes: 'New manufacturing client',
});
```

**Auto-triggers:**
- Audit log creation
- Welcome email queuing (if email provided)
- Initial compliance score calculation

### `clients.update`

**Description:** Update existing client
**Permission:** `clients:edit`

```typescript
const client = await trpc.clients.update.mutate({
  id: 123,
  data: {
    riskLevel: 'high',
    notes: 'Updated risk assessment',
  },
});
```

### `clients.delete`

**Description:** Delete client
**Permission:** `clients:delete`

```typescript
await trpc.clients.delete.mutate({ id: 123 });
```

### `clients.stats`

**Description:** Get client statistics
**Permission:** `clients:view`

```typescript
const stats = await trpc.clients.stats.query();
```

**Response:**
```typescript
{
  total: number;
  byType: Array<{ type: string; _count: number }>;
  byRiskLevel: Array<{ riskLevel: string; _count: number }>;
}
```

---

## 📄 Document Management

### `documents.list`

**Description:** List documents with filtering
**Permission:** `documents:view`

```typescript
const documents = await trpc.documents.list.query({
  clientId: 123,
  documentTypeId: 456,
  status: 'active',
  expiringWithin: 30, // days
  search: 'passport',
  page: 1,
  pageSize: 20,
});
```

### `documents.get`

**Description:** Get document by ID with versions
**Permission:** `documents:view`

```typescript
const document = await trpc.documents.get.query({ id: 789 });
```

### `documents.create`

**Description:** Create new document
**Permission:** `documents:create`

```typescript
const document = await trpc.documents.create.mutate({
  clientId: 123,
  documentTypeId: 456,
  referenceNumber: 'PASS-2024-001',
  issueDate: new Date('2024-01-01'),
  expiryDate: new Date('2034-01-01'),
  issuedBy: 'Passport Office Guyana',
  notes: 'Primary identification document',
});
```

### `documents.update`

**Description:** Update document
**Permission:** `documents:edit`

```typescript
const document = await trpc.documents.update.mutate({
  id: 789,
  data: {
    expiryDate: new Date('2035-01-01'),
    status: 'renewed',
  },
});
```

### `documents.delete`

**Description:** Delete document
**Permission:** `documents:delete`

```typescript
await trpc.documents.delete.mutate({ id: 789 });
```

### `documentUpload.getUploadUrl`

**Description:** Get presigned upload URL
**Permission:** `documents:create`

```typescript
const uploadData = await trpc.documentUpload.getUploadUrl.mutate({
  clientId: 123,
  documentId: 789,
  fileName: 'passport-scan.pdf',
  fileSize: 1024000,
  contentType: 'application/pdf',
});
```

**Response:**
```typescript
{
  uploadUrl: string;
  downloadUrl: string;
  key: string;
}
```

### `documentUpload.confirmUpload`

**Description:** Confirm successful upload
**Permission:** `documents:create`

```typescript
await trpc.documentUpload.confirmUpload.mutate({
  documentId: 789,
  key: 'documents/123/passport-scan.pdf',
  originalName: 'passport-scan.pdf',
  size: 1024000,
  contentType: 'application/pdf',
});
```

---

## 📊 Filing Management

### `filings.list`

**Description:** List filings with filtering
**Permission:** `filings:view`

```typescript
const filings = await trpc.filings.list.query({
  clientId: 123,
  filingTypeId: 456,
  status: 'pending',
  dueWithin: 7, // days
  search: 'VAT',
  page: 1,
  pageSize: 20,
});
```

### `filings.create`

**Description:** Create new filing
**Permission:** `filings:create`

```typescript
const filing = await trpc.filings.create.mutate({
  clientId: 123,
  filingTypeId: 456,
  period: '2024-Q1',
  dueDate: new Date('2024-05-15'),
  amount: 15000.00,
  currency: 'GYD',
  notes: 'Q1 VAT filing',
});
```

### `filings.submit`

**Description:** Submit filing
**Permission:** `filings:submit`

```typescript
const filing = await trpc.filings.submit.mutate({
  id: 789,
  submissionReference: 'GRA-2024-0001',
  submittedAt: new Date(),
  notes: 'Submitted via GRA portal',
});
```

---

## 🛠 Service Management

### `services.list`

**Description:** List services
**Permission:** `services:view`

### `serviceRequests.list`

**Description:** List service requests
**Permission:** `serviceRequests:view`

```typescript
const requests = await trpc.serviceRequests.list.query({
  clientId: 123,
  status: 'in_progress',
  priority: 'high',
  assignedTo: 'user-456',
  page: 1,
  pageSize: 20,
});
```

### `serviceRequests.create`

**Description:** Create service request
**Permission:** `serviceRequests:create`

```typescript
const request = await trpc.serviceRequests.create.mutate({
  clientId: 123,
  serviceId: 456,
  priority: 'medium',
  description: 'Document preparation for business registration',
  requirements: ['Business plan', 'Articles of incorporation'],
  dueDate: new Date('2024-12-31'),
});
```

---

## 📦 Dynamic Service Packages

### `dynamicServices.setupStandardPackages`

**Description:** Set up standard service packages for a new practice
**Permission:** `services:create`

```typescript
const result = await trpc.dynamicServices.setupStandardPackages.mutate();
```

**Response:**
```typescript
{
  success: boolean;
  packages: ServicePackage[];
  message: string;
}
```

### `dynamicServices.getServicePackages`

**Description:** Get all service packages for the practice
**Permission:** `services:view`

```typescript
const packages = await trpc.dynamicServices.getServicePackages.query();
```

**Response:**
```typescript
Array<{
  id: string;
  name: string;
  description: string | null;
  includesGRA: boolean;
  includesNIS: boolean;
  includesDCRA: boolean;
  includesImmig: boolean;
  graVAT: boolean;
  graPAYE: boolean;
  graIncomeTax: boolean;
  graCorporateTax: boolean;
  nisMonthlyReturns: boolean;
  nisAnnualReturns: boolean;
  nisEmployerReg: boolean;
  nisEmployeeReg: boolean;
  dcraBusinessReg: boolean;
  dcraCompanyIncorp: boolean;
  dcraAnnualReturns: boolean;
  dcraNameReserv: boolean;
  monthlyFee: number | null;
  perFilingFee: number | null;
  setupFee: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}>
```

### `dynamicServices.createCustomPackage`

**Description:** Create custom service package
**Permission:** `services:create`

```typescript
const package = await trpc.dynamicServices.createCustomPackage.mutate({
  name: 'Premium GRA Package',
  description: 'Complete GRA compliance for large businesses',
  includesGRA: true,
  graVAT: true,
  graPAYE: true,
  graIncomeTax: true,
  graCorporateTax: true,
  monthlyFee: 25000.00,
  perFilingFee: 2500.00,
  setupFee: 10000.00
});
```

### `dynamicServices.subscribeClient`

**Description:** Subscribe client to a service package
**Permission:** `services:create`

```typescript
const subscription = await trpc.dynamicServices.subscribeClient.mutate({
  clientId: 'client-123',
  packageId: 'package-456',
  customServices: {
    gra: {
      vatFrequency: 'monthly',
      payeEmployeeCount: 50
    },
    nis: {
      employeeCount: 50
    }
  },
  customPricing: {
    monthlyFee: 20000.00,
    discountPercent: 10
  }
});
```

### `dynamicServices.getClientSubscriptions`

**Description:** Get client service subscriptions
**Permission:** `services:view`

```typescript
const subscriptions = await trpc.dynamicServices.getClientSubscriptions.query({
  clientId: 'client-123'
});
```

---

## 🏛️ GRA/NIS Integration

### GRA eServices Integration

#### `graIntegration.authenticateClient`

**Description:** Authenticate with GRA eServices using client credentials
**Permission:** `gra:authenticate`

```typescript
const auth = await trpc.graIntegration.authenticateClient.mutate({
  clientId: 'client-123',
  graUsername: 'client-gra-username',
  graPassword: 'client-gra-password'
});
```

**Response:**
```typescript
{
  success: boolean;
  accessToken: string;
  expiresAt: Date;
  taxpayerInfo: {
    tin: string;
    name: string;
    status: string;
    registrations: string[];
  };
}
```

#### `graIntegration.submitVATReturn`

**Description:** Submit VAT return to GRA OPTIMAL system
**Permission:** `gra:submit`

```typescript
const submission = await trpc.graIntegration.submitVATReturn.mutate({
  clientId: 'client-123',
  period: '2024-Q4',
  vatData: {
    totalSales: 1500000.00,
    totalVAT: 202500.00,
    totalPurchases: 800000.00,
    inputVAT: 108000.00,
    netVATPayable: 94500.00
  },
  supporting_documents: ['receipt-123.pdf', 'invoice-456.pdf']
});
```

**Response:**
```typescript
{
  submissionId: string;
  referenceNumber: string;
  status: 'submitted' | 'processing' | 'accepted' | 'rejected';
  submittedAt: Date;
  assessmentAmount?: number;
  dueDate?: Date;
  confirmationUrl?: string;
}
```

#### `graIntegration.submitPAYEReturn`

**Description:** Submit PAYE return to GRA
**Permission:** `gra:submit`

```typescript
const submission = await trpc.graIntegration.submitPAYEReturn.mutate({
  clientId: 'client-123',
  period: '2024-11',
  payeData: {
    totalEmployees: 25,
    totalGrossWages: 2500000.00,
    totalPAYE: 350000.00,
    employeeSchedule: [
      {
        name: 'John Doe',
        nin: 'NIN123456789',
        grossWage: 100000.00,
        paye: 14000.00
      }
      // ... more employees
    ]
  }
});
```

#### `graIntegration.getSubmissionStatus`

**Description:** Check status of GRA submission
**Permission:** `gra:view`

```typescript
const status = await trpc.graIntegration.getSubmissionStatus.query({
  submissionId: 'sub-123',
  clientId: 'client-123'
});
```

### NIS Electronic Schedule Integration

#### `nisIntegration.authenticateEmployer`

**Description:** Authenticate employer with NIS esched system
**Permission:** `nis:authenticate`

```typescript
const auth = await trpc.nisIntegration.authenticateEmployer.mutate({
  clientId: 'client-123',
  employerNumber: 'EMP123456',
  nisPassword: 'employer-password'
});
```

#### `nisIntegration.submitMonthlySchedule`

**Description:** Submit monthly employee contribution schedule
**Permission:** `nis:submit`

```typescript
const submission = await trpc.nisIntegration.submitMonthlySchedule.mutate({
  clientId: 'client-123',
  period: '2024-11',
  scheduleData: {
    employerNumber: 'EMP123456',
    totalEmployees: 25,
    totalWages: 2500000.00,
    totalContributions: 375000.00,
    employeeSchedule: [
      {
        nin: 'NIN123456789',
        name: 'John Doe',
        wages: 100000.00,
        employeeContribution: 7000.00,
        employerContribution: 8000.00
      }
      // ... more employees
    ]
  }
});
```

**Response:**
```typescript
{
  submissionId: string;
  referenceNumber: string;
  status: 'submitted' | 'processing' | 'accepted' | 'rejected';
  submittedAt: Date;
  dueDate: Date;
  totalAmount: number;
  confirmationNumber?: string;
}
```

#### `nisIntegration.getEmployeeContributionHistory`

**Description:** Get employee contribution history from NIS
**Permission:** `nis:view`

```typescript
const history = await trpc.nisIntegration.getEmployeeContributionHistory.query({
  nin: 'NIN123456789',
  fromPeriod: '2024-01',
  toPeriod: '2024-11'
});
```

### Cross-Agency Compliance Workflows

#### `complianceAutomation.syncAllAgencies`

**Description:** Synchronize compliance status across GRA, NIS, and other agencies
**Permission:** `compliance:sync`

```typescript
const syncResult = await trpc.complianceAutomation.syncAllAgencies.mutate({
  clientId: 'client-123'
});
```

**Response:**
```typescript
{
  gra: {
    status: 'compliant' | 'pending' | 'overdue';
    lastSync: Date;
    pendingSubmissions: number;
  };
  nis: {
    status: 'compliant' | 'pending' | 'overdue';
    lastSync: Date;
    pendingSchedules: number;
  };
  dcra: {
    status: 'compliant' | 'pending' | 'overdue';
    lastSync: Date;
    pendingReturns: number;
  };
  overallComplianceScore: number;
  lastUpdated: Date;
}
```

---

## ⚖️ Compliance Engine

### `complianceRules.list`

**Description:** List compliance rules
**Permission:** `compliance:view`

```typescript
const rules = await trpc.complianceRules.list.query({
  category: 'tax',
  active: true,
});
```

### `requirementBundles.list`

**Description:** List requirement bundles
**Permission:** `compliance:view`

```typescript
const bundles = await trpc.requirementBundles.list.query({
  agency: 'GRA',
  applicableToType: 'company',
});
```

---

## 📈 Analytics & Reporting

### `dashboard.overview`

**Description:** Dashboard overview data
**Permission:** `dashboard:view`

```typescript
const overview = await trpc.dashboard.overview.query();
```

**Response:**
```typescript
{
  clientsCount: number;
  documentsCount: number;
  filingsCount: number;
  tasksCount: number;
  recentActivity: Activity[];
  upcomingDeadlines: Deadline[];
  complianceOverview: {
    averageScore: number;
    distribution: { level: string; count: number }[];
  };
}
```

### `analytics.clientMetrics`

**Description:** Client analytics
**Permission:** `analytics:view`

```typescript
const metrics = await trpc.analytics.clientMetrics.query({
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-12-31'),
  groupBy: 'month',
});
```

### `clientAnalytics.getById`

**Description:** Detailed client analytics
**Permission:** `clients:view`

```typescript
const analytics = await trpc.clientAnalytics.getById.query({
  clientId: 123
});
```

### `reports.generate`

**Description:** Generate PDF report
**Permission:** `reports:generate`

```typescript
const report = await trpc.reports.generate.mutate({
  type: 'client_file',
  clientId: 123,
  options: {
    includePeriod: '2024',
    sections: ['documents', 'filings', 'compliance'],
  },
});
```

**Response:**
```typescript
{
  downloadUrl: string;
  fileName: string;
  size: number;
  expiresAt: Date;
}
```

---

## 🔔 Notifications

### `notifications.list`

**Description:** List user notifications
**Permission:** `notifications:view`

```typescript
const notifications = await trpc.notifications.list.query({
  unreadOnly: true,
  type: 'deadline_reminder',
  page: 1,
  pageSize: 50,
});
```

### `notifications.markRead`

**Description:** Mark notifications as read
**Permission:** `notifications:edit`

```typescript
await trpc.notifications.markRead.mutate({
  notificationIds: [1, 2, 3],
});
```

---

## ⚙️ Background Tasks

### `tasks.list`

**Description:** List background tasks
**Permission:** `tasks:view`

### `tasks.create`

**Description:** Create background task
**Permission:** `tasks:create`

```typescript
const task = await trpc.tasks.create.mutate({
  type: 'compliance_refresh',
  clientId: 123,
  priority: 'normal',
  scheduledFor: new Date('2024-11-19T02:00:00Z'),
});
```

---

## ❌ Error Handling

### Error Response Format

```typescript
interface TRPCError {
  code:
    | 'UNAUTHORIZED'      // 401: Not authenticated
    | 'FORBIDDEN'         // 403: No permission
    | 'NOT_FOUND'         // 404: Resource not found
    | 'BAD_REQUEST'       // 400: Invalid input
    | 'INTERNAL_SERVER_ERROR'  // 500: Server error
    | 'TIMEOUT'           // 408: Request timeout
    | 'CONFLICT'          // 409: Resource conflict
    | 'TOO_MANY_REQUESTS'; // 429: Rate limit exceeded
  message: string;
  path?: string[];
}
```

### Common Error Codes

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `UNAUTHORIZED` | 401 | No valid session | Login required |
| `FORBIDDEN` | 403 | Insufficient permissions | Contact admin |
| `NOT_FOUND` | 404 | Resource doesn't exist | Check ID/filters |
| `BAD_REQUEST` | 400 | Invalid input data | Check validation |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded | Wait and retry |

### Error Handling Example

```typescript
try {
  const client = await trpc.clients.get.query({ id: 123 });
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    // Handle missing client
  } else if (error.code === 'FORBIDDEN') {
    // Handle permission error
  } else {
    // Handle other errors
  }
}
```

---

## 🚦 Rate Limiting

The API implements rate limiting to ensure fair usage:

| Endpoint Category | Limit | Window |
|------------------|-------|---------|
| Authentication | 10 req/min | Per IP |
| Read operations | 100 req/min | Per user |
| Write operations | 50 req/min | Per user |
| File uploads | 10 req/min | Per user |
| Reports | 5 req/min | Per user |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

---

## 💻 Code Examples

### Complete Client Management Example

```typescript
// components/ClientManager.tsx
import { trpc } from '../utils/trpc';

export function ClientManager() {
  // List clients with real-time updates
  const { data: clients, refetch } = trpc.clients.list.useQuery({
    page: 1,
    pageSize: 20,
  });

  // Create client mutation
  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      refetch(); // Refresh list
    },
  });

  // Update client mutation
  const updateClient = trpc.clients.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreateClient = async (data: CreateClientInput) => {
    try {
      await createClient.mutateAsync(data);
      toast.success('Client created successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      {/* Client list UI */}
      {clients?.clients.map(client => (
        <ClientCard
          key={client.id}
          client={client}
          onUpdate={(data) => updateClient.mutate({
            id: client.id,
            data
          })}
        />
      ))}
    </div>
  );
}
```

### File Upload Example

```typescript
// hooks/useFileUpload.ts
export function useFileUpload() {
  const getUploadUrl = trpc.documentUpload.getUploadUrl.useMutation();
  const confirmUpload = trpc.documentUpload.confirmUpload.useMutation();

  const uploadFile = async (
    file: File,
    clientId: number,
    documentId: number
  ) => {
    // 1. Get presigned URL
    const { uploadUrl, key } = await getUploadUrl.mutateAsync({
      clientId,
      documentId,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
    });

    // 2. Upload to MinIO
    const formData = new FormData();
    formData.append('file', file);

    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    // 3. Confirm upload
    await confirmUpload.mutateAsync({
      documentId,
      key,
      originalName: file.name,
      size: file.size,
      contentType: file.type,
    });
  };

  return { uploadFile };
}
```

### Real-time Notifications

```typescript
// hooks/useNotifications.ts
export function useNotifications() {
  const { data: notifications } = trpc.notifications.list.useQuery(
    { unreadOnly: true },
    {
      refetchInterval: 30000, // Poll every 30 seconds
    }
  );

  const markRead = trpc.notifications.markRead.useMutation();

  const markAllRead = async () => {
    const unreadIds = notifications
      ?.filter(n => !n.readAt)
      .map(n => n.id) || [];

    if (unreadIds.length > 0) {
      await markRead.mutateAsync({ notificationIds: unreadIds });
    }
  };

  return {
    notifications: notifications || [],
    unreadCount: notifications?.filter(n => !n.readAt).length || 0,
    markAllRead,
  };
}
```

---

## 🔗 Related Documentation

- [Authentication Guide](./AUTHENTICATION.md)
- [RBAC Implementation](./RBAC.md)
- [Database Schema](../DATABASE_SCHEMA.md)
- [Error Handling Guide](./ERROR_HANDLING.md)
- [Rate Limiting Configuration](./RATE_LIMITING.md)
- [Testing API Endpoints](./TESTING.md)

---

## 📱 SDKs and Integration

### React/Next.js Integration

```bash
npm install @trpc/client @trpc/react-query
```

### Standalone JavaScript

```bash
npm install @trpc/client
```

### Testing

```typescript
// test-utils/api.ts
import { createTRPCMsw } from 'msw-trpc';
import type { AppRouter } from '@GCMC-KAJ/api';

export const trpcMsw = createTRPCMsw<AppRouter>();
```

---

**API Reference Version:** 1.0.0
**Platform Version:** 1.0.0
**Last Updated:** 2025-11-18
**Status:** ✅ Production Ready

For support, contact: [support@gcmc-kaj.com](mailto:support@gcmc-kaj.com)