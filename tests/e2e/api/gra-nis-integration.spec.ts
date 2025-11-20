import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * GRA/NIS Integration Testing for GCMC-KAJ Platform
 *
 * Tests cover:
 * - GRA service workflows (VAT, PAYE, Income Tax, Corporate Tax)
 * - NIS service workflows (Monthly Returns, Annual Returns, Registration)
 * - Compliance deadline tracking and notifications
 * - Document digitization and submission workflows
 * - Integration error handling and retry mechanisms
 */

test.describe('GRA/NIS Integration Tests', () => {
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

    testClient = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      businessName: faker.company.name(),
      taxIdNumber: faker.number.int({ min: 100000000, max: 999999999 }).toString(),
      employerRegNumber: faker.number.int({ min: 10000, max: 99999 }).toString()
    };
  });

  test.describe('GRA Service Workflows', () => {
    test.describe('VAT Services', () => {
      test('@smoke @critical should submit VAT return to GRA', async () => {
        await page.goto('/gra/vat');

        // Create new VAT return
        await page.click('[data-testid="create-vat-return"]');

        // Select client
        await page.selectOption('[data-testid="vat-client-select"]', { index: 1 });

        // Set filing period
        await page.selectOption('[data-testid="vat-period"]', '2024-Q1');

        // Enter VAT return data
        await page.fill('[data-testid="standard-rated-supplies"]', '125000.00');
        await page.fill('[data-testid="zero-rated-supplies"]', '25000.00');
        await page.fill('[data-testid="exempt-supplies"]', '5000.00');
        await page.fill('[data-testid="input-vat-amount"]', '15000.00');

        // Calculate output VAT
        await page.click('[data-testid="calculate-output-vat"]');

        // Verify calculations
        await expect(page.locator('[data-testid="output-vat-total"]')).toContainText('16,250.00');
        await expect(page.locator('[data-testid="vat-payable"]')).toContainText('1,250.00');

        // Upload supporting documents
        await page.setInputFiles('[data-testid="vat-supporting-docs"]', {
          name: 'sales-register.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('Mock sales register document')
        });

        // Submit to GRA
        await page.click('[data-testid="submit-to-gra"]');

        // Verify submission confirmation dialog
        await expect(page.locator('[data-testid="gra-submission-dialog"]')).toBeVisible();
        await expect(page.locator('[data-testid="submission-summary"]')).toContainText('VAT Return Q1 2024');
        await expect(page.locator('[data-testid="submission-amount"]')).toContainText('1,250.00');

        // Confirm submission
        await page.click('[data-testid="confirm-gra-submission"]');

        // Wait for GRA response
        await page.waitForSelector('[data-testid="gra-response"]', { timeout: 30000 });

        // Verify successful submission
        await expect(page.locator('[data-testid="submission-status"]')).toContainText('Submitted Successfully');
        await expect(page.locator('[data-testid="gra-reference-number"]')).toBeVisible();
        await expect(page.locator('[data-testid="submission-timestamp"]')).toBeVisible();

        await page.screenshot({ path: 'test-results/vat-return-submitted-gra.png' });
      });

      test('@regression should handle VAT return amendments', async () => {
        await page.goto('/gra/vat/returns');

        // Select submitted VAT return
        await page.click('[data-testid="submitted-vat-return"]').first();

        // Initiate amendment
        await page.click('[data-testid="amend-vat-return"]');

        // Verify amendment dialog
        await expect(page.locator('[data-testid="amendment-warning"]')).toBeVisible();
        await expect(page.locator('[data-testid="amendment-warning"]')).toContainText(/amending submitted return/i);

        // Enter amendment reason
        await page.fill('[data-testid="amendment-reason"]', 'Correction of input VAT calculation error');

        // Modify VAT amounts
        await page.fill('[data-testid="corrected-input-vat"]', '14500.00');

        // Recalculate
        await page.click('[data-testid="recalculate-vat"]');

        // Verify new calculations
        await expect(page.locator('[data-testid="amended-vat-payable"]')).toContainText('1,750.00');
        await expect(page.locator('[data-testid="additional-payment"]')).toContainText('500.00');

        // Submit amendment to GRA
        await page.click('[data-testid="submit-amendment"]');

        // Verify amendment submission
        await expect(page.locator('[data-testid="amendment-confirmation"]')).toBeVisible();
        await expect(page.locator('[data-testid="amendment-reference"]')).toBeVisible();
      });

      test('@negative should handle GRA VAT submission errors', async () => {
        await page.goto('/gra/vat');

        // Create VAT return with invalid data
        await page.click('[data-testid="create-vat-return"]');
        await page.selectOption('[data-testid="vat-client-select"]', { index: 1 });
        await page.selectOption('[data-testid="vat-period"]', '2024-Q1');

        // Enter invalid/inconsistent data
        await page.fill('[data-testid="standard-rated-supplies"]', '-1000.00'); // Negative value
        await page.fill('[data-testid="input-vat-amount"]', '999999999.99'); // Unrealistic amount

        // Attempt submission
        await page.click('[data-testid="submit-to-gra"]');

        // Verify validation errors
        await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-negative-supplies"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-excessive-input-vat"]')).toBeVisible();

        // Fix data and retry
        await page.fill('[data-testid="standard-rated-supplies"]', '100000.00');
        await page.fill('[data-testid="input-vat-amount"]', '12000.00');

        // Submit again
        await page.click('[data-testid="submit-to-gra"]');

        // Should now succeed or show GRA-specific error if system is down
        await expect(
          page.locator('[data-testid="submission-status"]').or(
            page.locator('[data-testid="gra-system-error"]')
          )
        ).toBeVisible();
      });
    });

    test.describe('PAYE Services', () => {
      test('@critical should process monthly PAYE submissions', async () => {
        await page.goto('/gra/paye');

        // Create monthly PAYE return
        await page.click('[data-testid="create-paye-return"]');

        // Select employer
        await page.selectOption('[data-testid="employer-select"]', { index: 1 });

        // Set payroll period
        await page.selectOption('[data-testid="payroll-period"]', '2024-01');

        // Enter employee payroll data
        await page.click('[data-testid="add-employee-row"]');
        await page.fill('[data-testid="employee-name-1"]', 'John Doe');
        await page.fill('[data-testid="employee-nin-1"]', '123456789');
        await page.fill('[data-testid="gross-pay-1"]', '85000.00');
        await page.fill('[data-testid="tax-deducted-1"]', '12750.00');

        // Add another employee
        await page.click('[data-testid="add-employee-row"]');
        await page.fill('[data-testid="employee-name-2"]', 'Jane Smith');
        await page.fill('[data-testid="employee-nin-2"]', '987654321');
        await page.fill('[data-testid="gross-pay-2"]', '95000.00');
        await page.fill('[data-testid="tax-deducted-2"]', '15200.00');

        // Calculate totals
        await page.click('[data-testid="calculate-paye-totals"]');

        // Verify calculations
        await expect(page.locator('[data-testid="total-gross-pay"]')).toContainText('180,000.00');
        await expect(page.locator('[data-testid="total-tax-deducted"]')).toContainText('27,950.00');

        // Submit to GRA
        await page.click('[data-testid="submit-paye-to-gra"]');

        // Confirm submission
        await page.click('[data-testid="confirm-paye-submission"]');

        // Verify submission
        await expect(page.locator('[data-testid="paye-submission-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="gra-paye-reference"]')).toBeVisible();

        await page.screenshot({ path: 'test-results/paye-return-submitted.png' });
      });

      test('@regression should handle PAYE employee additions/removals', async () => {
        await page.goto('/gra/paye/employees');

        // Add new employee
        await page.click('[data-testid="register-new-employee"]');

        await page.fill('[data-testid="new-employee-name"]', 'Michael Johnson');
        await page.fill('[data-testid="new-employee-nin"]', '555666777');
        await page.fill('[data-testid="new-employee-address"]', '123 Main Street, Georgetown');
        await page.fill('[data-testid="new-employee-start-date"]', '2024-02-01');
        await page.fill('[data-testid="new-employee-salary"]', '75000.00');

        // Submit to GRA
        await page.click('[data-testid="register-with-gra"]');

        // Verify employee registration
        await expect(page.locator('[data-testid="employee-registration-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="gra-employee-id"]')).toBeVisible();

        // Test employee termination
        await page.click('[data-testid="terminate-employee"]');
        await page.fill('[data-testid="termination-date"]', '2024-03-31');
        await page.selectOption('[data-testid="termination-reason"]', 'Resignation');

        // Submit termination to GRA
        await page.click('[data-testid="submit-termination"]');

        // Verify termination processed
        await expect(page.locator('[data-testid="termination-confirmation"]')).toBeVisible();
      });
    });

    test.describe('Income Tax Services', () => {
      test('@critical should submit individual income tax returns', async () => {
        await page.goto('/gra/income-tax');

        // Create individual tax return
        await page.click('[data-testid="create-individual-return"]');

        // Enter taxpayer information
        await page.fill('[data-testid="taxpayer-name"]', 'Robert Williams');
        await page.fill('[data-testid="taxpayer-tin"]', '123456789');
        await page.selectOption('[data-testid="tax-year"]', '2024');

        // Enter income details
        await page.fill('[data-testid="employment-income"]', '1200000.00');
        await page.fill('[data-testid="rental-income"]', '150000.00');
        await page.fill('[data-testid="investment-income"]', '45000.00');

        // Enter deductions
        await page.fill('[data-testid="mortgage-interest"]', '85000.00');
        await page.fill('[data-testid="insurance-premiums"]', '25000.00');

        // Calculate tax
        await page.click('[data-testid="calculate-income-tax"]');

        // Verify tax calculation
        await expect(page.locator('[data-testid="total-income"]')).toContainText('1,395,000.00');
        await expect(page.locator('[data-testid="total-deductions"]')).toContainText('110,000.00');
        await expect(page.locator('[data-testid="taxable-income"]')).toContainText('1,285,000.00');
        await expect(page.locator('[data-testid="tax-payable"]')).toBeVisible();

        // Attach supporting documents
        await page.setInputFiles('[data-testid="income-tax-documents"]', [
          {
            name: 'employment-certificate.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('Employment certificate document')
          },
          {
            name: 'rental-agreements.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('Rental agreements document')
          }
        ]);

        // Submit to GRA
        await page.click('[data-testid="submit-income-tax-return"]');

        // Verify submission
        await expect(page.locator('[data-testid="income-tax-submission-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="assessment-notice"]')).toContainText(/assessment will be issued/i);

        await page.screenshot({ path: 'test-results/income-tax-return-submitted.png' });
      });
    });

    test.describe('Corporate Tax Services', () => {
      test('@critical should submit corporate tax returns', async () => {
        await page.goto('/gra/corporate-tax');

        // Create corporate tax return
        await page.click('[data-testid="create-corporate-return"]');

        // Enter company information
        await page.fill('[data-testid="company-name"]', testClient.businessName);
        await page.fill('[data-testid="company-tin"]', testClient.taxIdNumber);
        await page.selectOption('[data-testid="accounting-period-end"]', '2024-12-31');

        // Enter financial data
        await page.fill('[data-testid="gross-income"]', '8500000.00');
        await page.fill('[data-testid="cost-of-sales"]', '4200000.00');
        await page.fill('[data-testid="operating-expenses"]', '2800000.00');
        await page.fill('[data-testid="depreciation"]', '350000.00');

        // Calculate taxable profit
        await page.click('[data-testid="calculate-corporate-tax"]');

        // Verify calculations
        await expect(page.locator('[data-testid="net-profit"]')).toContainText('1,150,000.00');
        await expect(page.locator('[data-testid="corporate-tax-rate"]')).toContainText('25%');
        await expect(page.locator('[data-testid="tax-liability"]')).toContainText('287,500.00');

        // Upload financial statements
        await page.setInputFiles('[data-testid="financial-statements"]', [
          {
            name: 'audited-financial-statements.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('Audited financial statements')
          },
          {
            name: 'directors-report.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('Directors report')
          }
        ]);

        // Submit corporate return
        await page.click('[data-testid="submit-corporate-return"]');

        // Verify submission
        await expect(page.locator('[data-testid="corporate-tax-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="corporate-assessment-reference"]')).toBeVisible();

        await page.screenshot({ path: 'test-results/corporate-tax-return-submitted.png' });
      });
    });
  });

  test.describe('NIS Service Workflows', () => {
    test.describe('Monthly NIS Returns', () => {
      test('@critical should submit monthly NIS contributions', async () => {
        await page.goto('/nis/monthly-returns');

        // Create monthly NIS return
        await page.click('[data-testid="create-nis-return"]');

        // Enter employer details
        await page.fill('[data-testid="employer-number"]', testClient.employerRegNumber);
        await page.selectOption('[data-testid="contribution-month"]', '2024-01');

        // Enter employee contributions
        await page.click('[data-testid="add-employee-contribution"]');
        await page.fill('[data-testid="employee-nis-1"]', '654321');
        await page.fill('[data-testid="employee-salary-1"]', '85000.00');
        await page.fill('[data-testid="employee-contribution-1"]', '4420.00');
        await page.fill('[data-testid="employer-contribution-1"]', '6630.00');

        // Add more employees
        await page.click('[data-testid="add-employee-contribution"]');
        await page.fill('[data-testid="employee-nis-2"]', '789012');
        await page.fill('[data-testid="employee-salary-2"]', '95000.00');
        await page.fill('[data-testid="employee-contribution-2"]', '4940.00');
        await page.fill('[data-testid="employer-contribution-2"]', '7410.00');

        // Calculate totals
        await page.click('[data-testid="calculate-nis-totals"]');

        // Verify totals
        await expect(page.locator('[data-testid="total-employee-contributions"]')).toContainText('9,360.00');
        await expect(page.locator('[data-testid="total-employer-contributions"]')).toContainText('14,040.00');
        await expect(page.locator('[data-testid="total-nis-contributions"]')).toContainText('23,400.00');

        // Submit to NIS
        await page.click('[data-testid="submit-to-nis"]');

        // Confirm submission
        await page.click('[data-testid="confirm-nis-submission"]');

        // Verify submission
        await expect(page.locator('[data-testid="nis-submission-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="nis-reference-number"]')).toBeVisible();

        await page.screenshot({ path: 'test-results/nis-monthly-return-submitted.png' });
      });

      test('@regression should handle NIS contribution corrections', async () => {
        await page.goto('/nis/monthly-returns');

        // Select submitted return for correction
        await page.click('[data-testid="submitted-nis-return"]').first();

        // Initiate correction
        await page.click('[data-testid="correct-nis-return"]');

        // Enter correction reason
        await page.fill('[data-testid="correction-reason"]', 'Employee salary adjustment');

        // Correct contribution amounts
        await page.fill('[data-testid="corrected-employee-contribution"]', '4550.00');
        await page.fill('[data-testid="corrected-employer-contribution"]', '6825.00');

        // Calculate adjustment
        await page.click('[data-testid="calculate-adjustment"]');

        // Verify adjustment calculation
        await expect(page.locator('[data-testid="employee-adjustment"]')).toContainText('130.00');
        await expect(page.locator('[data-testid="employer-adjustment"]')).toContainText('195.00');

        // Submit correction
        await page.click('[data-testid="submit-correction"]');

        // Verify correction processed
        await expect(page.locator('[data-testid="correction-confirmation"]')).toBeVisible();
      });
    });

    test.describe('Annual NIS Returns', () => {
      test('@critical should submit annual NIS return', async () => {
        await page.goto('/nis/annual-returns');

        // Create annual return
        await page.click('[data-testid="create-annual-return"]');

        // Enter return details
        await page.fill('[data-testid="employer-number"]', testClient.employerRegNumber);
        await page.selectOption('[data-testid="return-year"]', '2024');

        // Import monthly return data
        await page.click('[data-testid="import-monthly-data"]');

        // Verify imported data
        await expect(page.locator('[data-testid="annual-summary"]')).toBeVisible();
        await expect(page.locator('[data-testid="total-annual-contributions"]')).toBeVisible();

        // Enter any additional annual adjustments
        await page.fill('[data-testid="annual-adjustments"]', '2500.00');
        await page.fill('[data-testid="adjustment-reason"]', 'Bonus payments in December');

        // Recalculate totals
        await page.click('[data-testid="recalculate-annual-totals"]');

        // Submit annual return
        await page.click('[data-testid="submit-annual-return"]');

        // Verify submission
        await expect(page.locator('[data-testid="annual-return-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="annual-return-reference"]')).toBeVisible();

        await page.screenshot({ path: 'test-results/nis-annual-return-submitted.png' });
      });
    });

    test.describe('NIS Registration', () => {
      test('@critical should register new employer with NIS', async () => {
        await page.goto('/nis/registration');

        // Start employer registration
        await page.click('[data-testid="register-new-employer"]');

        // Enter business details
        await page.fill('[data-testid="business-name"]', testClient.businessName);
        await page.fill('[data-testid="business-address"]', '123 Business Street, Georgetown');
        await page.fill('[data-testid="business-phone"]', '592-123-4567');
        await page.selectOption('[data-testid="business-type"]', 'Private Company');

        // Enter owner/director details
        await page.fill('[data-testid="owner-name"]', `${testClient.firstName} ${testClient.lastName}`);
        await page.fill('[data-testid="owner-address"]', '456 Owner Street, Georgetown');
        await page.fill('[data-testid="owner-nis-number"]', '123456789');

        // Upload required documents
        await page.setInputFiles('[data-testid="registration-documents"]', [
          {
            name: 'certificate-of-incorporation.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('Certificate of incorporation')
          },
          {
            name: 'business-license.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('Business license')
          }
        ]);

        // Submit registration
        await page.click('[data-testid="submit-nis-registration"]');

        // Verify registration submitted
        await expect(page.locator('[data-testid="registration-submitted"]')).toBeVisible();
        await expect(page.locator('[data-testid="application-reference"]')).toBeVisible();

        await page.screenshot({ path: 'test-results/nis-employer-registration.png' });
      });

      test('@regression should register new employee with NIS', async () => {
        await page.goto('/nis/employees');

        // Register new employee
        await page.click('[data-testid="register-employee"]');

        // Enter employee details
        await page.fill('[data-testid="employee-first-name"]', 'Sarah');
        await page.fill('[data-testid="employee-last-name"]', 'Johnson');
        await page.fill('[data-testid="employee-address"]', '789 Employee Street');
        await page.fill('[data-testid="employee-date-of-birth"]', '1990-05-15');
        await page.selectOption('[data-testid="employee-gender"]', 'Female');

        // Enter employment details
        await page.fill('[data-testid="employment-start-date"]', '2024-02-01');
        await page.fill('[data-testid="job-title"]', 'Accountant');
        await page.fill('[data-testid="monthly-salary"]', '85000.00');

        // Submit employee registration
        await page.click('[data-testid="submit-employee-registration"]');

        // Verify registration
        await expect(page.locator('[data-testid="employee-registration-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="new-nis-number"]')).toBeVisible();
      });
    });
  });

  test.describe('Compliance Deadline Tracking', () => {
    test('@critical should track and notify of upcoming deadlines', async () => {
      await page.goto('/compliance/deadlines');

      // Verify deadline dashboard
      await expect(page.locator('[data-testid="deadline-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="upcoming-deadlines"]')).toBeVisible();

      // Check critical deadlines (due within 3 days)
      const criticalDeadlines = page.locator('[data-testid="critical-deadline"]');
      const criticalCount = await criticalDeadlines.count();

      if (criticalCount > 0) {
        // Verify critical deadline information
        const firstCritical = criticalDeadlines.first();
        await expect(firstCritical.locator('[data-testid="deadline-type"]')).toBeVisible();
        await expect(firstCritical.locator('[data-testid="deadline-date"]')).toBeVisible();
        await expect(firstCritical.locator('[data-testid="client-name"]')).toBeVisible();
        await expect(firstCritical.locator('[data-testid="status-indicator"]')).toHaveClass(/critical/);
      }

      // Test deadline filtering
      await page.selectOption('[data-testid="deadline-filter"]', 'VAT Returns');
      await page.waitForTimeout(1000);

      // Verify only VAT deadlines are shown
      const filteredDeadlines = page.locator('[data-testid="deadline-item"]');
      const filteredCount = await filteredDeadlines.count();

      for (let i = 0; i < Math.min(filteredCount, 5); i++) {
        const deadlineType = await filteredDeadlines.nth(i).locator('[data-testid="deadline-type"]').textContent();
        expect(deadlineType).toContain('VAT');
      }

      await page.screenshot({ path: 'test-results/compliance-deadlines-tracked.png' });
    });

    test('@regression should send deadline notifications', async () => {
      await page.goto('/compliance/notifications');

      // Configure notification settings
      await page.fill('[data-testid="warning-days"]', '7');
      await page.fill('[data-testid="critical-days"]', '3');
      await page.check('[data-testid="email-notifications"]');
      await page.check('[data-testid="sms-notifications"]');

      // Save notification settings
      await page.click('[data-testid="save-notification-settings"]');

      // Test manual notification trigger
      await page.click('[data-testid="send-test-notification"]');

      // Verify notification sent
      await expect(page.locator('[data-testid="notification-sent-confirmation"]')).toBeVisible();

      // Check notification history
      await page.click('[data-testid="notification-history"]');
      await expect(page.locator('[data-testid="recent-notifications"]')).toBeVisible();

      // Verify recent notification entry
      const recentNotifications = page.locator('[data-testid="notification-entry"]');
      if (await recentNotifications.count() > 0) {
        const firstNotification = recentNotifications.first();
        await expect(firstNotification.locator('[data-testid="notification-timestamp"]')).toBeVisible();
        await expect(firstNotification.locator('[data-testid="notification-type"]')).toBeVisible();
        await expect(firstNotification.locator('[data-testid="notification-status"]')).toBeVisible();
      }
    });
  });

  test.describe('Document Digitization Workflows', () => {
    test('@critical should digitize physical documents for GRA submission', async () => {
      await page.goto('/document-digitization');

      // Start document digitization workflow
      await page.click('[data-testid="start-digitization"]');

      // Select document type
      await page.selectOption('[data-testid="document-category"]', 'Tax Documents');
      await page.selectOption('[data-testid="document-type"]', 'Purchase Invoices');

      // Configure scan settings
      await page.selectOption('[data-testid="scan-quality"]', 'High');
      await page.check('[data-testid="ocr-processing"]');
      await page.check('[data-testid="auto-categorization"]');

      // Simulate batch document upload
      await page.setInputFiles('[data-testid="document-batch-upload"]', [
        {
          name: 'invoice-001.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('Invoice 001 content')
        },
        {
          name: 'invoice-002.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('Invoice 002 content')
        },
        {
          name: 'receipt-001.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('Receipt 001 content')
        }
      ]);

      // Start processing
      await page.click('[data-testid="start-processing"]');

      // Wait for processing completion
      await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 60000 });

      // Verify processing results
      await expect(page.locator('[data-testid="documents-processed"]')).toContainText('3 documents');
      await expect(page.locator('[data-testid="ocr-success-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="auto-categorized-count"]')).toBeVisible();

      // Review and approve digitized documents
      await page.click('[data-testid="review-documents"]');

      // Verify document preview and metadata
      await expect(page.locator('[data-testid="document-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="extracted-data"]')).toBeVisible();
      await expect(page.locator('[data-testid="document-metadata"]')).toBeVisible();

      // Approve documents for GRA submission
      await page.check('[data-testid="approve-all-documents"]');
      await page.click('[data-testid="approve-for-submission"]');

      // Verify documents ready for submission
      await expect(page.locator('[data-testid="documents-approved"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/documents-digitized-and-approved.png' });
    });

    test('@regression should handle document quality issues', async () => {
      await page.goto('/document-digitization');

      // Upload low-quality document
      await page.setInputFiles('[data-testid="document-upload"]', {
        name: 'low-quality-scan.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Low quality document with poor scanning')
      });

      // Start processing
      await page.click('[data-testid="process-document"]');

      // Verify quality warning
      await expect(page.locator('[data-testid="quality-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="quality-score"]')).toContainText(/below threshold/i);

      // Test quality improvement options
      await page.click('[data-testid="improve-quality"]');
      await page.selectOption('[data-testid="enhancement-method"]', 'AI Enhancement');
      await page.click('[data-testid="apply-enhancement"]');

      // Verify enhancement results
      await page.waitForSelector('[data-testid="enhancement-complete"]', { timeout: 30000 });
      await expect(page.locator('[data-testid="improved-quality-score"]')).toBeVisible();

      // Test manual review workflow
      if (await page.locator('[data-testid="requires-manual-review"]').isVisible()) {
        await page.click('[data-testid="start-manual-review"]');
        await page.fill('[data-testid="manual-review-notes"]', 'Document enhanced but requires verification');
        await page.selectOption('[data-testid="review-action"]', 'Approve with Notes');
        await page.click('[data-testid="submit-review"]');

        await expect(page.locator('[data-testid="manual-review-complete"]')).toBeVisible();
      }
    });
  });

  test.describe('Integration Error Handling', () => {
    test('@negative should handle GRA system downtime', async () => {
      // This test would require mocking GRA API responses
      await page.goto('/gra/vat');

      // Create VAT return
      await page.click('[data-testid="create-vat-return"]');
      await page.selectOption('[data-testid="vat-client-select"]', { index: 1 });
      await page.selectOption('[data-testid="vat-period"]', '2024-Q1');
      await page.fill('[data-testid="standard-rated-supplies"]', '100000.00');
      await page.fill('[data-testid="input-vat-amount"]', '12000.00');

      // Mock GRA system error by intercepting the API call
      await page.route('**/api/gra/vat/submit', route => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'GRA system temporarily unavailable',
            code: 'SERVICE_UNAVAILABLE',
            retryAfter: 300
          })
        });
      });

      // Attempt submission
      await page.click('[data-testid="submit-to-gra"]');
      await page.click('[data-testid="confirm-gra-submission"]');

      // Verify error handling
      await expect(page.locator('[data-testid="gra-error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="gra-error-message"]')).toContainText(/temporarily unavailable/i);

      // Verify retry option
      await expect(page.locator('[data-testid="retry-submission"]')).toBeVisible();
      await expect(page.locator('[data-testid="queue-for-retry"]')).toBeVisible();

      // Test automatic queuing
      await page.click('[data-testid="queue-for-retry"]');
      await expect(page.locator('[data-testid="queued-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-schedule"]')).toContainText(/will retry in/i);
    });

    test('@negative should handle NIS connection errors', async () => {
      await page.goto('/nis/monthly-returns');

      // Create NIS return
      await page.click('[data-testid="create-nis-return"]');
      await page.fill('[data-testid="employer-number"]', '12345');
      await page.selectOption('[data-testid="contribution-month"]', '2024-01');

      // Mock NIS connection timeout
      await page.route('**/api/nis/submit', route => {
        route.abort('timedout');
      });

      // Attempt submission
      await page.click('[data-testid="submit-to-nis"]');
      await page.click('[data-testid="confirm-nis-submission"]');

      // Verify timeout handling
      await expect(page.locator('[data-testid="connection-timeout-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="timeout-recovery-options"]')).toBeVisible();

      // Test automatic retry mechanism
      await page.click('[data-testid="enable-auto-retry"]');
      await expect(page.locator('[data-testid="auto-retry-enabled"]')).toBeVisible();
    });
  });

  test.afterEach(async () => {
    // Cleanup: Clear any mocked routes
    await page.unrouteAll();
    // Return to dashboard
    await page.goto('/dashboard');
  });
});