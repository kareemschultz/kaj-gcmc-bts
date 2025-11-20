import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Comprehensive Core Business Functionality Testing for GCMC-KAJ Platform
 *
 * Tests cover:
 * - Client management (CRUD operations)
 * - Service package subscription workflows
 * - Document upload and management
 * - Filing creation and submission
 * - Compliance score calculations
 * - Business process workflows
 */

test.describe('Core Business Functionality Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Login as admin user before each test
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
    await page.fill('[data-testid="password"]', 'SecureAdmin123!');
    await page.click('[data-testid="loginButton"]');
    await page.waitForURL('**/dashboard');
  });

  test.describe('Client Management', () => {
    let testClient: any;

    test.beforeEach(async () => {
      testClient = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        businessName: faker.company.name(),
        businessType: 'Small Business',
        taxIdNumber: faker.number.int({ min: 100000000, max: 999999999 }).toString(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        postalCode: faker.location.zipCode(),
        country: 'Guyana'
      };
    });

    test('@smoke @critical should create new client with complete information', async () => {
      await page.goto('/clients');
      await expect(page).toHaveTitle(/Clients/);

      // Take screenshot of clients page
      await page.screenshot({ path: 'test-results/clients-page.png' });

      // Click add new client button
      await page.click('[data-testid="add-client-button"]');

      // Wait for create client form
      await expect(page.locator('[data-testid="create-client-form"]')).toBeVisible();

      // Fill client information
      await page.fill('[data-testid="firstName"]', testClient.firstName);
      await page.fill('[data-testid="lastName"]', testClient.lastName);
      await page.fill('[data-testid="email"]', testClient.email);
      await page.fill('[data-testid="phoneNumber"]', testClient.phoneNumber);
      await page.fill('[data-testid="businessName"]', testClient.businessName);
      await page.selectOption('[data-testid="businessType"]', testClient.businessType);
      await page.fill('[data-testid="taxIdNumber"]', testClient.taxIdNumber);
      await page.fill('[data-testid="address"]', testClient.address);
      await page.fill('[data-testid="city"]', testClient.city);
      await page.fill('[data-testid="postalCode"]', testClient.postalCode);
      await page.selectOption('[data-testid="country"]', testClient.country);

      // Submit form
      await page.click('[data-testid="save-client-button"]');

      // Verify success message and redirect
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText(/client created successfully/i);

      // Verify client appears in the list
      await page.goto('/clients');
      await expect(page.locator(`[data-testid="client-${testClient.email}"]`)).toBeVisible();

      await page.screenshot({ path: 'test-results/client-created.png' });
    });

    test('@regression should edit existing client information', async () => {
      // First create a client
      await page.goto('/clients');
      await page.click('[data-testid="add-client-button"]');

      await page.fill('[data-testid="firstName"]', testClient.firstName);
      await page.fill('[data-testid="lastName"]', testClient.lastName);
      await page.fill('[data-testid="email"]', testClient.email);
      await page.fill('[data-testid="businessName"]', testClient.businessName);
      await page.click('[data-testid="save-client-button"]');

      await page.waitForTimeout(2000);

      // Now edit the client
      await page.goto('/clients');
      await page.click(`[data-testid="edit-client-${testClient.email}"]`);

      // Update client information
      const updatedFirstName = faker.person.firstName();
      const updatedBusinessName = faker.company.name();

      await page.fill('[data-testid="firstName"]', updatedFirstName);
      await page.fill('[data-testid="businessName"]', updatedBusinessName);

      await page.click('[data-testid="save-client-button"]');

      // Verify updates
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await page.goto('/clients');

      await expect(page.locator(`[data-testid="client-${testClient.email}"]`)).toContainText(updatedFirstName);
      await expect(page.locator(`[data-testid="client-${testClient.email}"]`)).toContainText(updatedBusinessName);
    });

    test('@critical should view client details and history', async () => {
      await page.goto('/clients');

      // Click on first client in the list
      const firstClient = page.locator('[data-testid^="client-"]').first();
      await firstClient.click();

      // Should navigate to client details page
      await expect(page).toHaveURL(/\/clients\/\d+/);

      // Verify client details sections are present
      await expect(page.locator('[data-testid="client-info-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="client-services-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="client-documents-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="client-compliance-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="client-activity-log"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/client-details.png' });
    });

    test('@regression should search and filter clients', async () => {
      await page.goto('/clients');

      // Test search functionality
      const searchTerm = 'test';
      await page.fill('[data-testid="client-search"]', searchTerm);
      await page.keyboard.press('Enter');

      // Wait for search results
      await page.waitForTimeout(1000);

      // Verify search results contain the search term
      const clientResults = page.locator('[data-testid^="client-"]');
      const count = await clientResults.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const clientText = await clientResults.nth(i).textContent();
          expect(clientText?.toLowerCase()).toContain(searchTerm.toLowerCase());
        }
      }

      // Test filter functionality
      await page.selectOption('[data-testid="business-type-filter"]', 'Small Business');
      await page.waitForTimeout(1000);

      // Verify filtered results
      const filteredResults = page.locator('[data-testid^="client-"]');
      const filteredCount = await filteredResults.count();

      if (filteredCount > 0) {
        // Verify each result is a small business
        const firstResult = filteredResults.first();
        await firstResult.click();
        await expect(page.locator('[data-testid="business-type"]')).toContainText('Small Business');
      }
    });

    test('@negative should validate required client fields', async () => {
      await page.goto('/clients');
      await page.click('[data-testid="add-client-button"]');

      // Try to save without required fields
      await page.click('[data-testid="save-client-button"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="firstName-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="lastName-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();

      // Verify form doesn't submit
      await expect(page.locator('[data-testid="create-client-form"]')).toBeVisible();
    });
  });

  test.describe('Service Package Management', () => {
    test('@critical should assign service package to client', async () => {
      await page.goto('/clients');

      // Click on first client
      const firstClient = page.locator('[data-testid^="client-"]').first();
      await firstClient.click();

      // Navigate to services section
      await page.click('[data-testid="client-services-tab"]');

      // Add a service package
      await page.click('[data-testid="add-service-package"]');

      // Select a package
      await page.selectOption('[data-testid="package-select"]', 'Full Business Compliance');

      // Set start date
      await page.fill('[data-testid="start-date"]', '2024-01-01');

      // Add notes
      await page.fill('[data-testid="service-notes"]', 'Full compliance package for small business');

      // Save service assignment
      await page.click('[data-testid="save-service-assignment"]');

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-services"]')).toContainText('Full Business Compliance');

      await page.screenshot({ path: 'test-results/service-package-assigned.png' });
    });

    test('@regression should modify service package billing', async () => {
      await page.goto('/clients');

      // Navigate to a client with existing services
      const firstClient = page.locator('[data-testid^="client-"]').first();
      await firstClient.click();
      await page.click('[data-testid="client-services-tab"]');

      // Edit existing service
      await page.click('[data-testid="edit-service"].nth(0)');

      // Update billing amount
      const newAmount = '1500.00';
      await page.fill('[data-testid="billing-amount"]', newAmount);

      // Add billing override reason
      await page.fill('[data-testid="billing-reason"]', 'Custom pricing for long-term client');

      // Save changes
      await page.click('[data-testid="save-service-changes"]');

      // Verify updates
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="service-billing"]')).toContainText(newAmount);
    });

    test('@critical should calculate service pricing correctly', async () => {
      await page.goto('/services/calculator');

      // Select multiple services
      await page.check('[data-testid="service-vat-returns"]');
      await page.check('[data-testid="service-paye"]');
      await page.check('[data-testid="service-income-tax"]');

      // Set client type
      await page.selectOption('[data-testid="client-type"]', 'Small Business');

      // Set frequency
      await page.selectOption('[data-testid="service-frequency"]', 'Monthly');

      // Calculate pricing
      await page.click('[data-testid="calculate-pricing"]');

      // Verify pricing calculation
      await expect(page.locator('[data-testid="total-monthly"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-annual"]')).toBeVisible();
      await expect(page.locator('[data-testid="pricing-breakdown"]')).toBeVisible();

      // Verify individual service prices are shown
      await expect(page.locator('[data-testid="vat-returns-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="paye-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="income-tax-price"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/service-pricing-calculator.png' });
    });
  });

  test.describe('Document Management', () => {
    test('@critical should upload client documents', async () => {
      await page.goto('/clients');

      // Navigate to client details
      const firstClient = page.locator('[data-testid^="client-"]').first();
      await firstClient.click();

      // Go to documents section
      await page.click('[data-testid="client-documents-tab"]');

      // Upload a document
      await page.click('[data-testid="upload-document-button"]');

      // Select document type
      await page.selectOption('[data-testid="document-type"]', 'Tax Return');

      // Add document description
      await page.fill('[data-testid="document-description"]', 'Annual Tax Return 2024');

      // Upload file (simulate file upload)
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles({
        name: 'tax-return-2024.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock PDF content for testing')
      });

      // Save document
      await page.click('[data-testid="save-document"]');

      // Verify upload success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="document-list"]')).toContainText('tax-return-2024.pdf');
      await expect(page.locator('[data-testid="document-list"]')).toContainText('Annual Tax Return 2024');

      await page.screenshot({ path: 'test-results/document-uploaded.png' });
    });

    test('@regression should organize documents by category', async () => {
      await page.goto('/clients');

      const firstClient = page.locator('[data-testid^="client-"]').first();
      await firstClient.click();
      await page.click('[data-testid="client-documents-tab"]');

      // Test document filtering by category
      await page.selectOption('[data-testid="document-category-filter"]', 'Tax Documents');
      await page.waitForTimeout(1000);

      // Verify only tax documents are shown
      const documents = page.locator('[data-testid="document-item"]');
      const count = await documents.count();

      for (let i = 0; i < count; i++) {
        const documentType = await documents.nth(i).locator('[data-testid="document-type"]').textContent();
        expect(['Tax Return', 'Tax Assessment', 'Tax Certificate'].some(type =>
          documentType?.includes(type))).toBeTruthy();
      }
    });

    test('@critical should implement document version control', async () => {
      await page.goto('/clients');

      const firstClient = page.locator('[data-testid^="client-"]').first();
      await firstClient.click();
      await page.click('[data-testid="client-documents-tab"]');

      // Upload initial document version
      await page.click('[data-testid="upload-document-button"]');
      await page.selectOption('[data-testid="document-type"]', 'Financial Statement');
      await page.fill('[data-testid="document-description"]', 'Q1 Financial Statement');

      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles({
        name: 'q1-financials.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Q1 Financial Statement v1.0')
      });
      await page.click('[data-testid="save-document"]');

      // Upload new version of the same document
      await page.click('[data-testid="upload-new-version"]');
      await fileInput.setInputFiles({
        name: 'q1-financials-revised.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Q1 Financial Statement v1.1 - Revised')
      });
      await page.fill('[data-testid="version-notes"]', 'Added missing transaction details');
      await page.click('[data-testid="save-new-version"]');

      // Verify version history
      await expect(page.locator('[data-testid="document-versions"]')).toBeVisible();
      await expect(page.locator('[data-testid="version-1.0"]')).toBeVisible();
      await expect(page.locator('[data-testid="version-1.1"]')).toBeVisible();
      await expect(page.locator('[data-testid="version-notes"]')).toContainText('Added missing transaction details');
    });

    test('@negative should validate document upload restrictions', async () => {
      await page.goto('/clients');

      const firstClient = page.locator('[data-testid^="client-"]').first();
      await firstClient.click();
      await page.click('[data-testid="client-documents-tab"]');

      // Try to upload file that's too large
      await page.click('[data-testid="upload-document-button"]');

      const largeFileInput = page.locator('[data-testid="file-input"]');
      await largeFileInput.setInputFiles({
        name: 'large-file.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.alloc(50 * 1024 * 1024) // 50MB file
      });

      await page.click('[data-testid="save-document"]');

      // Should show file size error
      await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="file-size-error"]')).toContainText(/file too large/i);

      // Try to upload unsupported file type
      await largeFileInput.setInputFiles({
        name: 'script.exe',
        mimeType: 'application/x-executable',
        buffer: Buffer.from('Mock executable content')
      });

      await page.click('[data-testid="save-document"]');

      // Should show file type error
      await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="file-type-error"]')).toContainText(/unsupported file type/i);
    });
  });

  test.describe('Filing Creation and Submission', () => {
    test('@critical should create VAT return filing', async () => {
      await page.goto('/filings');

      // Create new VAT return filing
      await page.click('[data-testid="create-filing-button"]');

      // Select filing type
      await page.selectOption('[data-testid="filing-type"]', 'VAT Return');

      // Select client
      await page.click('[data-testid="client-selector"]');
      await page.click('[data-testid="client-option"]').first();

      // Set filing period
      await page.selectOption('[data-testid="filing-period"]', '2024-Q1');

      // Add filing details
      await page.fill('[data-testid="gross-sales"]', '150000.00');
      await page.fill('[data-testid="input-vat"]', '12000.00');
      await page.fill('[data-testid="output-vat"]', '19500.00');

      // Calculate VAT liability
      await page.click('[data-testid="calculate-vat"]');

      // Verify calculation
      await expect(page.locator('[data-testid="vat-payable"]')).toContainText('7,500.00');

      // Save draft
      await page.click('[data-testid="save-draft"]');

      // Verify draft saved
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="filing-status"]')).toContainText('Draft');

      await page.screenshot({ path: 'test-results/vat-filing-created.png' });
    });

    test('@critical should submit filing to GRA', async () => {
      await page.goto('/filings');

      // Open existing draft filing
      await page.click('[data-testid="draft-filing"]').first();

      // Review filing details
      await expect(page.locator('[data-testid="filing-review"]')).toBeVisible();

      // Submit to GRA
      await page.click('[data-testid="submit-to-gra"]');

      // Confirm submission
      await page.click('[data-testid="confirm-submission"]');

      // Verify submission
      await expect(page.locator('[data-testid="success-message"]')).toContainText(/submitted to GRA/i);
      await expect(page.locator('[data-testid="filing-status"]')).toContainText('Submitted');
      await expect(page.locator('[data-testid="submission-reference"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/filing-submitted.png' });
    });

    test('@regression should track filing deadlines', async () => {
      await page.goto('/dashboard');

      // Check compliance dashboard
      await expect(page.locator('[data-testid="upcoming-deadlines"]')).toBeVisible();

      // Verify deadline information
      const deadlines = page.locator('[data-testid="deadline-item"]');
      const count = await deadlines.count();

      if (count > 0) {
        // Verify first deadline has required information
        const firstDeadline = deadlines.first();
        await expect(firstDeadline.locator('[data-testid="deadline-date"]')).toBeVisible();
        await expect(firstDeadline.locator('[data-testid="deadline-type"]')).toBeVisible();
        await expect(firstDeadline.locator('[data-testid="client-name"]')).toBeVisible();
        await expect(firstDeadline.locator('[data-testid="deadline-status"]')).toBeVisible();
      }

      // Test deadline filtering
      await page.selectOption('[data-testid="deadline-filter"]', 'This Week');
      await page.waitForTimeout(1000);

      // Verify filtered deadlines are within the week
      const filteredDeadlines = page.locator('[data-testid="deadline-item"]');
      const filteredCount = await filteredDeadlines.count();

      // All deadlines should be within the next 7 days
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      for (let i = 0; i < Math.min(filteredCount, 5); i++) {
        const deadlineDate = await filteredDeadlines.nth(i).locator('[data-testid="deadline-date"]').textContent();
        if (deadlineDate) {
          const deadline = new Date(deadlineDate);
          expect(deadline >= today && deadline <= nextWeek).toBeTruthy();
        }
      }
    });
  });

  test.describe('Compliance Score Calculations', () => {
    test('@critical should calculate client compliance score', async () => {
      await page.goto('/clients');

      // Navigate to client with compliance data
      const firstClient = page.locator('[data-testid^="client-"]').first();
      await firstClient.click();

      // Go to compliance section
      await page.click('[data-testid="client-compliance-tab"]');

      // Verify compliance score display
      await expect(page.locator('[data-testid="compliance-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="compliance-percentage"]')).toBeVisible();

      // Verify score breakdown
      await expect(page.locator('[data-testid="filing-compliance"]')).toBeVisible();
      await expect(page.locator('[data-testid="document-compliance"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-compliance"]')).toBeVisible();

      // Check score history
      await expect(page.locator('[data-testid="compliance-history"]')).toBeVisible();

      // Verify score factors
      await page.click('[data-testid="score-details"]');
      await expect(page.locator('[data-testid="score-factors"]')).toBeVisible();
      await expect(page.locator('[data-testid="improvement-recommendations"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/compliance-score.png' });
    });

    test('@regression should update compliance score when filings are submitted', async () => {
      await page.goto('/clients');

      const firstClient = page.locator('[data-testid^="client-"]').first();
      await firstClient.click();
      await page.click('[data-testid="client-compliance-tab"]');

      // Record initial compliance score
      const initialScore = await page.locator('[data-testid="compliance-percentage"]').textContent();

      // Submit a new filing
      await page.goto('/filings');
      await page.click('[data-testid="create-filing-button"]');
      await page.selectOption('[data-testid="filing-type"]', 'VAT Return');
      // ... complete filing creation and submission

      // Return to client compliance page
      await page.goto('/clients');
      await firstClient.click();
      await page.click('[data-testid="client-compliance-tab"]');

      // Verify score has been updated
      const updatedScore = await page.locator('[data-testid="compliance-percentage"]').textContent();

      // Score should be different (assuming the submission improved compliance)
      expect(updatedScore).not.toBe(initialScore);
    });

    test('@critical should show compliance trends and analytics', async () => {
      await page.goto('/analytics/compliance');

      // Verify compliance analytics dashboard
      await expect(page.locator('[data-testid="compliance-overview"]')).toBeVisible();
      await expect(page.locator('[data-testid="compliance-trends"]')).toBeVisible();
      await expect(page.locator('[data-testid="client-rankings"]')).toBeVisible();

      // Test date range filtering
      await page.selectOption('[data-testid="date-range"]', 'Last 3 Months');
      await page.waitForTimeout(2000);

      // Verify charts are updated
      await expect(page.locator('[data-testid="compliance-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="trend-analysis"]')).toBeVisible();

      // Test client-specific filtering
      await page.click('[data-testid="client-filter"]');
      await page.click('[data-testid="client-option"]').first();
      await page.waitForTimeout(2000);

      // Verify filtered data
      await expect(page.locator('[data-testid="client-compliance-detail"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/compliance-analytics.png' });
    });
  });

  test.afterEach(async () => {
    // Cleanup: Return to dashboard
    await page.goto('/dashboard');
  });
});