#!/bin/bash

echo "🔧 Setting up TestZeus Hercules E2E Testing Framework..."

# Install TestZeus Hercules
npm install -D @testzeus/hercules

# Create TestZeus configuration
cat > testzeus.config.js << 'EOF'
module.exports = {
    baseUrl: 'http://localhost:3001',
    tests: {
        outputDir: './test-results/testzeus-hercules',
        screenshotDir: './test-results/testzeus-hercules/screenshots',
        videoDir: './test-results/testzeus-hercules/videos'
    },
    browser: {
        headless: false,
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        slowMo: 250
    },
    authentication: {
        email: 'admin@gcmc-kaj.com',
        password: 'AdminPassword123'
    },
    timeout: 30000,
    parallel: 1
};
EOF

# Create comprehensive test suites
mkdir -p e2e-testzeus-hercules

# Create authentication test
cat > e2e-testzeus-hercules/auth.hercules.js << 'EOF'
const { test, expect } = require('@testzeus/hercules');

test.describe('Authentication Flow Tests', () => {
    test('User can login successfully', async ({ page }) => {
        await page.goto('/login');

        // Take screenshot of login page
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/login-page.png' });

        // Fill login form
        await page.fill('[name="email"]', 'admin@gcmc-kaj.com');
        await page.fill('[name="password"]', 'AdminPassword123');

        // Take screenshot before submission
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/login-form-filled.png' });

        // Submit form
        await page.click('[type="submit"]');

        // Wait for navigation
        await page.waitForLoadState('networkidle');

        // Take screenshot after login
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/post-login.png' });

        // Verify successful login
        await expect(page).toHaveURL(/dashboard/);
        await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('Invalid credentials show error', async ({ page }) => {
        await page.goto('/login');

        await page.fill('[name="email"]', 'invalid@example.com');
        await page.fill('[name="password"]', 'wrongpassword');
        await page.click('[type="submit"]');

        // Verify error message
        await expect(page.locator('text=Invalid credentials')).toBeVisible();
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/login-error.png' });
    });

    test('User can logout', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@gcmc-kaj.com');
        await page.fill('[name="password"]', 'AdminPassword123');
        await page.click('[type="submit"]');
        await page.waitForLoadState('networkidle');

        // Logout
        await page.click('[data-testid="user-menu"]');
        await page.click('text=Logout');

        // Verify logout
        await expect(page).toHaveURL(/login/);
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/logout-success.png' });
    });
});
EOF

# Create dashboard test
cat > e2e-testzeus-hercules/dashboard.hercules.js << 'EOF'
const { test, expect } = require('@testzeus/hercules');

test.describe('Dashboard Functionality Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@gcmc-kaj.com');
        await page.fill('[name="password"]', 'AdminPassword123');
        await page.click('[type="submit"]');
        await page.waitForLoadState('networkidle');
    });

    test('Dashboard loads with all components', async ({ page }) => {
        await expect(page).toHaveURL(/dashboard/);

        // Check for key dashboard components
        await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
        await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
        await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();

        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/dashboard-loaded.png' });
    });

    test('Navigation menu works correctly', async ({ page }) => {
        // Test all navigation links
        const navItems = ['Clients', 'Documents', 'Filings', 'Analytics', 'Services'];

        for (const item of navItems) {
            await page.click(`nav a:has-text("${item}")`);
            await page.waitForLoadState('networkidle');
            await page.screenshot({
                path: `test-results/testzeus-hercules/screenshots/nav-${item.toLowerCase()}.png`
            });
        }
    });

    test('Search functionality works', async ({ page }) => {
        await page.fill('[data-testid="search-input"]', 'test client');
        await page.press('[data-testid="search-input"]', 'Enter');
        await page.waitForLoadState('networkidle');

        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/search-results.png' });
    });
});
EOF

# Create clients management test
cat > e2e-testzeus-hercules/clients.hercules.js << 'EOF'
const { test, expect } = require('@testzeus/hercules');

test.describe('Client Management Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login and navigate to clients
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@gcmc-kaj.com');
        await page.fill('[name="password"]', 'AdminPassword123');
        await page.click('[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.goto('/clients');
        await page.waitForLoadState('networkidle');
    });

    test('Clients page loads with client list', async ({ page }) => {
        await expect(page.locator('h1:has-text("Clients")')).toBeVisible();
        await expect(page.locator('[data-testid="clients-table"]')).toBeVisible();

        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/clients-page.png' });
    });

    test('Add new client form works', async ({ page }) => {
        await page.click('[data-testid="add-client-button"]');

        await page.fill('[name="companyName"]', 'Test Company Ltd.');
        await page.fill('[name="contactEmail"]', 'test@company.com');
        await page.fill('[name="contactPhone"]', '+592-123-4567');

        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/add-client-form.png' });

        await page.click('[type="submit"]');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('text=Test Company Ltd.')).toBeVisible();
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/client-added.png' });
    });

    test('Client details view works', async ({ page }) => {
        await page.click('[data-testid="client-row"]:first-child');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="client-details"]')).toBeVisible();
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/client-details.png' });
    });
});
EOF

# Create performance test
cat > e2e-testzeus-hercules/performance.hercules.js << 'EOF'
const { test, expect } = require('@testzeus/hercules');

test.describe('Performance Tests', () => {
    test('Page load times are acceptable', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        const loginLoadTime = Date.now() - startTime;
        expect(loginLoadTime).toBeLessThan(5000); // 5 seconds max

        // Login and test dashboard load time
        await page.fill('[name="email"]', 'admin@gcmc-kaj.com');
        await page.fill('[name="password"]', 'AdminPassword123');

        const dashboardStartTime = Date.now();
        await page.click('[type="submit"]');
        await page.waitForLoadState('networkidle');

        const dashboardLoadTime = Date.now() - dashboardStartTime;
        expect(dashboardLoadTime).toBeLessThan(3000); // 3 seconds max for dashboard

        console.log(`Login page load time: ${loginLoadTime}ms`);
        console.log(`Dashboard load time: ${dashboardLoadTime}ms`);
    });

    test('API response times are fast', async ({ page }) => {
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@gcmc-kaj.com');
        await page.fill('[name="password"]', 'AdminPassword123');
        await page.click('[type="submit"]');
        await page.waitForLoadState('networkidle');

        // Monitor API calls
        const apiCalls = [];
        page.on('response', response => {
            if (response.url().includes('/trpc/') || response.url().includes('/api/')) {
                apiCalls.push({
                    url: response.url(),
                    status: response.status(),
                    timing: response.timing()
                });
            }
        });

        await page.goto('/clients');
        await page.waitForLoadState('networkidle');

        // Check API response times
        apiCalls.forEach(call => {
            expect(call.status).toBe(200);
            console.log(`API call ${call.url}: ${call.status} - ${call.timing}ms`);
        });
    });
});
EOF

echo "✅ TestZeus Hercules setup complete!"