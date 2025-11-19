# Contributing to KAJ-GCMC BTS Platform

> **Welcome to the KAJ-GCMC Business Tax Services Platform**
> **Version:** 1.0.0
> **Last Updated:** 2025-11-18

Thank you for your interest in contributing to the KAJ-GCMC BTS Platform! This guide will help you understand our development process, coding standards, and how to submit contributions effectively.

---

## 📚 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Documentation Standards](#documentation-standards)
- [Release Process](#release-process)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender, gender identity, sexual orientation, disability, personal appearance, race, ethnicity, age, religion, or nationality.

### Standards

**Positive Behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other contributors

**Unacceptable Behavior:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers are responsible for clarifying standards and may take corrective action in response to inappropriate behavior.

Report violations to: [conduct@gcmc-kaj.com](mailto:conduct@gcmc-kaj.com)

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have completed the [Developer Setup Guide](./docs/development/DEVELOPER_SETUP_GUIDE.md).

**Quick Checklist:**
- [ ] Bun 1.0.0+ installed
- [ ] Docker and Docker Compose setup
- [ ] Repository cloned and dependencies installed
- [ ] Development environment running
- [ ] All tests passing

### Understanding the Codebase

#### Architecture Overview

```
KAJ-GCMC BTS Platform
├── apps/
│   ├── web/           # Next.js frontend application
│   ├── server/        # Hono + tRPC API server
│   └── worker/        # BullMQ background worker
├── packages/
│   ├── api/           # tRPC routers and API logic
│   ├── auth/          # Better-Auth configuration
│   ├── db/            # Prisma schema and database utilities
│   ├── rbac/          # Role-based access control
│   ├── reports/       # PDF report generation
│   └── config/        # Shared configuration
└── docs/              # Comprehensive documentation
```

#### Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Hono, tRPC, Better-Auth, Prisma
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis with BullMQ for background jobs
- **Storage**: MinIO (S3-compatible) for file storage
- **Testing**: Vitest, Playwright E2E testing
- **Code Quality**: Biome for linting and formatting

---

## 🔄 Development Workflow

### Branch Strategy

We follow **GitHub Flow** with protection on the main branch:

```
main branch (protected)
├── feature/add-client-search
├── bugfix/fix-auth-session
├── docs/update-api-guide
└── hotfix/critical-security-patch
```

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| **Features** | `feature/description` | `feature/add-client-analytics` |
| **Bug Fixes** | `bugfix/description` | `bugfix/fix-document-upload` |
| **Documentation** | `docs/description` | `docs/update-deployment-guide` |
| **Hotfixes** | `hotfix/description` | `hotfix/security-vulnerability` |
| **Refactoring** | `refactor/description` | `refactor/optimize-database-queries` |
| **Tests** | `test/description` | `test/add-rbac-coverage` |

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(clients): add advanced search filters` |
| `fix` | Bug fix | `fix(auth): resolve session timeout issue` |
| `docs` | Documentation only | `docs(api): update endpoint documentation` |
| `style` | Code style changes | `style(components): format with Biome` |
| `refactor` | Code refactoring | `refactor(rbac): simplify permission checking` |
| `test` | Adding or updating tests | `test(api): add client router coverage` |
| `chore` | Maintenance tasks | `chore(deps): update dependencies` |
| `perf` | Performance improvements | `perf(db): optimize client queries` |
| `ci` | CI/CD changes | `ci(github): update workflow configuration` |

#### Examples

```bash
# Feature addition
git commit -m "feat(clients): implement client risk assessment dashboard

- Add risk calculation algorithm
- Create interactive risk visualization
- Include historical risk trends
- Update client detail page layout

Closes #123"

# Bug fix
git commit -m "fix(auth): prevent session hijacking vulnerability

- Validate session token origin
- Add secure cookie flags
- Implement CSRF protection
- Update session rotation logic

Security: This fixes CVE-2024-XXXX"

# Documentation
git commit -m "docs(deployment): add Kubernetes deployment guide

- Include YAML configurations
- Document scaling strategies
- Add troubleshooting section
- Update production checklist"
```

### Development Process

1. **Create Issue** (for significant changes)
2. **Create Branch** from main
3. **Develop Feature** with tests
4. **Run Quality Checks**
5. **Submit Pull Request**
6. **Code Review**
7. **Merge to Main**

#### Step-by-Step Workflow

```bash
# 1. Sync with main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/add-client-search

# 3. Make changes and commit
git add .
git commit -m "feat(clients): add advanced search functionality"

# 4. Push branch
git push origin feature/add-client-search

# 5. Open pull request on GitHub

# 6. Address review feedback
git add .
git commit -m "fix(clients): address search performance concerns"
git push origin feature/add-client-search

# 7. After approval, maintainer will merge
```

---

## 📏 Coding Standards

### TypeScript Guidelines

#### Type Safety

```typescript
// ✅ Good: Strict typing
interface ClientCreateInput {
  name: string;
  type: 'individual' | 'company' | 'partnership';
  email?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

// ❌ Avoid: Any types
function processClient(data: any): any {
  // Implementation
}

// ✅ Good: Generic constraints
function createEntity<T extends { id: string }>(
  entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): T {
  // Implementation
}
```

#### Naming Conventions

```typescript
// Variables and functions: camelCase
const clientData = await fetchClientData();
const isValidEmail = (email: string) => boolean;

// Types and interfaces: PascalCase
interface ClientDetails {
  id: string;
  name: string;
}

type UserRole = 'admin' | 'user' | 'viewer';

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const API_ENDPOINTS = {
  CLIENTS: '/api/clients',
  DOCUMENTS: '/api/documents',
} as const;

// Files and directories: kebab-case
// client-analytics.ts
// user-management/
// api-documentation.md
```

#### Code Organization

```typescript
// 1. Imports (grouped and sorted)
// External libraries
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

// Internal packages
import prisma from '@GCMC-KAJ/db';
import { rbacProcedure, router } from '@GCMC-KAJ/api';

// Local imports
import { clientSchema } from '../schemas/client';
import { validateClientAccess } from '../utils/validation';

// 2. Type definitions
interface ClientAnalytics {
  totalClients: number;
  riskDistribution: Record<string, number>;
}

// 3. Constants
const CACHE_TTL = 5 * 60; // 5 minutes

// 4. Main implementation
export const clientsRouter = router({
  // Implementation
});
```

### React/Next.js Standards

#### Component Structure

```typescript
// components/ClientCard.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Client } from '@GCMC-KAJ/db';

interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (clientId: string) => void;
  className?: string;
}

export function ClientCard({
  client,
  onEdit,
  onDelete,
  className
}: ClientCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    onEdit?.(client);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    setIsLoading(true);
    try {
      await onDelete?.(client.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {client.name}
          <Badge variant={client.riskLevel === 'high' ? 'destructive' : 'secondary'}>
            {client.riskLevel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {client.type} • {client.email}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              disabled={isLoading}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export type for external use
export type { ClientCardProps };
```

#### Custom Hooks

```typescript
// hooks/useClientData.ts
import { useCallback, useMemo } from 'react';
import { trpc } from '@/utils/trpc';
import type { ClientFilters } from '@/types/client';

interface UseClientDataOptions {
  filters?: ClientFilters;
  enabled?: boolean;
}

export function useClientData({
  filters = {},
  enabled = true
}: UseClientDataOptions = {}) {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.clients.list.useQuery(
    { ...filters, page: 1, pageSize: 20 },
    { enabled }
  );

  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const updateClient = trpc.clients.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreateClient = useCallback(async (
    clientData: Parameters<typeof createClient.mutateAsync>[0]
  ) => {
    try {
      await createClient.mutateAsync(clientData);
      return true;
    } catch (error) {
      console.error('Failed to create client:', error);
      return false;
    }
  }, [createClient]);

  const stats = useMemo(() => {
    if (!data?.clients) return null;

    return {
      total: data.pagination.total,
      byType: data.clients.reduce((acc, client) => {
        acc[client.type] = (acc[client.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [data]);

  return {
    clients: data?.clients ?? [],
    pagination: data?.pagination,
    stats,
    isLoading,
    error,
    actions: {
      create: handleCreateClient,
      update: updateClient.mutateAsync,
      delete: deleteClient.mutateAsync,
      refetch,
    },
  };
}
```

### Database/Prisma Standards

#### Schema Guidelines

```prisma
// packages/db/prisma/schema/client.prisma
model Client {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Tenant isolation (required for all models)
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Core fields
  name      String
  type      ClientType
  email     String?
  phone     String?
  address   String?

  // Business fields
  tin           String?
  nisNumber     String?
  sector        String?
  riskLevel     RiskLevel?

  // Metadata
  notes String?

  // Relations
  businesses      ClientBusiness[]
  documents       Document[]
  filings         Filing[]
  serviceRequests ServiceRequest[]
  tasks           Task[]

  // Indexes
  @@index([tenantId])
  @@index([tenantId, type])
  @@index([tenantId, riskLevel])
  @@index([email])
  @@map("clients")
}

enum ClientType {
  individual
  company
  partnership
}

enum RiskLevel {
  low
  medium
  high
}
```

#### Query Patterns

```typescript
// Good: Always include tenantId for data isolation
const clients = await prisma.client.findMany({
  where: {
    tenantId: ctx.tenantId, // Always required
    type: 'company',
  },
  include: {
    _count: {
      select: {
        documents: true,
        filings: true,
      },
    },
  },
  orderBy: { createdAt: 'desc' },
});

// Good: Use transactions for related operations
const result = await prisma.$transaction(async (tx) => {
  const client = await tx.client.create({
    data: { ...clientData, tenantId: ctx.tenantId },
  });

  await tx.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      action: 'client.create',
      entityId: client.id,
      actorUserId: ctx.user.id,
    },
  });

  return client;
});
```

---

## ✅ Testing Requirements

### Test Coverage Standards

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 95% coverage required
- **New Features**: 90% coverage required
- **Bug Fixes**: Must include regression test

### Testing Levels

#### 1. Unit Tests

```typescript
// packages/api/src/routers/__tests__/clients.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContext } from '@/test-utils/context';
import { clientsRouter } from '../clients';

describe('clients router', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  describe('list', () => {
    it('should return paginated clients for authenticated user', async () => {
      // Arrange
      const caller = clientsRouter.createCaller(ctx);
      await createTestClient(ctx, { name: 'Test Client' });

      // Act
      const result = await caller.list({
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.clients).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.clients[0].name).toBe('Test Client');
    });

    it('should filter by client type', async () => {
      // Arrange
      const caller = clientsRouter.createCaller(ctx);
      await createTestClient(ctx, { type: 'company' });
      await createTestClient(ctx, { type: 'individual' });

      // Act
      const result = await caller.list({
        type: 'company',
      });

      // Assert
      expect(result.clients).toHaveLength(1);
      expect(result.clients[0].type).toBe('company');
    });
  });

  describe('create', () => {
    it('should create client with valid data', async () => {
      // Arrange
      const caller = clientsRouter.createCaller(ctx);
      const clientData = {
        name: 'New Client',
        type: 'company' as const,
        email: 'client@example.com',
      };

      // Act
      const result = await caller.create(clientData);

      // Assert
      expect(result.name).toBe('New Client');
      expect(result.tenantId).toBe(ctx.tenantId);
    });

    it('should throw error for invalid data', async () => {
      // Arrange
      const caller = clientsRouter.createCaller(ctx);

      // Act & Assert
      await expect(caller.create({
        name: '', // Invalid: empty name
        type: 'company' as const,
      })).rejects.toThrow('Name is required');
    });
  });
});
```

#### 2. Integration Tests

```typescript
// tests/integration/client-workflow.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '@/test-utils/environment';
import { createTestUser, createTestClient } from '@/test-utils/factories';

describe('Client Management Workflow', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  it('should complete full client lifecycle', async () => {
    // Create user
    const user = await createTestUser({ role: 'ComplianceOfficer' });

    // Create client
    const client = await createTestClient(user.tenantId, {
      name: 'Test Corporation',
      type: 'company',
    });

    // Add document
    const document = await addTestDocument(client.id, {
      type: 'business_license',
      expiryDate: new Date('2025-12-31'),
    });

    // Create filing
    const filing = await createTestFiling(client.id, {
      type: 'vat_return',
      dueDate: new Date('2025-01-31'),
    });

    // Verify compliance calculation
    const compliance = await calculateClientCompliance(client.id);
    expect(compliance.score).toBeGreaterThan(80);
  });
});
```

#### 3. E2E Tests

```typescript
// tests/e2e/client-management.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsAdmin, createTestClient } from '@/test-utils/e2e';

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should create new client', async ({ page }) => {
    // Navigate to clients page
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();

    // Open create client dialog
    await page.getByRole('button', { name: 'New Client' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill client form
    await page.getByLabel('Name').fill('Test Client Corp');
    await page.getByLabel('Type').selectOption('company');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Phone').fill('+592-555-0123');

    // Submit form
    await page.getByRole('button', { name: 'Create Client' }).click();

    // Verify success
    await expect(page.getByText('Client created successfully')).toBeVisible();
    await expect(page.getByText('Test Client Corp')).toBeVisible();
  });

  test('should search clients', async ({ page }) => {
    // Create test data
    await createTestClient({ name: 'ABC Corporation' });
    await createTestClient({ name: 'XYZ Industries' });

    await page.goto('/clients');

    // Search for specific client
    await page.getByPlaceholder('Search clients...').fill('ABC');
    await page.keyboard.press('Enter');

    // Verify results
    await expect(page.getByText('ABC Corporation')).toBeVisible();
    await expect(page.getByText('XYZ Industries')).not.toBeVisible();
  });
});
```

### Test Utilities

```typescript
// test-utils/context.ts
import { createTestDatabase } from './database';
import { createTestTenant, createTestUser } from './factories';
import type { Context } from '@GCMC-KAJ/api';

export interface TestContext extends Omit<Context, 'session'> {
  cleanup: () => Promise<void>;
}

export async function createTestContext(): Promise<TestContext> {
  const db = await createTestDatabase();
  const tenant = await createTestTenant();
  const user = await createTestUser({ tenantId: tenant.id });

  return {
    user,
    tenant,
    tenantId: tenant.id,
    db,
    cleanup: async () => {
      await db.disconnect();
    },
  };
}
```

---

## 📝 Pull Request Process

### PR Requirements

#### Before Submitting

- [ ] **Tests**: All tests passing
- [ ] **Linting**: No linting errors
- [ ] **Type Checking**: No TypeScript errors
- [ ] **Build**: Successful build
- [ ] **Documentation**: Updated if needed
- [ ] **Changelog**: Entry added for user-facing changes

#### PR Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Changes Made
- List key changes
- Include any breaking changes
- Mention new dependencies

## Screenshots (if applicable)
Before/after screenshots for UI changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have made corresponding changes to documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Related Issues
Closes #123
References #456
```

### Review Process

#### Reviewer Checklist

- [ ] **Code Quality**: Follows coding standards
- [ ] **Security**: No security vulnerabilities
- [ ] **Performance**: No performance regressions
- [ ] **Testing**: Adequate test coverage
- [ ] **Documentation**: Clear and up-to-date
- [ ] **Architecture**: Consistent with project design
- [ ] **Breaking Changes**: Properly documented

#### Review Guidelines

**For Reviewers:**
- Be constructive and specific in feedback
- Explain the "why" behind suggestions
- Approve when confident in the changes
- Request changes for significant issues

**For Contributors:**
- Address all feedback promptly
- Ask questions if feedback is unclear
- Update documentation as needed
- Rebase on main before merging

---

## 🐛 Issue Guidelines

### Bug Reports

Use the bug report template:

```markdown
**Bug Description**
Clear and concise description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional Context**
Any other context about the problem here.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.

**Acceptance Criteria**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

### Issue Labels

| Label | Description | Usage |
|-------|-------------|--------|
| `bug` | Something isn't working | Bug reports |
| `enhancement` | New feature or request | Feature requests |
| `documentation` | Improvements to documentation | Documentation issues |
| `good first issue` | Good for newcomers | First-time contributors |
| `help wanted` | Extra attention is needed | Community help |
| `priority: high` | High priority issue | Critical bugs/features |
| `priority: medium` | Medium priority | Standard issues |
| `priority: low` | Low priority | Nice-to-have features |

---

## 📚 Documentation Standards

### Documentation Types

#### Code Documentation

```typescript
/**
 * Calculates the compliance score for a client based on their documents,
 * filings, and risk factors.
 *
 * @param clientId - The unique identifier of the client
 * @param options - Configuration options for the calculation
 * @param options.includeExpired - Whether to include expired documents
 * @param options.weightRiskFactors - Apply additional weight to risk factors
 *
 * @returns Promise resolving to compliance score (0-100)
 *
 * @example
 * ```typescript
 * const score = await calculateComplianceScore('client-123', {
 *   includeExpired: false,
 *   weightRiskFactors: true
 * });
 * console.log(`Compliance score: ${score}%`);
 * ```
 *
 * @throws {TRPCError} When client is not found or access is denied
 */
export async function calculateComplianceScore(
  clientId: string,
  options: ComplianceOptions = {}
): Promise<number> {
  // Implementation
}
```

#### README Updates

When adding new features, update relevant README files:

```markdown
## New Feature: Advanced Client Analytics

### Overview
The advanced analytics dashboard provides comprehensive insights into client performance, risk assessment, and compliance trends.

### Usage
```typescript
// Access analytics via tRPC
const analytics = await trpc.clientAnalytics.getAdvanced.query({
  clientId: 'client-123',
  timeRange: '1y'
});
```

### Configuration
Add the following environment variables:
```bash
ANALYTICS_ENABLED=true
ANALYTICS_CACHE_TTL=3600
```
```

#### API Documentation

Update API documentation for new endpoints:

```markdown
### `clientAnalytics.getAdvanced`

**Description:** Retrieve advanced analytics for a specific client

**Permission:** `clients:view`

**Input:**
```typescript
{
  clientId: string;
  timeRange: '1w' | '1m' | '3m' | '6m' | '1y';
  includeProjections?: boolean;
}
```

**Output:**
```typescript
{
  overview: ClientOverview;
  trends: TrendData[];
  riskAnalysis: RiskAnalysis;
  projections?: ProjectionData[];
}
```

**Example:**
```typescript
const analytics = await trpc.clientAnalytics.getAdvanced.query({
  clientId: 'client-123',
  timeRange: '6m',
  includeProjections: true
});
```
```

---

## 🚀 Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

### Release Workflow

1. **Create Release Branch**
   ```bash
   git checkout -b release/v1.2.0
   ```

2. **Update Version Numbers**
   ```bash
   # Update package.json versions
   bun version 1.2.0

   # Update changelog
   echo "## [1.2.0] - $(date +%Y-%m-%d)" >> CHANGELOG.md
   ```

3. **Run Final Tests**
   ```bash
   bun run test
   bun run build
   bun run e2e
   ```

4. **Create Release PR**
   - Target: `main` branch
   - Include changelog updates
   - Tag reviewers

5. **Deploy and Tag**
   ```bash
   # After PR merge
   git checkout main
   git pull origin main
   git tag v1.2.0
   git push origin v1.2.0
   ```

### Changelog Format

```markdown
# Changelog

## [1.2.0] - 2025-11-18

### Added
- Advanced client analytics dashboard
- Bulk document upload functionality
- Automated compliance scoring

### Changed
- Updated authentication flow for better security
- Improved database query performance
- Enhanced error messaging

### Fixed
- Fixed session timeout bug
- Resolved file upload race condition
- Corrected timezone handling in reports

### Deprecated
- Legacy API endpoints (will be removed in v2.0.0)

### Removed
- Unused utility functions
- Old migration files

### Security
- Updated dependencies to patch vulnerabilities
- Enhanced input validation
```

---

## 🏆 Recognition

### Contributor Levels

- **First-time Contributor**: Welcome badge and mention
- **Regular Contributor**: Recognition in release notes
- **Core Contributor**: Repository access and review privileges
- **Maintainer**: Full repository permissions

### Hall of Fame

Contributors who make significant impacts are recognized in our documentation and release notes.

---

## 💬 Communication Channels

### Getting Help

- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bug reports and feature requests
- **Email**: [dev-team@gcmc-kaj.com](mailto:dev-team@gcmc-kaj.com) for private matters
- **Documentation**: Comprehensive guides and references

### Stay Updated

- **Watch the Repository**: Get notified of new releases and important updates
- **Follow Releases**: Subscribe to release notifications
- **Join Discussions**: Participate in community discussions

---

Thank you for contributing to the KAJ-GCMC BTS Platform! Your contributions make this project better for everyone. 🎉

---

**Contributing Guide Version:** 1.0.0
**Platform Version:** 1.0.0
**Last Updated:** 2025-11-18
**Next Review:** 2025-12-18