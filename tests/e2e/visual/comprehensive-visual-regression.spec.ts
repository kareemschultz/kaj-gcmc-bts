import { test, expect, Page } from '@playwright/test';
import { devices } from '@playwright/test';

/**
 * Comprehensive Visual Regression Testing for GCMC-KAJ Platform
 *
 * Tests cover:
 * - Screenshot comparisons for all major pages
 * - Mobile responsiveness testing
 * - Dark/light theme consistency
 * - Form rendering and validation states
 * - Component visual integrity
 * - Cross-browser visual consistency
 */

test.describe('Visual Regression Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Login as admin user for consistent state
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
    await page.fill('[data-testid="password"]', 'SecureAdmin123!');
    await page.click('[data-testid="loginButton"]');
    await page.waitForURL('**/dashboard');
  });

  test.describe('Desktop Screenshots - Major Pages', () => {
    test('@smoke @visual should capture dashboard page screenshot', async () => {
      await page.goto('/dashboard');

      // Wait for all dashboard components to load
      await page.waitForSelector('[data-testid="dashboard-widgets"]');
      await page.waitForTimeout(2000); // Allow charts and animations to complete

      // Take full page screenshot
      await expect(page).toHaveScreenshot('dashboard-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Take individual widget screenshots
      await expect(page.locator('[data-testid="compliance-overview-widget"]')).toHaveScreenshot('dashboard-compliance-widget.png');
      await expect(page.locator('[data-testid="recent-activity-widget"]')).toHaveScreenshot('dashboard-activity-widget.png');
      await expect(page.locator('[data-testid="upcoming-deadlines-widget"]')).toHaveScreenshot('dashboard-deadlines-widget.png');
    });

    test('@visual should capture clients page with data', async () => {
      await page.goto('/clients');

      // Wait for client list to load
      await page.waitForSelector('[data-testid="clients-table"]');
      await page.waitForTimeout(1000);

      // Take full page screenshot
      await expect(page).toHaveScreenshot('clients-page-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Test with filters applied
      await page.selectOption('[data-testid="business-type-filter"]', 'Small Business');
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="clients-table"]')).toHaveScreenshot('clients-table-filtered.png');

      // Test search results
      await page.fill('[data-testid="client-search"]', 'test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="search-results"]')).toHaveScreenshot('clients-search-results.png');
    });

    test('@visual should capture services configuration page', async () => {
      await page.goto('/services/packages');

      // Wait for service packages to load
      await page.waitForSelector('[data-testid="service-packages-grid"]');

      await expect(page).toHaveScreenshot('services-packages-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Test individual package cards
      await expect(page.locator('[data-testid="individual-tax-only-package"]')).toHaveScreenshot('individual-tax-package-card.png');
      await expect(page.locator('[data-testid="small-business-starter-package"]')).toHaveScreenshot('small-business-package-card.png');
      await expect(page.locator('[data-testid="full-business-compliance-package"]')).toHaveScreenshot('full-compliance-package-card.png');
    });

    test('@visual should capture GRA integration pages', async () => {
      // VAT page
      await page.goto('/gra/vat');
      await page.waitForSelector('[data-testid="vat-dashboard"]');
      await expect(page).toHaveScreenshot('gra-vat-page-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // PAYE page
      await page.goto('/gra/paye');
      await page.waitForSelector('[data-testid="paye-dashboard"]');
      await expect(page).toHaveScreenshot('gra-paye-page-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // NIS page
      await page.goto('/nis/monthly-returns');
      await page.waitForSelector('[data-testid="nis-dashboard"]');
      await expect(page).toHaveScreenshot('nis-monthly-returns-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });
    });

    test('@visual should capture document management interface', async () => {
      await page.goto('/documents');

      // Wait for document grid to load
      await page.waitForSelector('[data-testid="documents-grid"]');

      await expect(page).toHaveScreenshot('documents-page-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Test document upload modal
      await page.click('[data-testid="upload-document-button"]');
      await page.waitForSelector('[data-testid="upload-modal"]');
      await expect(page.locator('[data-testid="upload-modal"]')).toHaveScreenshot('document-upload-modal.png');
    });

    test('@visual should capture compliance and analytics pages', async () => {
      // Compliance overview
      await page.goto('/compliance');
      await page.waitForSelector('[data-testid="compliance-dashboard"]');
      await expect(page).toHaveScreenshot('compliance-overview-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Analytics dashboard
      await page.goto('/analytics');
      await page.waitForSelector('[data-testid="analytics-charts"]');
      await page.waitForTimeout(3000); // Allow charts to render
      await expect(page).toHaveScreenshot('analytics-dashboard-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });
    });
  });

  test.describe('Mobile Responsiveness Visual Tests', () => {
    test('@visual @mobile should capture mobile dashboard layout', async () => {
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size

      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="mobile-dashboard"]');

      await expect(page).toHaveScreenshot('dashboard-mobile-375w.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Test mobile navigation menu
      await page.click('[data-testid="mobile-menu-trigger"]');
      await page.waitForSelector('[data-testid="mobile-navigation"]');
      await expect(page.locator('[data-testid="mobile-navigation"]')).toHaveScreenshot('mobile-navigation-menu.png');
    });

    test('@visual @mobile should capture mobile clients page', async () => {
      await page.setViewportSize({ width: 375, height: 812 });

      await page.goto('/clients');
      await page.waitForSelector('[data-testid="mobile-clients-view"]');

      await expect(page).toHaveScreenshot('clients-mobile-375w.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Test mobile client card layout
      await expect(page.locator('[data-testid="client-card"]').first()).toHaveScreenshot('mobile-client-card.png');
    });

    test('@visual @mobile should capture mobile forms', async () => {
      await page.setViewportSize({ width: 375, height: 812 });

      // Test VAT return form on mobile
      await page.goto('/gra/vat/create');
      await page.waitForSelector('[data-testid="mobile-vat-form"]');

      await expect(page).toHaveScreenshot('vat-form-mobile-375w.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Test form field interactions
      await page.fill('[data-testid="standard-rated-supplies"]', '100000.00');
      await expect(page.locator('[data-testid="vat-form-section"]')).toHaveScreenshot('mobile-vat-form-filled.png');
    });

    test('@visual @tablet should capture tablet layouts', async () => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size

      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="tablet-dashboard"]');

      await expect(page).toHaveScreenshot('dashboard-tablet-768w.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Test tablet navigation
      await expect(page.locator('[data-testid="tablet-navigation"]')).toHaveScreenshot('tablet-navigation-bar.png');
    });
  });

  test.describe('Theme Consistency Tests', () => {
    test('@visual @theme should capture light theme pages', async () => {
      // Ensure light theme is active
      await page.goto('/settings/appearance');
      await page.click('[data-testid="light-theme-toggle"]');
      await page.waitForTimeout(1000);

      // Dashboard in light theme
      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="dashboard-widgets"]');
      await expect(page).toHaveScreenshot('dashboard-light-theme.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Clients page in light theme
      await page.goto('/clients');
      await page.waitForSelector('[data-testid="clients-table"]');
      await expect(page).toHaveScreenshot('clients-light-theme.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });
    });

    test('@visual @theme should capture dark theme pages', async () => {
      // Enable dark theme
      await page.goto('/settings/appearance');
      await page.click('[data-testid="dark-theme-toggle"]');
      await page.waitForTimeout(1000);

      // Dashboard in dark theme
      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="dashboard-widgets"]');
      await expect(page).toHaveScreenshot('dashboard-dark-theme.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Clients page in dark theme
      await page.goto('/clients');
      await page.waitForSelector('[data-testid="clients-table"]');
      await expect(page).toHaveScreenshot('clients-dark-theme.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Forms in dark theme
      await page.goto('/gra/vat/create');
      await page.waitForSelector('[data-testid="vat-form"]');
      await expect(page).toHaveScreenshot('vat-form-dark-theme.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });
    });

    test('@visual @theme should ensure theme consistency across components', async () => {
      // Test light theme components
      await page.goto('/settings/appearance');
      await page.click('[data-testid="light-theme-toggle"]');
      await page.waitForTimeout(1000);

      await page.goto('/dashboard');

      // Capture individual components in light theme
      await expect(page.locator('[data-testid="navigation-header"]')).toHaveScreenshot('header-light-theme.png');
      await expect(page.locator('[data-testid="sidebar-navigation"]')).toHaveScreenshot('sidebar-light-theme.png');
      await expect(page.locator('[data-testid="main-content-area"]')).toHaveScreenshot('content-area-light-theme.png');

      // Switch to dark theme
      await page.goto('/settings/appearance');
      await page.click('[data-testid="dark-theme-toggle"]');
      await page.waitForTimeout(1000);

      await page.goto('/dashboard');

      // Capture same components in dark theme
      await expect(page.locator('[data-testid="navigation-header"]')).toHaveScreenshot('header-dark-theme.png');
      await expect(page.locator('[data-testid="sidebar-navigation"]')).toHaveScreenshot('sidebar-dark-theme.png');
      await expect(page.locator('[data-testid="main-content-area"]')).toHaveScreenshot('content-area-dark-theme.png');
    });
  });

  test.describe('Form Rendering and Validation States', () => {
    test('@visual @forms should capture form validation states', async () => {
      await page.goto('/clients/create');

      // Empty form state
      await expect(page.locator('[data-testid="create-client-form"]')).toHaveScreenshot('client-form-empty.png');

      // Partially filled form
      await page.fill('[data-testid="firstName"]', 'John');
      await page.fill('[data-testid="lastName"]', 'Doe');
      await expect(page.locator('[data-testid="create-client-form"]')).toHaveScreenshot('client-form-partial.png');

      // Form with validation errors
      await page.click('[data-testid="save-client-button"]');
      await page.waitForSelector('[data-testid="validation-errors"]');
      await expect(page.locator('[data-testid="create-client-form"]')).toHaveScreenshot('client-form-validation-errors.png');

      // Completed valid form
      await page.fill('[data-testid="email"]', 'john.doe@example.com');
      await page.fill('[data-testid="businessName"]', 'Doe Enterprises');
      await expect(page.locator('[data-testid="create-client-form"]')).toHaveScreenshot('client-form-completed.png');
    });

    test('@visual @forms should capture VAT form states', async () => {
      await page.goto('/gra/vat/create');

      // Empty VAT form
      await expect(page.locator('[data-testid="vat-form"]')).toHaveScreenshot('vat-form-empty.png');

      // Form with calculations
      await page.fill('[data-testid="standard-rated-supplies"]', '100000.00');
      await page.fill('[data-testid="input-vat-amount"]', '12000.00');
      await page.click('[data-testid="calculate-vat"]');
      await page.waitForSelector('[data-testid="vat-calculations"]');
      await expect(page.locator('[data-testid="vat-form"]')).toHaveScreenshot('vat-form-with-calculations.png');

      // Form ready for submission
      await page.fill('[data-testid="zero-rated-supplies"]', '25000.00');
      await expect(page.locator('[data-testid="vat-form"]')).toHaveScreenshot('vat-form-ready-submission.png');
    });

    test('@visual @forms should capture file upload states', async () => {
      await page.goto('/documents/upload');

      // Empty upload area
      await expect(page.locator('[data-testid="upload-area"]')).toHaveScreenshot('upload-area-empty.png');

      // Upload area with drag over state (simulated)
      await page.hover('[data-testid="upload-area"]');
      await expect(page.locator('[data-testid="upload-area"]')).toHaveScreenshot('upload-area-hover.png');

      // Upload with file selected
      await page.setInputFiles('[data-testid="file-input"]', {
        name: 'test-document.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Test document content')
      });
      await expect(page.locator('[data-testid="upload-area"]')).toHaveScreenshot('upload-area-file-selected.png');
    });
  });

  test.describe('Data Loading States', () => {
    test('@visual @loading should capture loading states', async () => {
      // Intercept API calls to create loading states
      await page.route('**/api/clients', route => {
        // Delay response to capture loading state
        setTimeout(() => {
          route.continue();
        }, 3000);
      });

      await page.goto('/clients');

      // Capture loading skeleton
      await expect(page.locator('[data-testid="clients-loading-skeleton"]')).toHaveScreenshot('clients-loading-skeleton.png');

      // Wait for actual data
      await page.waitForSelector('[data-testid="clients-table"]');
      await expect(page.locator('[data-testid="clients-table"]')).toHaveScreenshot('clients-loaded-state.png');
    });

    test('@visual @loading should capture chart loading states', async () => {
      await page.route('**/api/analytics/dashboard', route => {
        setTimeout(() => {
          route.continue();
        }, 2000);
      });

      await page.goto('/analytics');

      // Capture chart loading placeholders
      await expect(page.locator('[data-testid="chart-loading-placeholder"]')).toHaveScreenshot('chart-loading-placeholder.png');

      // Wait for charts to load
      await page.waitForSelector('[data-testid="rendered-charts"]');
      await expect(page.locator('[data-testid="analytics-charts"]')).toHaveScreenshot('charts-fully-loaded.png');
    });
  });

  test.describe('Error States Visual Tests', () => {
    test('@visual @error should capture error page layouts', async () => {
      // 404 error page
      await page.goto('/non-existent-page');
      await expect(page).toHaveScreenshot('404-error-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Network error state
      await page.route('**/api/**', route => route.abort('internetdisconnected'));
      await page.goto('/clients');
      await page.waitForSelector('[data-testid="network-error-state"]');
      await expect(page.locator('[data-testid="network-error-state"]')).toHaveScreenshot('network-error-state.png');
    });

    test('@visual @error should capture form error states', async () => {
      await page.goto('/clients/create');

      // Trigger server validation error
      await page.fill('[data-testid="email"]', 'existing@email.com');
      await page.click('[data-testid="save-client-button"]');
      await page.waitForSelector('[data-testid="server-error-message"]');
      await expect(page.locator('[data-testid="create-client-form"]')).toHaveScreenshot('form-server-error.png');
    });
  });

  test.describe('Print Layouts', () => {
    test('@visual @print should capture print-optimized layouts', async () => {
      // Set print media type
      await page.emulateMedia({ media: 'print' });

      // VAT return print layout
      await page.goto('/gra/vat/123/print');
      await page.waitForSelector('[data-testid="printable-vat-return"]');
      await expect(page).toHaveScreenshot('vat-return-print-layout.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });

      // Client report print layout
      await page.goto('/clients/456/report/print');
      await page.waitForSelector('[data-testid="printable-client-report"]');
      await expect(page).toHaveScreenshot('client-report-print-layout.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01
      });
    });
  });

  test.describe('Animation and Transition States', () => {
    test('@visual @animations should capture modal transitions', async () => {
      await page.goto('/clients');

      // Capture modal opening
      await page.click('[data-testid="add-client-button"]');
      await page.waitForTimeout(500); // Mid-animation
      await expect(page.locator('[data-testid="client-modal"]')).toHaveScreenshot('client-modal-opening.png');

      // Fully opened modal
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="client-modal"]')).toHaveScreenshot('client-modal-opened.png');

      // Closing modal
      await page.click('[data-testid="close-modal"]');
      await page.waitForTimeout(250); // Mid-closing animation
      await expect(page.locator('[data-testid="client-modal"]')).toHaveScreenshot('client-modal-closing.png');
    });

    test('@visual @animations should capture sidebar collapse states', async () => {
      await page.goto('/dashboard');

      // Expanded sidebar
      await expect(page.locator('[data-testid="sidebar"]')).toHaveScreenshot('sidebar-expanded.png');

      // Collapsed sidebar
      await page.click('[data-testid="collapse-sidebar"]');
      await page.waitForTimeout(300);
      await expect(page.locator('[data-testid="sidebar"]')).toHaveScreenshot('sidebar-collapsed.png');

      // Sidebar during transition
      await page.click('[data-testid="expand-sidebar"]');
      await page.waitForTimeout(150); // Mid-animation
      await expect(page.locator('[data-testid="sidebar"]')).toHaveScreenshot('sidebar-expanding.png');
    });
  });

  test.afterEach(async () => {
    // Reset to default theme and viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.emulateMedia({ media: 'screen' });

    // Clear any route interceptions
    await page.unrouteAll();
  });
});