# E2E Testing Execution Guide

**Last Updated:** 2025-11-16
**Status:** Ready for Execution
**Test Suite Version:** 1.0.0

---

## Table of Contents

- [Overview](#overview)
- [Test Suite Structure](#test-suite-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Test Execution](#test-execution)
- [Report Generation](#report-generation)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

The GCMC Platform E2E test suite provides comprehensive end-to-end testing coverage across 8 critical areas using Playwright. The suite is designed to run against a fully operational development or staging environment.

### Test Suite Metrics

| Metric | Value |
|--------|-------|
| **Total Test Files** | 8 |
| **Test Categories** | 7 |
| **Browser Coverage** | 6 (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari, iPad) |
| **Accessibility Tests** | WCAG 2.1 Level AA |
| **Estimated Runtime** | 15-25 minutes (all browsers) |
| **Estimated Runtime** | 5-8 minutes (Chromium only) |

---

## Test Suite Structure

```
tests/
├── e2e/                           # End-to-end tests
│   ├── auth/                      # Authentication tests
│   │   ├── login.spec.ts         # Login flows, validation, security
│   │   └── logout.spec.ts        # Logout, session cleanup
│   ├── navigation/               # Navigation tests
│   │   └── routes.spec.ts        # Route discovery, performance
│   ├── crud/                     # CRUD operation tests
│   │   └── services.spec.ts      # Full CRUD operations
│   ├── workflows/                # End-to-end workflow tests
│   │   └── client-service-request.spec.ts
│   ├── visual/                   # Visual regression tests
│   │   └── dashboard.spec.ts     # Screenshot comparison
│   ├── mobile/                   # Mobile responsiveness
│   │   └── responsive.spec.ts    # 9 device presets
│   └── accessibility/            # WCAG compliance
│       └── wcag-compliance.spec.ts
├── utils/                        # Test utilities
│   ├── auth-helper.ts           # Login/logout helpers
│   ├── data-seeder.ts           # Dynamic test data
│   ├── seed-database.ts         # Initial test users
│   ├── screenshot-helper.ts     # Visual regression
│   ├── accessibility-helper.ts  # WCAG scanning
│   └── mobile-viewports.ts      # Device configurations
└── fixtures/                     # Playwright fixtures
    ├── base-fixtures.ts         # Custom fixtures
    ├── global-setup.ts          # Pre-test setup
    └── global-teardown.ts       # Post-test cleanup
```

### Test Categories

1. **Authentication (2 specs)**
   - Login flows with validation
   - Logout and session cleanup
   - Security checks (CSRF, rate limiting)

2. **Navigation (1 spec)**
   - Route discovery and accessibility
   - Performance timing
   - Protected route authorization

3. **CRUD Operations (1 spec)**
   - Create, Read, Update, Delete for Services
   - Form validation
   - Data persistence verification

4. **Workflows (1 spec)**
   - End-to-end business processes
   - Client + Service Request creation
   - Multi-step form flows

5. **Visual Regression (1 spec)**
   - Screenshot comparison
   - UI consistency across browsers
   - Dark mode verification

6. **Mobile Responsiveness (1 spec)**
   - 9 device presets (iPhone, Pixel, iPad)
   - Touch interactions
   - Responsive layout verification

7. **Accessibility (1 spec)**
   - WCAG 2.1 Level AA compliance
   - Automated axe-core scanning
   - 11 pages tested
   - Detailed violation reports

---

## Prerequisites

### Required Services

All services must be running before executing tests:

| Service | Port | Command | Health Check |
|---------|------|---------|--------------|
| **PostgreSQL** | 5432 | `docker compose up postgres -d` | `pg_isready -h localhost -p 5432` |
| **Redis** | 6379 | `docker compose up redis -d` | `redis-cli ping` |
| **MinIO** | 9000 | `docker compose up minio -d` | `curl http://localhost:9000/minio/health/live` |
| **API Server** | 3000 | `bun run dev:server` | `curl http://localhost:3000/health` |
| **Web App** | 3001 | `bun run dev:web` | `curl http://localhost:3001` |

### Required Environment Variables

Create `.env.test` file (already exists):

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gcmc_kaj_test"

# App URLs
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Test User Credentials
TEST_USER_EMAIL="admin@test.com"
TEST_USER_PASSWORD="TestPassword123!"
```

### Dependencies

Ensure Playwright browsers are installed:

```bash
bun run test:e2e:install
# Or manually:
bunx playwright install --with-deps
```

---

## Environment Setup

### Step 1: Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, MinIO
docker compose up -d postgres redis minio

# Verify services are healthy
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Step 2: Initialize Test Database

```bash
# Create test database (if not exists)
createdb gcmc_kaj_test

# Run migrations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gcmc_kaj_test" \
  bun run db:push

# Seed test data (automatic via global-setup.ts)
```

### Step 3: Start Application Services

```bash
# Terminal 1: Start API Server
bun run dev:server

# Terminal 2: Start Web App
bun run dev:web

# Wait for both to be ready (~10-15 seconds)
```

### Step 4: Verify All Services

```bash
# Check all services are responding
curl http://localhost:3000/health  # API Server: {"status":"ok"}
curl http://localhost:3001         # Web App: HTML response
redis-cli ping                      # Redis: PONG
pg_isready -h localhost -p 5432    # PostgreSQL: accepting connections
```

---

## Test Execution

### Quick Start (All Tests)

```bash
# Run all tests in all browsers (headless)
bun run test:e2e

# Estimated time: 15-25 minutes
# Generates: playwright-report/ directory
```

### Interactive UI Mode (Recommended for Development)

```bash
# Launch Playwright UI for interactive testing
bun run test:e2e:ui

# Benefits:
# - Visual test execution
# - Step-by-step debugging
# - Screenshot comparison
# - Test isolation
# - Re-run failed tests
```

### Headed Mode (See Browser)

```bash
# Run tests with visible browser
bun run test:e2e:headed

# Useful for:
# - Debugging test failures
# - Verifying UI interactions
# - Screenshot verification
```

### Debug Mode

```bash
# Run tests with Playwright Inspector
bun run test:e2e:debug

# Features:
# - Pause execution at breakpoints
# - Step through test code
# - Inspect element locators
# - View console logs
```

### Browser-Specific Tests

```bash
# Chromium only (fastest)
bun run test:e2e:chromium

# Firefox only
bun run test:e2e:firefox

# WebKit only (Safari engine)
bun run test:e2e:webkit

# Mobile browsers only
bun run test:e2e:mobile
```

### Category-Specific Tests

```bash
# Authentication tests only
bun run test:e2e:auth

# CRUD operation tests
bun run test:e2e:crud

# Workflow tests
bun run test:e2e:workflows

# Navigation tests
bun run test:e2e:navigation

# Visual regression tests
bun run test:e2e:visual

# Accessibility tests
bun run test:e2e:a11y
```

### Single Test File

```bash
# Run a specific test file
bunx playwright test tests/e2e/auth/login.spec.ts

# Run with specific browser
bunx playwright test tests/e2e/auth/login.spec.ts --project=chromium

# Run specific test case
bunx playwright test tests/e2e/auth/login.spec.ts -g "should login successfully"
```

---

## Report Generation

### HTML Report (Default)

```bash
# Generate and open HTML report
bun run test:e2e:report

# Report location: playwright-report/index.html
# Includes:
# - Test results with pass/fail status
# - Screenshots of failures
# - Video recordings (if enabled)
# - Trace files for debugging
# - Performance metrics
```

### JSON Report

```bash
# Generate JSON report for CI/CD
bunx playwright test --reporter=json > test-results.json
```

### JUnit Report (CI/CD Compatible)

```bash
# Generate JUnit XML report
bunx playwright test --reporter=junit > junit-results.xml
```

### Multiple Reporters

```bash
# Generate HTML + JSON + JUnit
bunx playwright test --reporter=html,json,junit
```

### Custom Report Analysis

After running tests, analyze results:

```bash
# View test summary
cat playwright-report/test-summary.txt

# Count failures
grep -c "FAILED" test-results.json

# Extract failed test names
jq '.suites[].specs[] | select(.ok == false) | .title' test-results.json
```

---

## Expected Test Coverage

### Pages Tested (11 Total)

1. `/login` - Login page
2. `/dashboard` - Main dashboard
3. `/clients` - Client management
4. `/clients/new` - New client form
5. `/services` - Service management
6. `/services/new` - New service form
7. `/documents` - Document management
8. `/filings` - Filing management
9. `/analytics` - Analytics dashboard
10. `/settings` - Settings page
11. `/profile` - User profile

### User Flows Tested

- ✅ User registration and login
- ✅ Client creation and management
- ✅ Service request submission
- ✅ Document upload and viewing
- ✅ Filing creation and tracking
- ✅ Task assignment and completion
- ✅ Dashboard data visualization
- ✅ Navigation and routing
- ✅ Form validation
- ✅ Error handling
- ✅ Responsive design (9 devices)
- ✅ Accessibility (WCAG 2.1 AA)

### Accessibility Checks

All pages are tested for:

- **WCAG 2.1 Level A** (25 rules)
- **WCAG 2.1 Level AA** (13 rules)
- **Best Practices** (90+ rules)

Specific checks:
- Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader compatibility (ARIA labels, roles, landmarks)
- Form labels and error messages
- Focus indicators
- Heading hierarchy
- Alt text for images
- Semantic HTML

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: gcmc_kaj_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.2.18

      - name: Install dependencies
        run: bun install

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps

      - name: Run database migrations
        run: bun run db:push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/gcmc_kaj_test

      - name: Start API Server
        run: bun run dev:server &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/gcmc_kaj_test
          REDIS_URL: redis://localhost:6379

      - name: Start Web App
        run: bun run dev:web &

      - name: Wait for services
        run: |
          npx wait-on http://localhost:3000/health
          npx wait-on http://localhost:3001

      - name: Run E2E tests
        run: bun run test:e2e

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results/
          retention-days: 30
```

### Pre-Commit Hook

Add to `.husky/pre-push`:

```bash
#!/bin/sh
# Run E2E tests before pushing to main/develop

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "develop" ]; then
  echo "Running E2E tests before push to $BRANCH..."
  bun run test:e2e:chromium || exit 1
fi
```

---

## Troubleshooting

### Common Issues

#### 1. Test Timeout Errors

**Symptom:**
```
Error: Test timeout of 30000ms exceeded
```

**Solutions:**
- Increase timeout in `playwright.config.ts`: `timeout: 60000`
- Check if services are running: `docker ps`
- Verify API server health: `curl http://localhost:3000/health`
- Increase global setup timeout in `playwright.config.ts`

#### 2. Database Connection Errors

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check DATABASE_URL in .env.test
cat .env.test | grep DATABASE_URL

# Manually connect to verify
psql postgresql://postgres:postgres@localhost:5432/gcmc_kaj_test
```

#### 3. Authentication Failures

**Symptom:**
```
Error: Login failed - invalid credentials
```

**Solutions:**
```bash
# Verify test user exists
psql -d gcmc_kaj_test -c "SELECT email FROM \"User\" WHERE email='admin@test.com';"

# Re-seed database
bun run db:push
# Global setup will recreate test user
```

#### 4. Port Conflicts

**Symptom:**
```
Error: Port 3001 is already in use
```

**Solutions:**
```bash
# Find process using port
lsof -ti:3001

# Kill process
kill -9 $(lsof -ti:3001)

# Or use different port in .env.test
```

#### 5. Visual Regression Failures

**Symptom:**
```
Error: Screenshot comparison failed - 5% difference
```

**Solutions:**
- Update baseline screenshots: `bunx playwright test --update-snapshots`
- Check screen resolution matches CI: `xdpyinfo | grep dimensions`
- Disable animations in test: `page.emulateMedia({ reducedMotion: 'reduce' })`

#### 6. Accessibility Test Failures

**Symptom:**
```
Expected 0 accessibility violations, but found 3
```

**Solutions:**
- Review detailed report: `cat playwright-report/accessibility-violations.txt`
- Fix violations in source code
- Update test to exclude known false positives (carefully documented)

### Debug Commands

```bash
# View Playwright trace
bunx playwright show-trace trace.zip

# Run tests with verbose logging
DEBUG=pw:api bunx playwright test

# Run tests with browser console logs
bunx playwright test --headed --debug

# Generate detailed trace
bunx playwright test --trace on

# Take manual screenshot
bunx playwright codegen http://localhost:3001
```

### Performance Optimization

If tests are running slow:

1. **Run in parallel** (default: workers = CPU cores / 2)
   ```bash
   bunx playwright test --workers=4
   ```

2. **Use Chromium only for development**
   ```bash
   bun run test:e2e:chromium
   ```

3. **Disable video recording**
   ```typescript
   // playwright.config.ts
   use: {
     video: 'off', // or 'retain-on-failure'
   }
   ```

4. **Disable tracing**
   ```typescript
   // playwright.config.ts
   use: {
     trace: 'off', // or 'retain-on-failure'
   }
   ```

5. **Reduce retries**
   ```typescript
   // playwright.config.ts
   retries: 0, // for development
   ```

---

## Test Execution Checklist

Before running E2E tests, verify:

- [ ] PostgreSQL is running on port 5432
- [ ] Redis is running on port 6379
- [ ] MinIO is running on port 9000
- [ ] API server is healthy at `http://localhost:3000/health`
- [ ] Web app is accessible at `http://localhost:3001`
- [ ] `.env.test` file exists with correct values
- [ ] Test database exists: `gcmc_kaj_test`
- [ ] Database migrations have run: `bun run db:push`
- [ ] Playwright browsers are installed: `bunx playwright install --with-deps`
- [ ] All dependencies are installed: `bun install`

---

## Expected Results

### Full Test Suite Pass Criteria

✅ **All 8 test files pass**
✅ **Zero accessibility violations** (WCAG 2.1 AA)
✅ **All browsers pass** (Chromium, Firefox, WebKit, Mobile)
✅ **Visual regressions < 1% difference**
✅ **Performance metrics within budget** (LCP < 2.5s, FCP < 1.8s)
✅ **Zero console errors**
✅ **Zero network errors**

### Acceptable Test Metrics

| Metric | Target | Acceptable |
|--------|--------|------------|
| **Pass Rate** | 100% | ≥ 98% |
| **Accessibility Score** | 100 | ≥ 95 |
| **Visual Regression** | 0% | < 1% |
| **LCP** | < 2.5s | < 3.5s |
| **FCP** | < 1.8s | < 2.5s |
| **Total Runtime** | < 20 min | < 30 min |

---

## Next Steps After Test Execution

1. **Review HTML Report**
   ```bash
   bun run test:e2e:report
   ```

2. **Fix Any Failures**
   - Check screenshots in `test-results/`
   - Review error messages
   - Debug with `--headed` or `--debug`

3. **Update Documentation**
   - Document any new test cases
   - Update expected behavior
   - Add troubleshooting tips

4. **Generate Final Report**
   - Create `E2E_TEST_RESULTS.md` with findings
   - Include screenshots of key flows
   - Document any blockers or issues

5. **Commit Test Results**
   ```bash
   git add test-results/ playwright-report/
   git commit -m "test: E2E test execution results"
   ```

---

## Cross-References

- **Test Infrastructure Setup:** See `E2E_TESTING_SETUP_SUMMARY.md`
- **Accessibility Guidelines:** See `docs/ACCESSIBILITY_TESTING_GUIDE.md`
- **Project Structure:** See `docs/PROJECT_STRUCTURE.md`
- **Deployment Guide:** See `docs/DEPLOYMENT.md`

---

**Document Status:** ✅ Complete
**Last Reviewed:** 2025-11-16
**Next Review:** After first full test execution
