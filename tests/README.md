# GCMC Platform E2E Testing Infrastructure

Comprehensive Playwright-based end-to-end testing infrastructure for the GCMC compliance platform.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

This testing infrastructure provides:

- **Multi-browser testing**: Chromium, Firefox, WebKit
- **Mobile testing**: Mobile Chrome, Mobile Safari, Tablet viewports
- **Accessibility testing**: WCAG 2.1 Level AA compliance
- **Visual regression testing**: Screenshot comparison
- **Performance monitoring**: Page load times, Time to Interactive
- **Comprehensive fixtures**: Authentication, data seeding, helpers

## Setup

### Prerequisites

- Bun 1.2.18 or higher
- PostgreSQL database
- Redis (for background jobs)
- MinIO (for file storage)

### Initial Setup

1. **Install dependencies:**

```bash
bun install
```

2. **Install Playwright browsers:**

```bash
bun run test:e2e:install
```

3. **Configure test environment:**

Copy `.env.example` to `.env.test` and update with test database credentials:

```bash
cp .env.example .env.test
```

**IMPORTANT:** Ensure `DATABASE_URL` points to a dedicated test database:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gcmc_kaj_test"
```

4. **Setup test database:**

```bash
# Create test database
createdb gcmc_kaj_test

# Run migrations
bun run db:push
```

5. **Start required services:**

```bash
# Start PostgreSQL, Redis, MinIO
bun run docker:up

# Start web application
bun run dev:web
```

## Running Tests

### Run all tests

```bash
bun run test:e2e
```

### Run tests with UI mode (recommended for development)

```bash
bun run test:e2e:ui
```

### Run tests in headed mode (see browser)

```bash
bun run test:e2e:headed
```

### Run tests with debugger

```bash
bun run test:e2e:debug
```

### Run specific browser

```bash
bun run test:e2e:chromium
bun run test:e2e:firefox
bun run test:e2e:webkit
```

### Run mobile tests

```bash
bun run test:e2e:mobile
```

### Run specific test suites

```bash
# Authentication tests
bun run test:e2e:auth

# Workflow tests
bun run test:e2e:workflows

# CRUD tests
bun run test:e2e:crud

# Navigation tests
bun run test:e2e:navigation

# Visual regression tests
bun run test:e2e:visual

# Accessibility tests
bun run test:e2e:a11y
```

### View test report

```bash
bun run test:e2e:report
```

## Test Structure

```
tests/
├── e2e/                      # End-to-end test suites
│   ├── auth/                 # Authentication tests
│   │   ├── login.spec.ts     # Login flow tests
│   │   └── logout.spec.ts    # Logout flow tests
│   ├── workflows/            # Complete user workflow tests
│   │   └── client-service-request.spec.ts
│   ├── crud/                 # Create, Read, Update, Delete tests
│   │   └── services.spec.ts
│   ├── navigation/           # Route and navigation tests
│   │   └── routes.spec.ts
│   ├── visual/               # Visual regression tests
│   │   └── dashboard.spec.ts
│   ├── mobile/               # Mobile responsive tests
│   │   └── responsive.spec.ts
│   └── accessibility/        # Accessibility compliance tests
│       └── wcag-compliance.spec.ts
├── fixtures/                 # Test fixtures and setup
│   ├── global-setup.ts       # Global test setup
│   ├── global-teardown.ts    # Global test cleanup
│   ├── base-fixtures.ts      # Custom test fixtures
│   └── auth-state.json       # Saved authentication state
├── utils/                    # Test utilities
│   ├── auth-helper.ts        # Authentication helper
│   ├── data-seeder.ts        # Database seeding
│   ├── seed-database.ts      # Initial test data
│   ├── screenshot-helper.ts  # Screenshot utilities
│   ├── accessibility-helper.ts # A11y testing utilities
│   └── mobile-viewports.ts   # Mobile viewport presets
├── snapshots/                # Visual regression baselines
└── README.md                 # This file
```

## Writing Tests

### Basic Test Example

```typescript
import { test, expect } from "../../fixtures/base-fixtures";

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });
});
```

### Using Custom Fixtures

#### Authenticated Page

```typescript
test("should access protected route", async ({ authenticatedPage }) => {
  const page = authenticatedPage;
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
});
```

#### Authentication Helper

```typescript
test("should login as admin", async ({ page, authHelper }) => {
  await authHelper.loginAsAdmin();
  await expect(page).toHaveURL(/\/dashboard/);
});
```

#### Data Seeder

```typescript
test("should create and view service", async ({ page, dataSeeder }) => {
  const tenant = await dataSeeder.createTenant();
  const service = await dataSeeder.createService(tenant.id);

  await page.goto(`/dashboard/services/${service.id}`);
  await expect(page.locator("h1")).toContainText(service.name);
});
```

#### Screenshot Helper

```typescript
test("should match baseline", async ({ page, screenshotHelper }) => {
  await page.goto("/dashboard");
  await screenshotHelper.compareFullPage("dashboard-home");
});
```

#### Accessibility Helper

```typescript
test("should meet WCAG AA standards", async ({ page, a11yHelper }) => {
  await page.goto("/dashboard");
  await a11yHelper.scanWCAG_AA();
});
```

### Mobile Testing

```typescript
test("should work on mobile", async ({ mobilePage }) => {
  await mobilePage.goto("/dashboard");
  await expect(mobilePage.locator("main")).toBeVisible();
});
```

## Test Data

### Seeded Test Users

The following test users are automatically seeded:

| Email | Password | Role |
|-------|----------|------|
| admin@test.gcmc.com | TestPassword123! | Admin |
| user@test.gcmc.com | TestPassword123! | User |
| client@test.gcmc.com | TestPassword123! | Client |

### Test Tenant

- **Name:** Test Tenant Organization
- **Slug:** test-tenant
- **Tier:** PROFESSIONAL

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: gcmc_kaj_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bunx playwright install --with-deps
      - run: bun run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

1. **Use Page Objects**: Create reusable page objects for complex pages
2. **Isolate Tests**: Each test should be independent and not rely on others
3. **Use Fixtures**: Leverage custom fixtures for common setup
4. **Wait Properly**: Use `waitForLoadState`, `waitForSelector`, etc.
5. **Clean Up**: Always clean up test data using the `dataSeeder` cleanup
6. **Accessibility**: Include a11y tests for all new features
7. **Mobile**: Test critical flows on mobile viewports
8. **Visual Regression**: Update baselines intentionally

## Troubleshooting

### Tests are flaky

- Increase timeouts in `playwright.config.ts`
- Use `waitForLoadState('networkidle')` before assertions
- Check for race conditions in the application

### Authentication fails

- Ensure test database is seeded
- Check `.env.test` configuration
- Verify web server is running on correct port

### Screenshots don't match

- Review diff images in `test-results/`
- Update baselines if changes are intentional:
  ```bash
  bun run test:e2e:visual --update-snapshots
  ```

### Database errors

- Ensure test database exists
- Run migrations: `bun run db:push`
- Check `DATABASE_URL` contains 'test'

### Playwright browsers not installed

```bash
bun run test:e2e:install
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use descriptive test names
3. Add accessibility tests for UI changes
4. Update this README if adding new test categories
5. Ensure tests pass locally before committing

## Support

For issues or questions:
- Check existing test examples in `tests/e2e/`
- Review Playwright documentation
- Contact the QA team
