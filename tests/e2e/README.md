# GCMC-KAJ Comprehensive E2E Testing Framework

## 🎯 Overview

This is a production-grade, comprehensive end-to-end testing framework for the GCMC-KAJ Business Tax Services platform. It combines the best practices from multiple open-source frameworks and includes:

- **Page Object Model (POM)** for maintainable test code
- **Allure Reporting** with rich attachments and HTML output
- **Multi-browser testing** (Chromium, Firefox, WebKit)
- **Mobile and responsive testing**
- **API testing** integrated with UI tests
- **Accessibility testing** with WCAG compliance
- **Performance monitoring** and metrics collection
- **Custom TestHercules integration** for advanced test capabilities
- **CI/CD integration** with GitHub Actions

## 🏗️ Framework Architecture

```
tests/e2e/
├── api/                           # API testing helpers and specs
│   ├── api-helper.ts             # Comprehensive API testing utilities
│   └── api-endpoints.spec.ts     # API endpoint test specifications
├── auth/                         # Authentication test suites
│   ├── enhanced-login.spec.ts    # Comprehensive login testing
│   ├── login.spec.ts            # Original login tests
│   └── logout.spec.ts           # Logout flow tests
├── config/                       # Allure configuration
│   ├── allure-categories.json   # Error categorization
│   └── environment.properties   # Test environment info
├── crud/                         # CRUD operation tests
│   ├── clients-management.spec.ts # Complete client management testing
│   └── services.spec.ts         # Service management tests
├── dashboard/                    # Dashboard functionality tests
│   └── dashboard-functionality.spec.ts # Comprehensive dashboard testing
├── fixtures/                     # Test fixtures and setup
│   ├── enhanced-fixtures.ts     # Extended fixtures with all page objects
│   ├── base-fixtures.ts         # Original base fixtures
│   ├── global-setup.ts          # Global test setup
│   └── auth-state.json          # Saved authentication state
├── helpers/                      # Custom testing utilities
│   └── test-hercules.ts         # TestHercules integration
├── page-objects/                 # Page Object Model implementation
│   ├── common/
│   │   └── base-page.ts         # Base page object with common methods
│   ├── pages/
│   │   ├── login-page.ts        # Login page object
│   │   ├── dashboard-page.ts    # Dashboard page object
│   │   └── clients-page.ts      # Clients management page object
│   └── components/
│       └── navigation-component.ts # Reusable navigation component
├── utils/                        # Utility functions
│   ├── auth-helper.ts           # Authentication utilities
│   ├── data-seeder.ts           # Test data management
│   ├── screenshot-helper.ts     # Screenshot utilities
│   └── accessibility-helper.ts  # Accessibility testing utilities
├── workflows/                    # End-to-end workflow tests
│   └── complete-user-journey.spec.ts # Full application workflow testing
└── README.md                     # This documentation
```

## 🚀 Quick Start

### Prerequisites

- **Bun 1.2.18** or higher
- **Node.js 18** or higher
- **PostgreSQL** database
- **Redis** (for background jobs)

### Installation

1. **Install dependencies:**
```bash
bun install
```

2. **Install Playwright browsers:**
```bash
bun run test:e2e:install
```

3. **Setup test environment:**
```bash
cp .env.example .env.test
```

Edit `.env.test` with your test database credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gcmc_kaj_test"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
API_URL="http://localhost:3003"
```

4. **Setup test database:**
```bash
createdb gcmc_kaj_test
bun run db:push
```

5. **Start the application:**
```bash
# Terminal 1: Start web app
bun run dev:web

# Terminal 2: Start API server
bun run dev:server
```

## 🧪 Running Tests

### Basic Test Execution

```bash
# Run all E2E tests
bun run test:e2e

# Run with UI mode (recommended for development)
bun run test:e2e:ui

# Run in headed mode (see browser)
bun run test:e2e:headed
```

### Browser-Specific Testing

```bash
# Single browser
bun run test:e2e:chromium
bun run test:e2e:firefox
bun run test:e2e:webkit

# All desktop browsers
bun run test:e2e:all-browsers

# Mobile testing
bun run test:e2e:mobile

# Tablet testing
bun run test:e2e:tablet
```

### Test Categories

```bash
# Smoke tests (quick critical path)
bun run test:e2e:smoke

# Critical functionality
bun run test:e2e:critical

# Full regression suite
bun run test:e2e:regression

# Performance tests
bun run test:e2e:performance

# Accessibility tests
bun run test:e2e:a11y

# Negative/error handling tests
bun run test:e2e:negative
```

### Feature-Specific Testing

```bash
# Authentication flows
bun run test:e2e:enhanced-auth

# Dashboard functionality
bun run test:e2e:dashboard

# Client management (CRUD)
bun run test:e2e:clients

# API endpoints
bun run test:e2e:api

# Complete user journeys
npm test -- tests/e2e/workflows/
```

### Parallel vs Sequential Execution

```bash
# Parallel execution (faster)
bun run test:e2e:parallel

# Sequential execution (more stable)
bun run test:e2e:sequential
```

## 📊 Allure Reporting

### Generate and View Reports

```bash
# Run tests and generate Allure report
bun run test:e2e:allure

# Generate report from existing results
bun run allure:generate

# Open static report
bun run allure:open

# Serve live report
bun run allure:serve

# Clean up reports
bun run allure:clean
```

### Report Features

- **Test execution timeline** with step-by-step breakdown
- **Screenshots** on failure and key steps
- **Performance metrics** and load time analysis
- **Accessibility scan results** with WCAG compliance
- **API response data** with request/response details
- **Error categorization** with automatic classification
- **Cross-browser comparison** results
- **Historical trend analysis**

## 🔧 Framework Features

### Page Object Model (POM)

All pages inherit from `BasePage` providing common functionality:

```typescript
// Example usage
const loginPage = new LoginPage(page);
await loginPage.navigateToLogin();
await loginPage.loginAsAdmin();
await loginPage.verifySuccessfulLogin();
```

### Enhanced Fixtures

The framework provides multiple specialized fixtures:

```typescript
// Available fixtures in tests
test("example", async ({
  loginPage,           // Login page object
  dashboardPage,       // Dashboard page object
  clientsPage,         // Clients page object
  navigation,          // Navigation component
  apiHelper,           // API testing helper
  authenticatedPage,   // Pre-authenticated page
  mobilePage,          // Mobile viewport page
  a11yHelper,         // Accessibility testing
  screenshotHelper,   // Screenshot utilities
  performanceMetrics  // Performance tracking
}) => {
  // Test implementation
});
```

### TestHercules Integration

Advanced testing capabilities with smart interactions:

```typescript
const testExecutor = new TestExecutor(page);
const hercules = testExecutor.getHercules();

// Smart click with retry and validation
await hercules.smartClick('button[type="submit"]', {
  timeout: 10000,
  retries: 3,
  waitForNavigation: true,
  screenshot: true
});

// Smart form filling with validation
await hercules.smartFillForm({
  email: "user@example.com",
  password: "password123"
}, {
  validate: true,
  submitAfter: true
});

// Smart waiting with multiple conditions
await hercules.smartWait({
  selector: '.success-message',
  url: /dashboard/,
  networkIdle: true,
  timeout: 15000
});

// Enhanced screenshots with highlights
await hercules.captureScreenshot('test-step', {
  fullPage: true,
  highlight: ['.important-element', '#submit-button'],
  annotations: [{ x: 100, y: 200, text: 'Critical area' }]
});

// Accessibility validation
await hercules.validateAccessibility(['color-contrast', 'keyboard-navigation']);

// Performance metrics collection
await hercules.collectPerformanceMetrics();
```

### API Testing Integration

Comprehensive API testing alongside UI tests:

```typescript
test("hybrid test", async ({ apiHelper, clientsPage }) => {
  // Create data via API
  await apiHelper.authenticateAsTestUser();
  const client = await apiHelper.createTestClient();

  // Verify in UI
  await clientsPage.navigateToClients();
  await clientsPage.verifyClientExists(client.name);

  // Update via UI
  await clientsPage.editClient(0, { phone: "+1-555-9999" });

  // Verify via API
  const updatedClient = await apiHelper.getClient(client.id);
  expect(updatedClient.phone).toBe("+1-555-9999");
});
```

### Test Categories and Tags

Use tags to organize and filter tests:

- `@smoke` - Critical path tests
- `@critical` - Core functionality
- `@regression` - Full feature coverage
- `@performance` - Performance benchmarks
- `@accessibility` - WCAG compliance tests
- `@api` - API endpoint testing
- `@mobile` - Mobile device testing
- `@negative` - Error handling scenarios
- `@integration` - Cross-system integration

## 📱 Responsive Testing

The framework automatically tests across multiple viewports:

- **Desktop Large**: 1920x1080
- **Desktop Standard**: 1366x768
- **Tablet Landscape**: 1024x768
- **Tablet Portrait**: 768x1024
- **Mobile**: 375x667

## ♿ Accessibility Testing

Automated WCAG 2.1 AA compliance testing:

```typescript
test("accessibility", async ({ page, a11yHelper }) => {
  await page.goto('/dashboard');

  // Run full accessibility scan
  await a11yHelper.scanWCAG_AA();

  // Test specific rules
  await a11yHelper.scanWithRules(['color-contrast', 'keyboard']);
});
```

## ⚡ Performance Testing

Automatic performance monitoring:

```typescript
test("performance", async ({ page, performanceMetrics }) => {
  await page.goto('/dashboard');

  // Automatic tracking
  expect(performanceMetrics.loadTime).toBeLessThan(3000);
  expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000);

  // Custom metrics collection
  const metrics = await page.evaluate(() => ({
    domNodes: document.querySelectorAll('*').length,
    scriptCount: document.scripts.length,
    styleSheetCount: document.styleSheets.length
  }));

  expect(metrics.domNodes).toBeLessThan(1000);
});
```

## 🔄 CI/CD Integration

### GitHub Actions

The framework includes a comprehensive GitHub Actions workflow:

```bash
# Trigger specific test suites
gh workflow run e2e-tests.yml -f test_suite=smoke
gh workflow run e2e-tests.yml -f test_suite=critical
gh workflow run e2e-tests.yml -f test_suite=regression
gh workflow run e2e-tests.yml -f test_suite=full
```

### Features:
- **Multi-browser matrix** testing
- **Parallel execution** across browsers
- **Automatic artifact upload** (reports, screenshots, videos)
- **Allure report deployment** to GitHub Pages
- **PR comments** with test results
- **Failure screenshots** and videos
- **Performance regression** detection

## 🧹 Maintenance

### Cleaning Up

```bash
# Clean all test artifacts
bun run test:e2e:clean

# Clean only Allure reports
bun run allure:clean

# Clean and run full suite
bun run test:e2e:full-suite
```

### Updating Baselines

```bash
# Update visual regression baselines
bun run test:e2e:visual --update-snapshots

# Update accessibility baselines
bun run test:e2e:a11y --update-baselines
```

## 🐛 Debugging

### Debug Mode

```bash
# Debug specific test
bun run test:e2e:debug -- --grep "login flow"

# Debug with browser DevTools
bun run test:e2e:headed -- --debug

# Pause on failure
bun run test:e2e -- --pause-on-failure
```

### Screenshots and Videos

All test failures automatically capture:
- **Screenshots** at failure point
- **Full page screenshots** of error states
- **Videos** of complete test execution
- **Browser traces** for detailed debugging

### Console Output

The framework captures and categorizes:
- **Browser console errors**
- **Network request failures**
- **JavaScript exceptions**
- **Performance warnings**

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Frontend URL | `http://localhost:3001` |
| `API_URL` | Backend API URL | `http://localhost:3003` |
| `DATABASE_URL` | Test database URL | Required |
| `REDIS_URL` | Redis URL | `redis://localhost:6379` |
| `CI` | CI environment flag | `false` |

### Playwright Configuration

Key settings in `playwright.config.ts`:
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Workers**: Parallel execution optimized per environment
- **Browsers**: Chromium, Firefox, WebKit + Mobile variants
- **Screenshots**: On failure + retain on failure
- **Videos**: Retain on failure
- **Traces**: Comprehensive debugging traces

### Allure Configuration

Settings in `allure.properties` and test configuration:
- **Results directory**: `allure-results/`
- **Categories**: Automatic error classification
- **Environment info**: Dynamic environment detection
- **Attachments**: Screenshots, videos, API responses, performance metrics

## 📚 Best Practices

### Writing Tests

1. **Use Page Objects** - Always interact through page objects, never direct selectors
2. **Test Independence** - Each test should be completely independent
3. **Descriptive Names** - Use clear, descriptive test names
4. **Appropriate Tags** - Tag tests for proper categorization
5. **Data Cleanup** - Always clean up test data in teardown
6. **Error Handling** - Test both success and failure scenarios
7. **Accessibility** - Include a11y tests for all UI features
8. **Performance** - Monitor performance for critical paths

### Page Objects

1. **Single Responsibility** - Each page object handles one page/component
2. **Wait Strategies** - Use appropriate waits for dynamic content
3. **Verification Methods** - Include verification methods for all interactions
4. **Reusable Components** - Extract common components (navigation, modals)
5. **Error Recovery** - Handle temporary failures gracefully

### Test Data

1. **Dynamic Generation** - Use `TestDataGenerator` for unique test data
2. **API Setup** - Use API for efficient test data creation
3. **Isolation** - Ensure tests don't interfere with each other
4. **Cleanup** - Always clean up created test data
5. **Realistic Data** - Use realistic data that matches production scenarios

## 🆘 Troubleshooting

### Common Issues

#### Tests are Flaky
- Increase timeout values in configuration
- Add proper wait strategies before assertions
- Use `waitForLoadState('networkidle')` for dynamic content
- Check for race conditions in the application

#### Authentication Failures
- Verify test database is properly seeded
- Check `.env.test` configuration
- Ensure web server is running on correct port
- Verify authentication credentials are correct

#### Screenshots Don't Match
- Review diff images in `test-results/`
- Update baselines if changes are intentional
- Check for dynamic content affecting screenshots
- Ensure consistent viewport sizes

#### Performance Issues
- Monitor resource usage during tests
- Check for memory leaks in long-running tests
- Optimize database queries for test data
- Consider reducing parallel workers

#### API Errors
- Verify backend server is running
- Check API endpoint URLs and methods
- Validate request/response formats
- Monitor network timeouts

### Getting Help

1. **Check test output** for detailed error messages
2. **Review screenshots** and videos for visual debugging
3. **Examine Allure reports** for comprehensive analysis
4. **Check browser console** for JavaScript errors
5. **Verify environment setup** and dependencies
6. **Review network requests** in browser DevTools

## 🎓 Training Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Patterns](https://playwright.dev/docs/pom)
- [Allure Framework Guide](https://docs.qameta.io/allure/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Performance Testing Best Practices](https://web.dev/performance/)

## 🤝 Contributing

When adding new tests:

1. Follow the existing Page Object Model structure
2. Use descriptive test names and appropriate tags
3. Include accessibility tests for UI changes
4. Add API tests for backend functionality
5. Update documentation for new features
6. Ensure tests pass locally before committing
7. Add performance tests for critical user flows

## 📄 License

This testing framework is part of the GCMC-KAJ Business Tax Services platform.

---

**Happy Testing! 🎉**

For questions or support, please refer to the project documentation or contact the QA team.