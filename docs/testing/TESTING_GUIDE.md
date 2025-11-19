# Testing Guide

> **KAJ-GCMC BTS Platform - Comprehensive Testing Documentation**
> **Version:** 1.0.0
> **Last Updated:** 2025-11-18

This guide provides comprehensive testing strategies, procedures, and best practices for ensuring the quality and reliability of the KAJ-GCMC BTS Platform.

---

## 📚 Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Strategy](#testing-strategy)
- [Test Types & Levels](#test-types--levels)
- [Testing Tools & Frameworks](#testing-tools--frameworks)
- [Test Environment Setup](#test-environment-setup)
- [Test Writing Guidelines](#test-writing-guidelines)
- [Test Execution](#test-execution)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Accessibility Testing](#accessibility-testing)
- [Test Automation](#test-automation)
- [Quality Gates](#quality-gates)

---

## 🎯 Testing Philosophy

### Core Principles

1. **Quality First**: Testing is not an afterthought but integral to development
2. **Shift Left**: Test early and often in the development cycle
3. **Risk-Based Testing**: Focus testing efforts on high-risk areas
4. **Automation**: Automate repetitive tests while maintaining human oversight
5. **Continuous Improvement**: Learn from failures and continuously refine processes

### Testing Pyramid

```
    🔺 E2E Tests (10%)
      ├─ UI Integration Tests
      ├─ User Journey Tests
      └─ Cross-Browser Tests

  🔺🔺 Integration Tests (30%)
      ├─ API Integration Tests
      ├─ Database Integration Tests
      └─ Service Integration Tests

🔺🔺🔺 Unit Tests (60%)
      ├─ Component Tests
      ├─ Function Tests
      └─ Business Logic Tests
```

### Quality Standards

- **Code Coverage**: Minimum 80% overall, 95% for critical paths
- **Test Reliability**: <1% flaky test rate
- **Performance**: All tests complete in <30 minutes
- **Maintainability**: Tests are clear, focused, and well-documented

---

## 📋 Testing Strategy

### Testing Objectives

1. **Functional Correctness**: Ensure all features work as specified
2. **Reliability**: System performs consistently under normal conditions
3. **Performance**: System meets speed and efficiency requirements
4. **Security**: All vulnerabilities are identified and mitigated
5. **Usability**: User experience meets accessibility and usability standards
6. **Compatibility**: System works across supported environments

### Risk-Based Testing Approach

#### High-Risk Areas (Priority 1)
- **Authentication & Authorization**: User login, RBAC, session management
- **Data Security**: PII handling, encryption, data access
- **Financial Data**: Tax calculations, filing amounts, compliance scores
- **File Operations**: Document uploads, storage, retrieval
- **Compliance Logic**: Risk calculations, deadline tracking

#### Medium-Risk Areas (Priority 2)
- **User Interface**: Form validation, navigation, responsive design
- **Reporting**: Data accuracy, export functionality
- **Notifications**: Email delivery, alert timing
- **API Integration**: Third-party service integration

#### Lower-Risk Areas (Priority 3)
- **Cosmetic UI Elements**: Styling, animations
- **Non-Critical Features**: Nice-to-have functionality
- **Administrative Tools**: Rarely used configuration options

### Test Coverage Matrix

| Component | Unit Tests | Integration Tests | E2E Tests |
|-----------|------------|-------------------|-----------|
| **Authentication** | ✅ 95% | ✅ 90% | ✅ 85% |
| **Client Management** | ✅ 90% | ✅ 85% | ✅ 80% |
| **Document Management** | ✅ 85% | ✅ 80% | ✅ 75% |
| **Filing System** | ✅ 90% | ✅ 85% | ✅ 80% |
| **Compliance Engine** | ✅ 95% | ✅ 90% | ✅ 70% |
| **Reporting** | ✅ 80% | ✅ 75% | ✅ 60% |

---

## 🔬 Test Types & Levels

### Unit Tests

#### Purpose
Test individual components, functions, or methods in isolation.

#### Scope
- Pure functions and business logic
- React components
- Utility functions
- Database models
- API route handlers

#### Example: Testing Client Validation

```typescript
// packages/api/src/utils/__tests__/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateClientData } from '../validation';

describe('validateClientData', () => {
  it('should validate correct client data', () => {
    const validClient = {
      name: 'ABC Corporation',
      type: 'company' as const,
      email: 'contact@abc.com',
      tin: 'TIN123456789',
    };

    const result = validateClientData(validClient);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid email format', () => {
    const invalidClient = {
      name: 'ABC Corporation',
      type: 'company' as const,
      email: 'invalid-email',
    };

    const result = validateClientData(invalidClient);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('should require name field', () => {
    const clientWithoutName = {
      type: 'company' as const,
      email: 'contact@abc.com',
    };

    const result = validateClientData(clientWithoutName);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });
});
```

#### Example: Testing React Component

```typescript
// apps/web/src/components/__tests__/ClientCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientCard } from '../ClientCard';

const mockClient = {
  id: 1,
  name: 'Test Client',
  type: 'company' as const,
  email: 'test@example.com',
  riskLevel: 'medium' as const,
};

describe('ClientCard', () => {
  it('renders client information', () => {
    render(<ClientCard client={mockClient} />);

    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<ClientCard client={mockClient} onEdit={onEdit} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockClient);
  });

  it('shows confirmation before deletion', async () => {
    const onDelete = vi.fn();
    window.confirm = vi.fn(() => true);

    render(<ClientCard client={mockClient} onDelete={onDelete} />);

    fireEvent.click(screen.getByText('Delete'));

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this client?'
    );

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(mockClient.id);
    });
  });
});
```

### Integration Tests

#### Purpose
Test interactions between different components, modules, or systems.

#### Scope
- API endpoint testing
- Database operations
- Service integrations
- Cross-module interactions

#### Example: API Integration Test

```typescript
// packages/api/src/routers/__tests__/clients.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestContext, cleanupTestContext } from '../../test-utils';
import { clientsRouter } from '../clients';
import type { TestContext } from '../../test-utils/types';

describe('clients router integration', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await cleanupTestContext(ctx);
  });

  describe('client lifecycle', () => {
    it('should handle complete client management workflow', async () => {
      const caller = clientsRouter.createCaller(ctx);

      // Create client
      const newClient = await caller.create({
        name: 'Integration Test Corp',
        type: 'company',
        email: 'test@integration.com',
        tin: 'TIN987654321',
      });

      expect(newClient.id).toBeDefined();
      expect(newClient.tenantId).toBe(ctx.tenantId);

      // Fetch client
      const fetchedClient = await caller.get({ id: newClient.id });
      expect(fetchedClient.name).toBe('Integration Test Corp');

      // Update client
      const updatedClient = await caller.update({
        id: newClient.id,
        data: { riskLevel: 'high' },
      });
      expect(updatedClient.riskLevel).toBe('high');

      // List clients (should include our new client)
      const clientList = await caller.list();
      expect(clientList.clients.some(c => c.id === newClient.id)).toBe(true);

      // Delete client
      await caller.delete({ id: newClient.id });

      // Verify deletion
      await expect(caller.get({ id: newClient.id }))
        .rejects.toThrow('Client not found');
    });
  });

  describe('database constraints', () => {
    it('should enforce tenant isolation', async () => {
      const caller = clientsRouter.createCaller(ctx);

      // Create client in current tenant
      const client = await caller.create({
        name: 'Tenant Test Client',
        type: 'company',
      });

      // Create different tenant context
      const otherTenantCtx = await createTestContext();
      const otherCaller = clientsRouter.createCaller(otherTenantCtx);

      // Should not be able to access client from other tenant
      await expect(otherCaller.get({ id: client.id }))
        .rejects.toThrow('Client not found');

      await cleanupTestContext(otherTenantCtx);
    });
  });
});
```

### End-to-End (E2E) Tests

#### Purpose
Test complete user workflows across the entire application.

#### Scope
- User journey testing
- Cross-browser compatibility
- Full-stack integration
- Real-world scenarios

#### Example: User Journey Test

```typescript
// tests/e2e/client-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Client Management Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as compliance officer
    await page.goto('/login');
    await page.getByLabel('Email').fill('compliance@gcmc.com');
    await page.getByLabel('Password').fill('CompliantPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify successful login
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('complete client onboarding workflow', async ({ page }) => {
    // Navigate to clients page
    await page.getByRole('link', { name: 'Clients' }).click();
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();

    // Create new client
    await page.getByRole('button', { name: 'New Client' }).click();

    // Fill client form
    await page.getByLabel('Client Name').fill('E2E Test Corporation');
    await page.getByLabel('Client Type').selectOption('company');
    await page.getByLabel('Email').fill('e2e@testcorp.com');
    await page.getByLabel('Phone').fill('+592-555-0123');
    await page.getByLabel('TIN').fill('TIN123456789E2E');
    await page.getByLabel('Risk Level').selectOption('medium');

    // Submit form
    await page.getByRole('button', { name: 'Create Client' }).click();

    // Verify success message and navigation
    await expect(page.getByText('Client created successfully')).toBeVisible();
    await expect(page.getByText('E2E Test Corporation')).toBeVisible();

    // Upload document for the client
    await page.getByRole('button', { name: 'Upload Document' }).click();
    await page.getByLabel('Document Type').selectOption('business_license');
    await page.getByLabel('Document Title').fill('Business License 2024');

    // Upload file
    const fileInput = page.getByLabel('Choose file');
    await fileInput.setInputFiles('tests/fixtures/sample-business-license.pdf');

    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByText('Document uploaded successfully')).toBeVisible();

    // Create filing for the client
    await page.getByRole('tab', { name: 'Filings' }).click();
    await page.getByRole('button', { name: 'New Filing' }).click();

    await page.getByLabel('Filing Type').selectOption('vat_return');
    await page.getByLabel('Tax Period').fill('2024-Q4');
    await page.getByLabel('Due Date').fill('2025-01-31');

    await page.getByRole('button', { name: 'Create Filing' }).click();
    await expect(page.getByText('Filing created successfully')).toBeVisible();

    // Verify compliance score calculation
    await page.getByRole('tab', { name: 'Overview' }).click();
    const complianceScore = page.getByTestId('compliance-score');
    await expect(complianceScore).toBeVisible();

    // Score should be greater than 0 after adding documents and filings
    const scoreText = await complianceScore.textContent();
    const score = parseInt(scoreText?.match(/\d+/)?.[0] || '0');
    expect(score).toBeGreaterThan(0);
  });

  test('client search and filtering', async ({ page }) => {
    // Navigate to clients page
    await page.getByRole('link', { name: 'Clients' }).click();

    // Test search functionality
    await page.getByPlaceholder('Search clients...').fill('E2E Test');
    await page.keyboard.press('Enter');

    // Should show filtered results
    await expect(page.getByText('E2E Test Corporation')).toBeVisible();

    // Test filter by type
    await page.getByLabel('Filter by type').selectOption('company');
    await expect(page.getByText('E2E Test Corporation')).toBeVisible();

    // Clear filters
    await page.getByRole('button', { name: 'Clear Filters' }).click();

    // Should show all clients again
    await page.getByPlaceholder('Search clients...').fill('');
  });

  test('client data export', async ({ page }) => {
    // Navigate to clients page
    await page.getByRole('link', { name: 'Clients' }).click();

    // Select client
    await page.getByText('E2E Test Corporation').click();

    // Navigate to reports tab
    await page.getByRole('tab', { name: 'Reports' }).click();

    // Generate client report
    await page.getByRole('button', { name: 'Generate Client Report' }).click();
    await page.getByLabel('Report Type').selectOption('client_file');
    await page.getByLabel('Include Period').selectOption('2024');

    // Start download
    const downloadPromise = page.waitForDownload();
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/client-file-report.*\.pdf/);
  });
});
```

---

## 🛠 Testing Tools & Frameworks

### Core Testing Stack

#### Frontend Testing
```json
{
  "testing-library/react": "^13.4.0",
  "testing-library/jest-dom": "^5.16.5",
  "testing-library/user-event": "^14.4.3",
  "vitest": "^0.34.0",
  "@vitest/ui": "^0.34.0"
}
```

#### Backend Testing
```json
{
  "vitest": "^0.34.0",
  "supertest": "^6.3.0",
  "msw": "^1.3.0"
}
```

#### E2E Testing
```json
{
  "@playwright/test": "^1.40.0"
}
```

#### Performance Testing
```json
{
  "k6": "^0.47.0",
  "lighthouse-ci": "^0.12.0"
}
```

### Testing Configuration

#### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test-utils/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/test-utils': path.resolve(__dirname, './test-utils'),
    },
  },
});
```

#### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['github'],
  ],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🏗 Test Environment Setup

### Test Database Setup

```bash
#!/bin/bash
# scripts/setup-test-db.sh

set -e

# Create test database
createdb gcmc_test || true

# Set test environment variables
export DATABASE_URL="postgresql://gcmc:gcmc@localhost:5432/gcmc_test"
export NODE_ENV="test"
export REDIS_URL="redis://localhost:6379/1"

# Run migrations
bun run db:migrate

# Seed test data
bun run db:seed:test
```

### Test Data Factory

```typescript
// test-utils/factories.ts
import { faker } from '@faker-js/faker';
import prisma from '@GCMC-KAJ/db';
import type { Client, User, Tenant } from '@GCMC-KAJ/db';

export async function createTestTenant(
  data: Partial<Tenant> = {}
): Promise<Tenant> {
  return prisma.tenant.create({
    data: {
      name: data.name || faker.company.name(),
      subdomain: data.subdomain || faker.internet.domainWord(),
      contactInfo: {
        email: faker.internet.email(),
        phone: faker.phone.number(),
      },
      settings: {
        timezone: 'America/Guyana',
        currency: 'GYD',
      },
      ...data,
    },
  });
}

export async function createTestUser(
  data: Partial<User & { tenantId: string }>
): Promise<User> {
  return prisma.user.create({
    data: {
      email: data.email || faker.internet.email(),
      name: data.name || faker.person.fullName(),
      role: data.role || 'ComplianceOfficer',
      tenantId: data.tenantId!,
      emailVerified: new Date(),
      ...data,
    },
  });
}

export async function createTestClient(
  tenantId: string,
  data: Partial<Client> = {}
): Promise<Client> {
  return prisma.client.create({
    data: {
      tenantId,
      name: data.name || faker.company.name(),
      type: data.type || 'company',
      email: data.email || faker.internet.email(),
      phone: data.phone || faker.phone.number(),
      tin: data.tin || `TIN${faker.string.alphanumeric(9)}`,
      sector: data.sector || faker.commerce.department(),
      riskLevel: data.riskLevel || 'medium',
      ...data,
    },
  });
}

export async function createTestDocument(
  clientId: number,
  data: any = {}
) {
  const documentType = await prisma.documentType.findFirst() ||
    await prisma.documentType.create({
      data: {
        name: 'Test Document Type',
        category: 'business',
        required: false,
      },
    });

  return prisma.document.create({
    data: {
      clientId,
      documentTypeId: documentType.id,
      title: data.title || 'Test Document',
      referenceNumber: data.referenceNumber || faker.string.alphanumeric(10),
      issueDate: data.issueDate || new Date(),
      expiryDate: data.expiryDate,
      issuedBy: data.issuedBy || 'Test Authority',
      status: data.status || 'active',
      ...data,
    },
  });
}
```

### Mock Service Providers

```typescript
// test-utils/mocks.ts
import { vi } from 'vitest';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock external API responses
export const mockHandlers = [
  // Mock email service
  rest.post('*/send-email', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, messageId: 'mock-message-id' })
    );
  }),

  // Mock file storage service
  rest.put('*/upload/*', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  // Mock compliance service
  rest.post('*/calculate-compliance', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ score: 85, factors: ['documents', 'filings'] })
    );
  }),
];

export const mockServer = setupServer(...mockHandlers);

// Mock implementations for testing
export const mockEmailService = {
  sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
  sendNotification: vi.fn().mockResolvedValue({ success: true }),
  sendReport: vi.fn().mockResolvedValue({ success: true }),
};

export const mockStorageService = {
  uploadFile: vi.fn().mockResolvedValue({
    url: 'https://mock-storage.com/file.pdf',
    key: 'mock-file-key'
  }),
  deleteFile: vi.fn().mockResolvedValue({ success: true }),
  getPresignedUrl: vi.fn().mockResolvedValue({
    uploadUrl: 'https://mock-storage.com/upload',
    downloadUrl: 'https://mock-storage.com/download'
  }),
};
```

---

## ✍️ Test Writing Guidelines

### Test Structure

#### AAA Pattern (Arrange, Act, Assert)

```typescript
describe('Client validation', () => {
  it('should validate email format', () => {
    // Arrange
    const clientData = {
      name: 'Test Client',
      email: 'invalid-email',
      type: 'company' as const,
    };

    // Act
    const result = validateClientData(clientData);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });
});
```

#### Given-When-Then Pattern (for E2E tests)

```typescript
test('should create client successfully', async ({ page }) => {
  // Given: User is logged in as compliance officer
  await loginAs(page, 'compliance@gcmc.com');
  await page.goto('/clients');

  // When: User creates a new client
  await page.getByRole('button', { name: 'New Client' }).click();
  await page.getByLabel('Name').fill('Test Client');
  await page.getByRole('button', { name: 'Create' }).click();

  // Then: Client should be created successfully
  await expect(page.getByText('Client created successfully')).toBeVisible();
  await expect(page.getByText('Test Client')).toBeVisible();
});
```

### Test Naming Conventions

#### Unit Tests
- **Format**: `should [expected behavior] when [condition]`
- **Examples**:
  - `should return validation error when email is invalid`
  - `should calculate compliance score when all documents are current`
  - `should throw unauthorized error when user lacks permission`

#### Integration Tests
- **Format**: `should [complete workflow] successfully`
- **Examples**:
  - `should complete client creation workflow successfully`
  - `should handle document upload with validation`
  - `should process filing submission end-to-end`

#### E2E Tests
- **Format**: User story or journey description
- **Examples**:
  - `complete client onboarding journey`
  - `compliance officer manages document workflow`
  - `admin configures user permissions`

### Test Documentation

```typescript
/**
 * Tests the client compliance score calculation algorithm.
 *
 * This test suite verifies that the compliance scoring system correctly:
 * 1. Calculates base scores from document completeness
 * 2. Applies risk factor adjustments
 * 3. Handles edge cases (no documents, expired documents)
 * 4. Returns consistent results for identical inputs
 *
 * Business Context:
 * Compliance scores are critical for risk assessment and regulatory
 * reporting. The algorithm must be accurate and auditable.
 */
describe('Compliance Score Calculation', () => {
  /**
   * Verifies that a client with all required documents
   * receives a high compliance score (>85).
   */
  it('should assign high score for complete documentation', () => {
    // Test implementation
  });
});
```

### Error Testing Patterns

```typescript
describe('Error handling', () => {
  it('should handle database connection errors gracefully', async () => {
    // Arrange: Mock database connection failure
    vi.mocked(prisma.client.findMany).mockRejectedValue(
      new Error('Database connection failed')
    );

    // Act & Assert
    await expect(clientsRouter.list()).rejects.toThrow(
      'Database connection failed'
    );
  });

  it('should validate required fields', () => {
    const invalidData = { /* missing required fields */ };

    expect(() => validateClientData(invalidData))
      .toThrow('Name is required');
  });

  it('should handle concurrent access conflicts', async () => {
    // Simulate concurrent updates to the same client
    const promises = Array(5).fill(0).map((_, i) =>
      updateClient(clientId, { name: `Updated Name ${i}` })
    );

    // Should handle concurrent updates without corruption
    await Promise.allSettled(promises);

    const finalClient = await getClient(clientId);
    expect(finalClient.name).toMatch(/Updated Name \d/);
  });
});
```

---

## 🚀 Test Execution

### Local Development Testing

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run specific test suites
bun run test:unit
bun run test:integration
bun run test:e2e

# Run tests with coverage
bun run test:coverage

# Run tests for specific files
bun run test src/components/ClientCard
bun run test packages/api/src/routers/clients

# Run E2E tests in headed mode (see browser)
bun run test:e2e:headed

# Run performance tests
bun run test:performance
```

### CI/CD Testing Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run unit tests
        run: bun run test:unit --coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: gcmc_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Setup database
        run: bun run db:push

      - name: Run integration tests
        run: bun run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/gcmc_test
          REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps

      - name: Start application
        run: bun run dev &
        env:
          NODE_ENV: test

      - name: Wait for application
        run: npx wait-on http://localhost:3001

      - name: Run E2E tests
        run: bun run test:e2e

      - name: Upload test reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Reporting

#### Coverage Reports

```typescript
// vitest.config.ts coverage configuration
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.*',
        'src/test-utils/**',
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
        'src/utils/': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
      },
    },
  },
});
```

#### Test Results Dashboard

```bash
# Generate comprehensive test report
bun run test:report

# View coverage in browser
bun run coverage:view

# Generate performance baseline
bun run perf:baseline

# Compare performance against baseline
bun run perf:compare
```

---

## ⚡ Performance Testing

### Load Testing with k6

```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, group } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    errors: ['rate<0.1'], // Custom error rate under 10%
  },
};

// Test data
const baseUrl = 'http://localhost:3000';
let authToken;

export function setup() {
  // Login and get auth token
  const loginResponse = http.post(`${baseUrl}/auth/login`, {
    email: 'test@example.com',
    password: 'testpassword',
  });

  const token = loginResponse.json('token');
  return { authToken: token };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.authToken}`,
    'Content-Type': 'application/json',
  };

  group('Client Management API', () => {
    // Test client list endpoint
    const listResponse = http.get(`${baseUrl}/trpc/clients.list`, {
      headers,
    });

    check(listResponse, {
      'list clients status is 200': (r) => r.status === 200,
      'list response time < 200ms': (r) => r.timings.duration < 200,
    }) || errorRate.add(1);

    // Test client creation
    const createResponse = http.post(
      `${baseUrl}/trpc/clients.create`,
      JSON.stringify({
        name: `Test Client ${__VU}-${__ITER}`,
        type: 'company',
        email: `test${__VU}${__ITER}@example.com`,
      }),
      { headers }
    );

    check(createResponse, {
      'create client status is 200': (r) => r.status === 200,
      'create response time < 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);

    // Test document upload simulation
    const uploadResponse = http.post(
      `${baseUrl}/trpc/documentUpload.getUploadUrl`,
      JSON.stringify({
        clientId: createResponse.json('result.data.id'),
        fileName: 'test-document.pdf',
        fileSize: 1024000,
      }),
      { headers }
    );

    check(uploadResponse, {
      'upload URL generation status is 200': (r) => r.status === 200,
      'upload response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
  });

  // Think time between requests
  sleep(1);
}

export function teardown(data) {
  // Cleanup if necessary
  console.log('Load test completed');
}
```

### Browser Performance Testing

```javascript
// tests/performance/lighthouse.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouseTests() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices'],
    port: chrome.port,
  };

  const urls = [
    'http://localhost:3001/', // Dashboard
    'http://localhost:3001/clients', // Client list
    'http://localhost:3001/documents', // Documents
  ];

  const results = [];

  for (const url of urls) {
    console.log(`Testing ${url}...`);
    const runnerResult = await lighthouse(url, options);

    const scores = {
      url,
      performance: runnerResult.lhr.categories.performance.score * 100,
      accessibility: runnerResult.lhr.categories.accessibility.score * 100,
      bestPractices: runnerResult.lhr.categories['best-practices'].score * 100,
    };

    results.push(scores);

    // Performance thresholds
    if (scores.performance < 80) {
      console.warn(`Performance score for ${url} is below 80: ${scores.performance}`);
    }
    if (scores.accessibility < 95) {
      console.warn(`Accessibility score for ${url} is below 95: ${scores.accessibility}`);
    }
  }

  await chrome.kill();
  return results;
}

module.exports = { runLighthouseTests };
```

---

## 🔒 Security Testing

### Authentication & Authorization Tests

```typescript
// tests/security/auth.test.ts
describe('Authentication Security', () => {
  it('should prevent SQL injection in login', async () => {
    const maliciousEmail = "admin'; DROP TABLE users; --";

    const response = await request(app)
      .post('/auth/login')
      .send({
        email: maliciousEmail,
        password: 'password',
      });

    expect(response.status).toBe(401);
    // Verify database tables still exist
    const userCount = await prisma.user.count();
    expect(userCount).toBeGreaterThan(0);
  });

  it('should enforce rate limiting on login attempts', async () => {
    const loginAttempts = Array(10).fill(0).map(() =>
      request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
    );

    const responses = await Promise.all(loginAttempts);
    const rateLimitedResponses = responses.filter(r => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  it('should validate JWT tokens properly', async () => {
    const invalidToken = 'invalid.jwt.token';

    const response = await request(app)
      .get('/trpc/privateData')
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(response.status).toBe(401);
  });

  it('should enforce RBAC permissions', async () => {
    const viewerToken = await getTokenForRole('Viewer');

    const response = await request(app)
      .post('/trpc/clients.create')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        name: 'Test Client',
        type: 'company',
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
});
```

### Input Validation Tests

```typescript
// tests/security/input-validation.test.ts
describe('Input Validation Security', () => {
  it('should sanitize XSS attempts in client names', async () => {
    const maliciousName = '<script>alert("XSS")</script>';

    const response = await request(app)
      .post('/trpc/clients.create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: maliciousName,
        type: 'company',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('Invalid characters');
  });

  it('should validate file uploads for malicious content', async () => {
    const maliciousFile = Buffer.from('<?php eval($_POST["cmd"]); ?>', 'utf-8');

    const response = await request(app)
      .post('/trpc/documentUpload.confirmUpload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', maliciousFile, 'malicious.php');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('Invalid file type');
  });

  it('should prevent directory traversal in file paths', async () => {
    const maliciousPath = '../../../etc/passwd';

    const response = await request(app)
      .get(`/documents/${maliciousPath}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(400);
  });
});
```

### Data Protection Tests

```typescript
// tests/security/data-protection.test.ts
describe('Data Protection', () => {
  it('should enforce tenant isolation', async () => {
    const tenant1Token = await getTokenForTenant('tenant1');
    const tenant2Token = await getTokenForTenant('tenant2');

    // Create client in tenant1
    const client = await createTestClient('tenant1');

    // Try to access from tenant2
    const response = await request(app)
      .get(`/trpc/clients.get?input=${client.id}`)
      .set('Authorization', `Bearer ${tenant2Token}`);

    expect(response.status).toBe(404);
  });

  it('should encrypt sensitive data at rest', async () => {
    const client = await createTestClient('test-tenant', {
      tin: 'TIN123456789',
      nisNumber: 'NIS987654321',
    });

    // Check that sensitive data is encrypted in database
    const rawClient = await prisma.$queryRaw`
      SELECT tin, "nisNumber" FROM clients WHERE id = ${client.id}
    `;

    expect(rawClient[0].tin).not.toBe('TIN123456789');
    expect(rawClient[0].nisNumber).not.toBe('NIS987654321');
  });

  it('should mask sensitive data in logs', async () => {
    // Capture logs during client creation
    const logSpy = vi.spyOn(console, 'log');

    await createTestClient('test-tenant', {
      tin: 'TIN123456789',
      email: 'sensitive@example.com',
    });

    // Verify sensitive data is not in logs
    const logCalls = logSpy.mock.calls.flat();
    const hasUnmaskedTIN = logCalls.some(call =>
      typeof call === 'string' && call.includes('TIN123456789')
    );
    const hasUnmaskedEmail = logCalls.some(call =>
      typeof call === 'string' && call.includes('sensitive@example.com')
    );

    expect(hasUnmaskedTIN).toBe(false);
    expect(hasUnmaskedEmail).toBe(false);

    logSpy.mockRestore();
  });
});
```

---

## ♿ Accessibility Testing

### Automated Accessibility Tests

```typescript
// tests/accessibility/a11y.test.ts
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ClientCard } from '../../../src/components/ClientCard';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('should have no accessibility violations on ClientCard', async () => {
    const { container } = render(
      <ClientCard
        client={{
          id: 1,
          name: 'Test Client',
          type: 'company',
          email: 'test@example.com',
          riskLevel: 'medium',
        }}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support keyboard navigation', () => {
    const { getByRole } = render(<ClientCard client={mockClient} />);
    const editButton = getByRole('button', { name: 'Edit' });

    // Should be focusable
    editButton.focus();
    expect(document.activeElement).toBe(editButton);

    // Should respond to Enter key
    fireEvent.keyDown(editButton, { key: 'Enter', code: 'Enter' });
    // Verify edit action was triggered
  });

  it('should have proper ARIA labels', () => {
    const { getByRole } = render(<ClientCard client={mockClient} />);

    expect(getByRole('article')).toHaveAttribute('aria-label', 'Client card for Test Client');
    expect(getByRole('button', { name: 'Edit' })).toHaveAttribute('aria-label', 'Edit Test Client');
  });

  it('should meet color contrast requirements', async () => {
    // This would typically use a specialized testing tool
    const { container } = render(<ClientCard client={mockClient} />);

    // Check contrast ratios programmatically
    const riskBadge = container.querySelector('[data-testid="risk-badge"]');
    const styles = getComputedStyle(riskBadge);

    // Verify contrast meets WCAG AA standards
    const contrastRatio = calculateContrastRatio(
      styles.color,
      styles.backgroundColor
    );

    expect(contrastRatio).toBeGreaterThan(4.5); // WCAG AA requirement
  });
});
```

### E2E Accessibility Testing

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility E2E Tests', () => {
  test('should have no accessibility violations on main pages', async ({ page }) => {
    await page.goto('/login');

    // Test login page
    const loginResults = await new AxeBuilder({ page }).analyze();
    expect(loginResults.violations).toEqual([]);

    // Login and test dashboard
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL('/dashboard');
    const dashboardResults = await new AxeBuilder({ page }).analyze();
    expect(dashboardResults.violations).toEqual([]);

    // Test clients page
    await page.getByRole('link', { name: 'Clients' }).click();
    const clientsResults = await new AxeBuilder({ page }).analyze();
    expect(clientsResults.violations).toEqual([]);
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/clients');

    // Test heading structure
    const headings = await page.getByRole('heading').allTextContents();
    expect(headings[0]).toBe('Clients'); // Main heading

    // Test landmark navigation
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"]').count();
    expect(landmarks).toBeGreaterThan(0);

    // Test skip links
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
  });

  test('should work with keyboard-only navigation', async ({ page }) => {
    await page.goto('/clients');

    // Navigate through interactive elements
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Main nav
    await page.keyboard.press('Tab'); // Search input

    const searchInput = page.getByPlaceholder('Search clients...');
    await expect(searchInput).toBeFocused();

    // Use keyboard to interact with search
    await page.keyboard.type('Test Client');
    await page.keyboard.press('Enter');

    // Verify search results are accessible
    const results = page.getByRole('region', { name: 'Search results' });
    await expect(results).toBeVisible();
  });
});
```

---

## 🤖 Test Automation

### Automated Test Generation

```typescript
// scripts/generate-tests.ts
import { generateTestsForRouter } from './test-generators';

// Auto-generate basic CRUD tests for all routers
const routers = [
  'clients',
  'documents',
  'filings',
  'services',
];

for (const router of routers) {
  await generateTestsForRouter(router);
  console.log(`Generated tests for ${router} router`);
}
```

### Visual Regression Testing

```typescript
// tests/visual/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('client list page should match screenshot', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');

    // Take screenshot and compare with baseline
    await expect(page).toHaveScreenshot('clients-page.png');
  });

  test('client form should match screenshot', async ({ page }) => {
    await page.goto('/clients/new');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('dialog')).toHaveScreenshot('client-form.png');
  });

  test('responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    await expect(page).toHaveScreenshot('dashboard-mobile.png');
  });
});
```

### Database State Testing

```typescript
// test-utils/database-state.ts
export class DatabaseStateManager {
  private snapshots: Map<string, any> = new Map();

  async captureState(label: string) {
    const state = {
      users: await prisma.user.findMany(),
      clients: await prisma.client.findMany(),
      documents: await prisma.document.findMany(),
      // ... other tables
    };

    this.snapshots.set(label, state);
  }

  async restoreState(label: string) {
    const state = this.snapshots.get(label);
    if (!state) throw new Error(`No snapshot found: ${label}`);

    // Clear current state
    await prisma.$transaction([
      prisma.document.deleteMany(),
      prisma.client.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Restore snapshot
    await prisma.$transaction([
      prisma.user.createMany({ data: state.users }),
      prisma.client.createMany({ data: state.clients }),
      prisma.document.createMany({ data: state.documents }),
    ]);
  }

  async compareStates(label1: string, label2: string) {
    const state1 = this.snapshots.get(label1);
    const state2 = this.snapshots.get(label2);

    return {
      usersChanged: !isEqual(state1.users, state2.users),
      clientsChanged: !isEqual(state1.clients, state2.clients),
      documentsChanged: !isEqual(state1.documents, state2.documents),
    };
  }
}
```

---

## 🚪 Quality Gates

### Pre-Commit Quality Gates

```bash
#!/bin/bash
# .husky/pre-commit

# Run linting
echo "Running linter..."
bun run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed. Please fix issues before committing."
  exit 1
fi

# Run type checking
echo "Running type check..."
bun run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type checking failed. Please fix issues before committing."
  exit 1
fi

# Run unit tests for changed files
echo "Running tests for changed files..."
bun run test:changed
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Please fix issues before committing."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
```

### CI Quality Gates

```yaml
# Quality gate configuration
quality_gates:
  unit_tests:
    coverage_threshold: 80
    failure_threshold: 0
    required: true

  integration_tests:
    failure_threshold: 0
    required: true

  e2e_tests:
    failure_threshold: 2  # Allow 2 flaky tests
    required: false  # Optional for draft PRs

  performance_tests:
    response_time_p95: 500ms
    error_rate_threshold: 1%
    required: true

  security_tests:
    vulnerability_threshold: 0
    required: true

  accessibility_tests:
    violation_threshold: 0
    required: true
```

### Release Quality Gates

```typescript
// scripts/release-quality-check.ts
interface QualityMetrics {
  testCoverage: number;
  performanceScore: number;
  securityScore: number;
  accessibilityScore: number;
}

async function checkReleaseQuality(): Promise<boolean> {
  const metrics = await gatherQualityMetrics();

  const qualityGates = {
    testCoverage: metrics.testCoverage >= 85,
    performanceScore: metrics.performanceScore >= 90,
    securityScore: metrics.securityScore >= 95,
    accessibilityScore: metrics.accessibilityScore >= 95,
  };

  const passed = Object.values(qualityGates).every(Boolean);

  if (!passed) {
    console.error('❌ Quality gates failed:', qualityGates);
    return false;
  }

  console.log('✅ All quality gates passed');
  return true;
}
```

---

## 📊 Testing Metrics & Reporting

### Test Metrics Dashboard

```typescript
// scripts/test-metrics.ts
interface TestMetrics {
  totalTests: number;
  passRate: number;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  performance: {
    averageExecutionTime: number;
    slowestTests: Array<{
      name: string;
      duration: number;
    }>;
  };
  flaky: {
    count: number;
    tests: string[];
  };
}

async function generateTestReport(): Promise<TestMetrics> {
  // Collect metrics from test results
  const metrics = await analyzeTestResults();

  // Generate HTML report
  await generateHTMLReport(metrics);

  // Send to monitoring system
  await sendMetricsToMonitoring(metrics);

  return metrics;
}
```

### Continuous Quality Monitoring

```typescript
// monitoring/test-quality-monitor.ts
class TestQualityMonitor {
  async trackTestStability() {
    // Track flaky tests over time
    // Alert when flaky test rate exceeds threshold
  }

  async trackCoverage() {
    // Monitor coverage trends
    // Alert on coverage regression
  }

  async trackPerformance() {
    // Monitor test execution time
    // Alert on performance degradation
  }

  async generateWeeklyReport() {
    // Aggregate weekly testing metrics
    // Send summary to team
  }
}
```

---

**Testing Guide Version:** 1.0.0
**Platform Version:** 1.0.0
**Last Updated:** 2025-11-18
**Next Review:** 2025-12-18

For support with testing: [qa-team@gcmc-kaj.com](mailto:qa-team@gcmc-kaj.com)