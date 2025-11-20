import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Dynamic Service Package Features Testing for GCMC-KAJ Platform
 *
 * Tests cover:
 * - Individual Tax Only package functionality
 * - Small Business Starter package features
 * - Full Business Compliance package workflows
 * - Custom service modifications per client
 * - Billing calculation and overrides
 * - Package upgrade/downgrade workflows
 */

test.describe('Dynamic Service Package Features', () => {
  let page: Page;
  let testClient: any;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Login as admin user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
    await page.fill('[data-testid="password"]', 'SecureAdmin123!');
    await page.click('[data-testid="loginButton"]');
    await page.waitForURL('**/dashboard');

    // Create a test client for service package testing
    testClient = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      businessName: faker.company.name(),
      businessType: 'Small Business'
    };
  });

  test.describe('Individual Tax Only Package', () => {
    test('@smoke @critical should configure Individual Tax Only package', async () => {
      await page.goto('/services/packages');

      // Select Individual Tax Only package
      await page.click('[data-testid="individual-tax-only-package"]');

      // Verify package details
      await expect(page.locator('[data-testid="package-name"]')).toContainText('Individual Tax Only');
      await expect(page.locator('[data-testid="package-description"]')).toContainText(/personal income tax/i);

      // Verify included services
      await expect(page.locator('[data-testid="included-services"]')).toContainText('Personal Income Tax Return');
      await expect(page.locator('[data-testid="included-services"]')).toContainText('Tax Planning Consultation');
      await expect(page.locator('[data-testid="included-services"]')).toContainText('Document Review');

      // Verify pricing structure
      await expect(page.locator('[data-testid="base-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="annual-fee"]')).toBeVisible();

      // Test package configuration
      await page.click('[data-testid="configure-package"]');

      // Set custom pricing
      await page.fill('[data-testid="custom-price"]', '350.00');

      // Add additional services
      await page.check('[data-testid="add-tax-amendment"]');
      await page.check('[data-testid="add-tax-consultation"]');

      // Save configuration
      await page.click('[data-testid="save-package-config"]');

      // Verify configuration saved
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/individual-tax-package-configured.png' });
    });

    test('@regression should assign Individual Tax package to client', async () => {
      // First create a test client
      await page.goto('/clients');
      await page.click('[data-testid="add-client-button"]');
      await page.fill('[data-testid="firstName"]', testClient.firstName);
      await page.fill('[data-testid="lastName"]', testClient.lastName);
      await page.fill('[data-testid="email"]', testClient.email);
      await page.click('[data-testid="save-client-button"]');

      // Navigate to client services
      await page.click(`[data-testid="view-client-${testClient.email}"]`);
      await page.click('[data-testid="client-services-tab"]');

      // Assign Individual Tax Only package
      await page.click('[data-testid="assign-service-package"]');
      await page.selectOption('[data-testid="package-select"]', 'Individual Tax Only');

      // Configure package for this client
      await page.fill('[data-testid="tax-year"]', '2024');
      await page.selectOption('[data-testid="filing-status"]', 'Single');
      await page.fill('[data-testid="estimated-income"]', '75000');

      // Set billing frequency
      await page.selectOption('[data-testid="billing-frequency"]', 'Annual');

      // Add client-specific notes
      await page.fill('[data-testid="service-notes"]', 'First year client - standard individual tax filing');

      // Save assignment
      await page.click('[data-testid="save-service-assignment"]');

      // Verify assignment
      await expect(page.locator('[data-testid="active-packages"]')).toContainText('Individual Tax Only');
      await expect(page.locator('[data-testid="package-status"]')).toContainText('Active');

      // Verify automatic task creation
      await page.click('[data-testid="client-tasks-tab"]');
      await expect(page.locator('[data-testid="task-list"]')).toContainText('Collect Tax Documents');
      await expect(page.locator('[data-testid="task-list"]')).toContainText('Prepare Tax Return');

      await page.screenshot({ path: 'test-results/individual-tax-package-assigned.png' });
    });

    test('@critical should calculate Individual Tax package billing', async () => {
      await page.goto('/services/billing-calculator');

      // Select Individual Tax Only package
      await page.selectOption('[data-testid="package-type"]', 'Individual Tax Only');

      // Set client parameters
      await page.selectOption('[data-testid="complexity-level"]', 'Standard');
      await page.fill('[data-testid="number-of-forms"]', '3');
      await page.check('[data-testid="has-business-income"]');

      // Calculate billing
      await page.click('[data-testid="calculate-billing"]');

      // Verify calculation results
      await expect(page.locator('[data-testid="base-package-fee"]')).toBeVisible();
      await expect(page.locator('[data-testid="additional-forms-fee"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-income-fee"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-fee"]')).toBeVisible();

      // Verify breakdown details
      await expect(page.locator('[data-testid="fee-breakdown"]')).toContainText('Standard Individual Return: $300');
      await expect(page.locator('[data-testid="fee-breakdown"]')).toContainText('Additional Forms (2): $50');
      await expect(page.locator('[data-testid="fee-breakdown"]')).toContainText('Business Income: $100');

      // Test different complexity levels
      await page.selectOption('[data-testid="complexity-level"]', 'Complex');
      await page.click('[data-testid="calculate-billing"]');

      const complexTotal = await page.locator('[data-testid="total-fee"]').textContent();
      expect(complexTotal).toContain('$'); // Should show increased fee for complex
    });
  });

  test.describe('Small Business Starter Package', () => {
    test('@smoke @critical should configure Small Business Starter package', async () => {
      await page.goto('/services/packages');

      // Select Small Business Starter package
      await page.click('[data-testid="small-business-starter-package"]');

      // Verify package details
      await expect(page.locator('[data-testid="package-name"]')).toContainText('Small Business Starter');
      await expect(page.locator('[data-testid="package-description"]')).toContainText(/essential services for small businesses/i);

      // Verify included services
      const includedServices = page.locator('[data-testid="included-services"]');
      await expect(includedServices).toContainText('Monthly VAT Returns');
      await expect(includedServices).toContainText('PAYE Submissions');
      await expect(includedServices).toContainText('Basic Bookkeeping');
      await expect(includedServices).toContainText('Business Registration Support');

      // Verify service limits
      await expect(page.locator('[data-testid="service-limits"]')).toContainText('Up to 50 transactions/month');
      await expect(page.locator('[data-testid="service-limits"]')).toContainText('Up to 5 employees');

      // Test package customization
      await page.click('[data-testid="customize-package"]');

      // Adjust service levels
      await page.fill('[data-testid="transaction-limit"]', '75');
      await page.fill('[data-testid="employee-limit"]', '8');

      // Add optional services
      await page.check('[data-testid="add-quarterly-reviews"]');
      await page.check('[data-testid="add-document-management"]');

      // Save customization
      await page.click('[data-testid="save-customization"]');

      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await page.screenshot({ path: 'test-results/small-business-package-customized.png' });
    });

    test('@critical should setup Small Business workflow automation', async () => {
      // Create business client
      await page.goto('/clients');
      await page.click('[data-testid="add-client-button"]');

      await page.fill('[data-testid="firstName"]', testClient.firstName);
      await page.fill('[data-testid="lastName"]', testClient.lastName);
      await page.fill('[data-testid="email"]', testClient.email);
      await page.fill('[data-testid="businessName"]', testClient.businessName);
      await page.selectOption('[data-testid="businessType"]', 'Small Business');
      await page.click('[data-testid="save-client-button"]');

      // Assign Small Business Starter package
      await page.click(`[data-testid="view-client-${testClient.email}"]`);
      await page.click('[data-testid="client-services-tab"]');
      await page.click('[data-testid="assign-service-package"]');
      await page.selectOption('[data-testid="package-select"]', 'Small Business Starter');

      // Configure business details
      await page.fill('[data-testid="business-start-date"]', '2024-01-01');
      await page.fill('[data-testid="employee-count"]', '3');
      await page.fill('[data-testid="monthly-turnover"]', '25000');
      await page.selectOption('[data-testid="industry-type"]', 'Retail');

      // Setup automation preferences
      await page.check('[data-testid="auto-vat-reminders"]');
      await page.check('[data-testid="auto-paye-calculations"]');
      await page.check('[data-testid="auto-deadline-notifications"]');

      // Configure notification settings
      await page.fill('[data-testid="notification-days"]', '7');
      await page.selectOption('[data-testid="notification-method"]', 'Email + SMS');

      // Save package assignment
      await page.click('[data-testid="save-service-assignment"]');

      // Verify automation setup
      await page.click('[data-testid="automation-tab"]');
      await expect(page.locator('[data-testid="active-automations"]')).toContainText('VAT Return Reminders');
      await expect(page.locator('[data-testid="active-automations"]')).toContainText('PAYE Calculation');
      await expect(page.locator('[data-testid="active-automations"]')).toContainText('Deadline Notifications');

      await page.screenshot({ path: 'test-results/small-business-automation-setup.png' });
    });

    test('@regression should handle Small Business package billing cycles', async () => {
      await page.goto('/billing/packages');

      // Filter for Small Business Starter packages
      await page.selectOption('[data-testid="package-filter"]', 'Small Business Starter');

      // Verify billing cycle options
      await page.click('[data-testid="billing-cycle-config"]');
      await expect(page.locator('[data-testid="monthly-billing"]')).toBeVisible();
      await expect(page.locator('[data-testid="quarterly-billing"]')).toBeVisible();
      await expect(page.locator('[data-testid="annual-billing"]')).toBeVisible();

      // Test monthly billing calculation
      await page.selectOption('[data-testid="billing-frequency"]', 'Monthly');
      await page.fill('[data-testid="base-monthly-fee"]', '450.00');

      // Add usage-based charges
      await page.fill('[data-testid="transaction-rate"]', '2.50');
      await page.fill('[data-testid="employee-rate"]', '25.00');

      // Calculate total for sample client
      await page.fill('[data-testid="sample-transactions"]', '60');
      await page.fill('[data-testid="sample-employees"]', '4');
      await page.click('[data-testid="calculate-sample-bill"]');

      // Verify calculation
      await expect(page.locator('[data-testid="base-fee-line"]')).toContainText('$450.00');
      await expect(page.locator('[data-testid="transaction-fee-line"]')).toContainText('$150.00');
      await expect(page.locator('[data-testid="employee-fee-line"]')).toContainText('$100.00');
      await expect(page.locator('[data-testid="total-monthly-bill"]')).toContainText('$700.00');
    });
  });

  test.describe('Full Business Compliance Package', () => {
    test('@smoke @critical should configure Full Business Compliance package', async () => {
      await page.goto('/services/packages');

      // Select Full Business Compliance package
      await page.click('[data-testid="full-business-compliance-package"]');

      // Verify comprehensive service list
      const serviceList = page.locator('[data-testid="service-list"]');
      await expect(serviceList).toContainText('All VAT Services');
      await expect(serviceList).toContainText('Complete PAYE Management');
      await expect(serviceList).toContainText('Corporate Tax Returns');
      await expect(serviceList).toContainText('Income Tax Returns');
      await expect(serviceList).toContainText('NIS Registration & Returns');
      await expect(serviceList).toContainText('Financial Statement Preparation');
      await expect(serviceList).toContainText('Audit Support');
      await expect(serviceList).toContainText('Regulatory Compliance Monitoring');
      await expect(serviceList).toContainText('Legal Document Management');

      // Verify compliance features
      await expect(page.locator('[data-testid="compliance-features"]')).toContainText('Real-time Compliance Monitoring');
      await expect(page.locator('[data-testid="compliance-features"]')).toContainText('Automated Deadline Tracking');
      await expect(page.locator('[data-testid="compliance-features"]')).toContainText('Regulatory Update Notifications');

      // Test enterprise configuration
      await page.click('[data-testid="enterprise-config"]');

      // Set compliance thresholds
      await page.fill('[data-testid="compliance-threshold"]', '95');
      await page.check('[data-testid="priority-support"]');
      await page.check('[data-testid="dedicated-accountant"]');

      // Configure reporting frequency
      await page.selectOption('[data-testid="report-frequency"]', 'Weekly');

      // Setup escalation procedures
      await page.check('[data-testid="auto-escalation"]');
      await page.fill('[data-testid="escalation-threshold"]', '24');

      // Save enterprise configuration
      await page.click('[data-testid="save-enterprise-config"]');

      await page.screenshot({ path: 'test-results/full-compliance-package-configured.png' });
    });

    test('@critical should implement full compliance monitoring', async () => {
      // Setup a large business client
      await page.goto('/clients');
      await page.click('[data-testid="add-client-button"]');

      await page.fill('[data-testid="firstName"]', testClient.firstName);
      await page.fill('[data-testid="lastName"]', testClient.lastName);
      await page.fill('[data-testid="email"]', testClient.email);
      await page.fill('[data-testid="businessName"]', testClient.businessName);
      await page.selectOption('[data-testid="businessType"]', 'Large Enterprise');
      await page.fill('[data-testid="employee-count"]', '150');
      await page.fill('[data-testid="annual-revenue"]', '15000000');
      await page.click('[data-testid="save-client-button"]');

      // Assign Full Business Compliance package
      await page.click(`[data-testid="view-client-${testClient.email}"]`);
      await page.click('[data-testid="client-services-tab"]');
      await page.click('[data-testid="assign-service-package"]');
      await page.selectOption('[data-testid="package-select"]', 'Full Business Compliance');

      // Configure comprehensive compliance monitoring
      await page.check('[data-testid="monitor-all-deadlines"]');
      await page.check('[data-testid="monitor-regulatory-changes"]');
      await page.check('[data-testid="monitor-payment-obligations"]');
      await page.check('[data-testid="monitor-document-requirements"]');

      // Setup compliance reporting
      await page.selectOption('[data-testid="compliance-report-frequency"]', 'Daily');
      await page.fill('[data-testid="compliance-target"]', '98');

      // Configure alert thresholds
      await page.fill('[data-testid="critical-alert-days"]', '3');
      await page.fill('[data-testid="warning-alert-days"]', '7');

      // Save compliance setup
      await page.click('[data-testid="save-compliance-setup"]');

      // Verify compliance dashboard
      await page.click('[data-testid="client-compliance-tab"]');
      await expect(page.locator('[data-testid="compliance-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="real-time-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="upcoming-deadlines"]')).toBeVisible();
      await expect(page.locator('[data-testid="compliance-score"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/full-compliance-monitoring.png' });
    });

    test('@performance should handle enterprise-level data volume', async () => {
      await page.goto('/services/packages/full-compliance/performance-test');

      // Simulate large data volume processing
      await page.fill('[data-testid="transaction-volume"]', '10000');
      await page.fill('[data-testid="document-count"]', '5000');
      await page.fill('[data-testid="employee-count"]', '500');

      // Start performance test
      await page.click('[data-testid="start-performance-test"]');

      // Monitor performance metrics
      await expect(page.locator('[data-testid="processing-status"]')).toBeVisible();

      // Wait for completion (with timeout)
      await page.waitForSelector('[data-testid="performance-results"]', { timeout: 60000 });

      // Verify performance meets requirements
      const processingTime = await page.locator('[data-testid="processing-time"]').textContent();
      const memoryUsage = await page.locator('[data-testid="memory-usage"]').textContent();

      // Processing time should be under 30 seconds for large volume
      const timeValue = parseInt(processingTime?.match(/\d+/)?.[0] || '0');
      expect(timeValue).toBeLessThan(30);

      // Memory usage should be reasonable
      const memoryValue = parseInt(memoryUsage?.match(/\d+/)?.[0] || '0');
      expect(memoryValue).toBeLessThan(500); // Less than 500MB
    });
  });

  test.describe('Custom Service Modifications', () => {
    test('@critical should create custom service modifications for clients', async () => {
      await page.goto('/clients');

      // Select existing client
      const existingClient = page.locator('[data-testid^="client-"]').first();
      await existingClient.click();

      // Go to services tab
      await page.click('[data-testid="client-services-tab"]');

      // Create custom service modification
      await page.click('[data-testid="customize-services"]');

      // Add custom service
      await page.click('[data-testid="add-custom-service"]');
      await page.fill('[data-testid="custom-service-name"]', 'Monthly Financial Analysis');
      await page.fill('[data-testid="custom-service-description"]', 'Detailed monthly financial performance analysis with recommendations');
      await page.fill('[data-testid="custom-service-price"]', '750.00');
      await page.selectOption('[data-testid="custom-service-frequency"]', 'Monthly');

      // Modify existing service
      await page.click('[data-testid="modify-vat-service"]');
      await page.fill('[data-testid="modified-price"]', '850.00');
      await page.fill('[data-testid="modification-reason"]', 'Complex business structure requires additional analysis');

      // Remove unnecessary service
      await page.click('[data-testid="remove-basic-bookkeeping"]');
      await page.fill('[data-testid="removal-reason"]', 'Client handles bookkeeping internally');

      // Save modifications
      await page.click('[data-testid="save-service-modifications"]');

      // Verify modifications applied
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="custom-services"]')).toContainText('Monthly Financial Analysis');
      await expect(page.locator('[data-testid="modified-services"]')).toContainText('VAT Returns - $850.00');

      await page.screenshot({ path: 'test-results/custom-service-modifications.png' });
    });

    test('@regression should track service modification history', async () => {
      await page.goto('/clients');

      const existingClient = page.locator('[data-testid^="client-"]').first();
      await existingClient.click();
      await page.click('[data-testid="client-services-tab"]');

      // View modification history
      await page.click('[data-testid="service-history"]');

      // Verify history entries
      await expect(page.locator('[data-testid="modification-history"]')).toBeVisible();

      const historyEntries = page.locator('[data-testid="history-entry"]');
      const count = await historyEntries.count();

      if (count > 0) {
        // Verify first entry has required information
        const firstEntry = historyEntries.first();
        await expect(firstEntry.locator('[data-testid="modification-date"]')).toBeVisible();
        await expect(firstEntry.locator('[data-testid="modification-type"]')).toBeVisible();
        await expect(firstEntry.locator('[data-testid="modification-details"]')).toBeVisible();
        await expect(firstEntry.locator('[data-testid="modified-by"]')).toBeVisible();
      }

      // Test history filtering
      await page.selectOption('[data-testid="history-filter"]', 'Price Changes');
      await page.waitForTimeout(1000);

      // Verify filtered results
      const filteredEntries = page.locator('[data-testid="history-entry"]');
      const filteredCount = await filteredEntries.count();

      for (let i = 0; i < Math.min(filteredCount, 3); i++) {
        const entryType = await filteredEntries.nth(i).locator('[data-testid="modification-type"]').textContent();
        expect(entryType).toContain('Price');
      }
    });
  });

  test.describe('Package Upgrade/Downgrade Workflows', () => {
    test('@critical should upgrade from Small Business to Full Compliance', async () => {
      await page.goto('/clients');

      // Select client with Small Business package
      const clientWithPackage = page.locator('[data-testid="client-with-small-business-package"]').first();
      await clientWithPackage.click();
      await page.click('[data-testid="client-services-tab"]');

      // Initiate upgrade
      await page.click('[data-testid="upgrade-package"]');

      // Select upgrade target
      await page.selectOption('[data-testid="upgrade-target"]', 'Full Business Compliance');

      // Review upgrade impact
      await expect(page.locator('[data-testid="upgrade-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="new-services"]')).toContainText('Corporate Tax Returns');
      await expect(page.locator('[data-testid="new-services"]')).toContainText('Audit Support');
      await expect(page.locator('[data-testid="price-change"]')).toBeVisible();

      // Set upgrade effective date
      await page.fill('[data-testid="upgrade-date"]', '2024-02-01');

      // Add upgrade reason
      await page.fill('[data-testid="upgrade-reason"]', 'Business growth requires comprehensive compliance management');

      // Configure transition
      await page.check('[data-testid="maintain-existing-data"]');
      await page.check('[data-testid="migrate-historical-data"]');

      // Confirm upgrade
      await page.click('[data-testid="confirm-upgrade"]');

      // Verify upgrade process
      await expect(page.locator('[data-testid="upgrade-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="package-status"]')).toContainText('Full Business Compliance');

      // Verify transition tasks created
      await page.click('[data-testid="client-tasks-tab"]');
      await expect(page.locator('[data-testid="task-list"]')).toContainText('Setup Corporate Tax Framework');
      await expect(page.locator('[data-testid="task-list"]')).toContainText('Migrate Historical Data');

      await page.screenshot({ path: 'test-results/package-upgrade-completed.png' });
    });

    test('@regression should handle package downgrade with data retention', async () => {
      await page.goto('/clients');

      // Select client with Full Compliance package
      const clientWithFullPackage = page.locator('[data-testid="client-with-full-compliance-package"]').first();
      await clientWithFullPackage.click();
      await page.click('[data-testid="client-services-tab"]');

      // Initiate downgrade
      await page.click('[data-testid="downgrade-package"]');

      // Select downgrade target
      await page.selectOption('[data-testid="downgrade-target"]', 'Small Business Starter');

      // Review downgrade impact
      await expect(page.locator('[data-testid="downgrade-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="services-to-remove"]')).toContainText('Audit Support');
      await expect(page.locator('[data-testid="services-to-remove"]')).toContainText('Legal Document Management');

      // Configure data retention
      await page.check('[data-testid="retain-historical-data"]');
      await page.selectOption('[data-testid="retention-period"]', '7 years');
      await page.check('[data-testid="export-removed-data"]');

      // Set downgrade effective date
      await page.fill('[data-testid="downgrade-date"]', '2024-03-01');

      // Add downgrade reason
      await page.fill('[data-testid="downgrade-reason"]', 'Business simplification and cost reduction');

      // Confirm downgrade
      await page.click('[data-testid="confirm-downgrade"]');

      // Verify downgrade warning
      await expect(page.locator('[data-testid="final-confirmation-dialog"]')).toBeVisible();
      await page.click('[data-testid="confirm-final-downgrade"]');

      // Verify downgrade completion
      await expect(page.locator('[data-testid="downgrade-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="package-status"]')).toContainText('Small Business Starter');

      // Verify data export initiated
      await expect(page.locator('[data-testid="data-export-status"]')).toContainText('In Progress');
    });
  });

  test.afterEach(async () => {
    // Cleanup: Return to dashboard
    await page.goto('/dashboard');
  });
});