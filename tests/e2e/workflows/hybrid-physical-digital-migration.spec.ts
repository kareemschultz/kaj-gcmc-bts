import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Hybrid Physical-to-Digital Migration Testing for GCMC-KAJ Platform
 *
 * Tests the digitization of traditional accounting practice workflows:
 * - Physical file cabinet replacement with intelligent digital organization
 * - Document scanning and OCR processing
 * - Legacy data migration workflows
 * - Hybrid workflow management during transition
 * - Client communication during migration
 * - Data integrity verification
 * - Backup and recovery processes
 */

test.describe('Hybrid Physical-to-Digital Migration Tests', () => {
  let page: Page;
  let migrationClient: any;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Login as admin user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
    await page.fill('[data-testid="password"]', 'SecureAdmin123!');
    await page.click('[data-testid="loginButton"]');
    await page.waitForURL('**/dashboard');

    migrationClient = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      businessName: faker.company.name(),
      accountNumber: faker.number.int({ min: 10000, max: 99999 }).toString(),
      physicalFiles: [
        'Tax Returns 2020-2023',
        'Bank Statements',
        'Purchase Invoices',
        'Sales Invoices',
        'Employment Records',
        'Correspondence',
        'Legal Documents',
        'Financial Statements'
      ]
    };
  });

  test.describe('Physical File Cabinet Digitization', () => {
    test('@smoke @critical should initiate file cabinet digitization project', async () => {
      await page.goto('/migration/file-cabinet-digitization');

      // Start new digitization project
      await page.click('[data-testid="start-digitization-project"]');

      // Enter client information
      await page.fill('[data-testid="client-name"]', `${migrationClient.firstName} ${migrationClient.lastName}`);
      await page.fill('[data-testid="business-name"]', migrationClient.businessName);
      await page.fill('[data-testid="account-number"]', migrationClient.accountNumber);

      // Inventory physical files
      await page.click('[data-testid="inventory-physical-files"]');

      for (const fileCategory of migrationClient.physicalFiles) {
        await page.click('[data-testid="add-file-category"]');
        await page.fill('[data-testid="file-category-name"]', fileCategory);

        // Estimate file volume
        const fileCount = faker.number.int({ min: 50, max: 500 });
        await page.fill('[data-testid="estimated-file-count"]', fileCount.toString());

        // Set priority level
        if (fileCategory.includes('Tax Returns') || fileCategory.includes('Financial')) {
          await page.selectOption('[data-testid="priority-level"]', 'High');
        } else if (fileCategory.includes('Legal') || fileCategory.includes('Employment')) {
          await page.selectOption('[data-testid="priority-level"]', 'Medium');
        } else {
          await page.selectOption('[data-testid="priority-level"]', 'Low');
        }

        await page.click('[data-testid="save-file-category"]');
      }

      // Configure digitization settings
      await page.selectOption('[data-testid="scan-quality"]', 'High Resolution');
      await page.check('[data-testid="enable-ocr"]');
      await page.check('[data-testid="auto-categorization"]');
      await page.check('[data-testid="duplicate-detection"]');

      // Set up digital organization structure
      await page.click('[data-testid="configure-digital-structure"]');

      // Create folder hierarchy
      await page.click('[data-testid="create-folder-structure"]');
      await page.selectOption('[data-testid="structure-template"]', 'Accounting Practice Standard');

      // Customize folder naming
      await page.fill('[data-testid="client-folder-prefix"]', 'CLIENT');
      await page.fill('[data-testid="year-format"]', 'YYYY');
      await page.check('[data-testid="include-document-type"]');

      // Save digitization project
      await page.click('[data-testid="save-digitization-project"]');

      // Verify project creation
      await expect(page.locator('[data-testid="project-created-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-id"]')).toBeVisible();
      await expect(page.locator('[data-testid="estimated-completion-date"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/file-cabinet-digitization-project-created.png' });
    });

    test('@regression should track digitization progress', async () => {
      // Navigate to existing digitization project
      await page.goto('/migration/projects');
      await page.click('[data-testid="active-project"]').first();

      // View project dashboard
      await expect(page.locator('[data-testid="project-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-overview"]')).toBeVisible();

      // Check progress metrics
      await expect(page.locator('[data-testid="total-files-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="scanned-files-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="processed-files-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="completion-percentage"]')).toBeVisible();

      // View detailed progress by category
      await page.click('[data-testid="view-category-progress"]');

      const categoryRows = page.locator('[data-testid="category-progress-row"]');
      const count = await categoryRows.count();

      for (let i = 0; i < count; i++) {
        const row = categoryRows.nth(i);
        await expect(row.locator('[data-testid="category-name"]')).toBeVisible();
        await expect(row.locator('[data-testid="category-progress"]')).toBeVisible();
        await expect(row.locator('[data-testid="category-status"]')).toBeVisible();
      }

      // Test progress filtering
      await page.selectOption('[data-testid="progress-filter"]', 'In Progress');
      await page.waitForTimeout(1000);

      const filteredRows = page.locator('[data-testid="category-progress-row"]');
      const filteredCount = await filteredRows.count();

      // Verify filtered results show only in-progress items
      for (let i = 0; i < Math.min(filteredCount, 3); i++) {
        const status = await filteredRows.nth(i).locator('[data-testid="category-status"]').textContent();
        expect(['In Progress', 'Processing', 'Scanning'].some(s => status?.includes(s))).toBeTruthy();
      }

      await page.screenshot({ path: 'test-results/digitization-progress-tracking.png' });
    });

    test('@critical should implement intelligent document organization', async () => {
      await page.goto('/migration/document-organization');

      // Configure intelligent organization rules
      await page.click('[data-testid="setup-organization-rules"]');

      // Create categorization rules
      await page.click('[data-testid="add-categorization-rule"]');
      await page.fill('[data-testid="rule-name"]', 'Tax Document Detection');
      await page.selectOption('[data-testid="detection-method"]', 'OCR + Keywords');
      await page.fill('[data-testid="keywords"]', 'tax return, income tax, vat return, assessment');
      await page.selectOption('[data-testid="target-category"]', 'Tax Documents');
      await page.selectOption('[data-testid="confidence-threshold"]', '85%');

      await page.click('[data-testid="save-rule"]');

      // Add more rules
      const organizationRules = [
        {
          name: 'Invoice Detection',
          keywords: 'invoice, bill, receipt, payment',
          category: 'Financial Documents',
          threshold: '90%'
        },
        {
          name: 'Bank Statement Detection',
          keywords: 'bank statement, transaction, balance',
          category: 'Banking Documents',
          threshold: '95%'
        },
        {
          name: 'Legal Document Detection',
          keywords: 'contract, agreement, legal, attorney',
          category: 'Legal Documents',
          threshold: '80%'
        }
      ];

      for (const rule of organizationRules) {
        await page.click('[data-testid="add-categorization-rule"]');
        await page.fill('[data-testid="rule-name"]', rule.name);
        await page.fill('[data-testid="keywords"]', rule.keywords);
        await page.selectOption('[data-testid="target-category"]', rule.category);
        await page.selectOption('[data-testid="confidence-threshold"]', rule.threshold);
        await page.click('[data-testid="save-rule"]');
      }

      // Configure automated filing structure
      await page.click('[data-testid="setup-automated-filing"]');

      // Set up date-based organization
      await page.check('[data-testid="organize-by-date"]');
      await page.selectOption('[data-testid="date-grouping"]', 'Year/Month');

      // Set up client-based organization
      await page.check('[data-testid="organize-by-client"]');
      await page.fill('[data-testid="client-folder-pattern"]', 'CLIENT-{clientId}-{businessName}');

      // Set up document type organization
      await page.check('[data-testid="organize-by-type"]');
      await page.selectOption('[data-testid="type-hierarchy"]', 'Category/Subcategory/Type');

      // Enable cross-referencing
      await page.check('[data-testid="enable-cross-referencing"]');
      await page.check('[data-testid="create-document-relationships"]');

      // Save organization configuration
      await page.click('[data-testid="save-organization-config"]');

      // Test organization preview
      await page.click('[data-testid="preview-organization"]');

      // Verify organization structure preview
      await expect(page.locator('[data-testid="organization-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="sample-folder-structure"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/intelligent-document-organization.png' });
    });
  });

  test.describe('Document Scanning and OCR Processing', () => {
    test('@critical should process batch document scanning', async () => {
      await page.goto('/migration/document-scanning');

      // Start batch scanning session
      await page.click('[data-testid="start-batch-scan"]');

      // Configure scanning settings
      await page.selectOption('[data-testid="scanner-resolution"]', '600 DPI');
      await page.selectOption('[data-testid="color-mode"]', 'Color');
      await page.check('[data-testid="auto-rotate"]');
      await page.check('[data-testid="remove-blank-pages"]');

      // Simulate scanning multiple documents
      const documentBatch = [
        { name: 'tax-return-2023.pdf', type: 'Tax Return', pages: 15 },
        { name: 'invoice-batch-jan-2024.pdf', type: 'Invoices', pages: 45 },
        { name: 'bank-statements-q1-2024.pdf', type: 'Bank Statements', pages: 30 },
        { name: 'employment-contracts.pdf', type: 'Legal Documents', pages: 25 }
      ];

      for (const doc of documentBatch) {
        // Simulate document scan
        await page.click('[data-testid="scan-document"]');

        // Set document metadata
        await page.fill('[data-testid="document-name"]', doc.name);
        await page.selectOption('[data-testid="document-type"]', doc.type);
        await page.fill('[data-testid="page-count"]', doc.pages.toString());

        // Start scanning process
        await page.click('[data-testid="start-scan"]');

        // Monitor scan progress
        await page.waitForSelector('[data-testid="scan-progress"]');

        // Simulate scan completion
        await page.waitForSelector('[data-testid="scan-complete"]', { timeout: 10000 });

        await page.click('[data-testid="add-to-batch"]');
      }

      // Review scanned batch
      await page.click('[data-testid="review-scanned-batch"]');

      // Verify all documents in batch
      const scannedDocs = page.locator('[data-testid="scanned-document-item"]');
      await expect(scannedDocs).toHaveCount(documentBatch.length);

      // Check document quality
      for (let i = 0; i < documentBatch.length; i++) {
        const docItem = scannedDocs.nth(i);
        await expect(docItem.locator('[data-testid="quality-score"]')).toBeVisible();
        await expect(docItem.locator('[data-testid="page-count"]')).toContainText(documentBatch[i].pages.toString());
      }

      // Submit batch for OCR processing
      await page.click('[data-testid="submit-for-ocr"]');

      await expect(page.locator('[data-testid="batch-submitted-success"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/batch-document-scanning.png' });
    });

    test('@regression should perform OCR processing and validation', async () => {
      await page.goto('/migration/ocr-processing');

      // View OCR queue
      await expect(page.locator('[data-testid="ocr-queue"]')).toBeVisible();

      // Select document for OCR processing
      await page.click('[data-testid="ocr-document-item"]').first();

      // Configure OCR settings
      await page.selectOption('[data-testid="ocr-language"]', 'English');
      await page.selectOption('[data-testid="ocr-accuracy"]', 'High');
      await page.check('[data-testid="preserve-formatting"]');
      await page.check('[data-testid="detect-tables"]');

      // Start OCR processing
      await page.click('[data-testid="start-ocr-processing"]');

      // Monitor OCR progress
      await page.waitForSelector('[data-testid="ocr-progress-indicator"]');

      // Wait for OCR completion
      await page.waitForSelector('[data-testid="ocr-complete"]', { timeout: 30000 });

      // Review OCR results
      await page.click('[data-testid="review-ocr-results"]');

      // Verify OCR output
      await expect(page.locator('[data-testid="extracted-text"]')).toBeVisible();
      await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="detected-fields"]')).toBeVisible();

      // Validate extracted data
      await page.click('[data-testid="validate-extracted-data"]');

      // Check specific fields
      const detectedFields = page.locator('[data-testid="detected-field"]');
      const fieldCount = await detectedFields.count();

      for (let i = 0; i < Math.min(fieldCount, 5); i++) {
        const field = detectedFields.nth(i);
        await expect(field.locator('[data-testid="field-name"]')).toBeVisible();
        await expect(field.locator('[data-testid="field-value"]')).toBeVisible();
        await expect(field.locator('[data-testid="confidence-level"]')).toBeVisible();

        // Verify or correct field if needed
        const confidence = await field.locator('[data-testid="confidence-level"]').textContent();
        const confidenceValue = parseInt(confidence?.replace('%', '') || '0');

        if (confidenceValue < 90) {
          await field.locator('[data-testid="verify-field"]').click();
          // Manual verification would happen here
        }
      }

      // Approve OCR results
      await page.click('[data-testid="approve-ocr-results"]');

      await expect(page.locator('[data-testid="ocr-approved-success"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/ocr-processing-validation.png' });
    });

    test('@critical should implement quality assurance for digitized documents', async () => {
      await page.goto('/migration/quality-assurance');

      // Review documents pending QA
      await expect(page.locator('[data-testid="qa-queue"]')).toBeVisible();

      // Select document for quality review
      await page.click('[data-testid="qa-document-item"]').first();

      // Perform quality checks
      await page.click('[data-testid="start-quality-review"]');

      // Check image quality
      await expect(page.locator('[data-testid="image-quality-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="readability-score"]')).toBeVisible();

      // Verify completeness
      await page.check('[data-testid="all-pages-present"]');
      await page.check('[data-testid="no-missing-content"]');
      await page.check('[data-testid="proper-orientation"]');

      // Check OCR accuracy
      await page.click('[data-testid="verify-ocr-accuracy"]');

      // Sample text verification
      const sampleTexts = page.locator('[data-testid="sample-text-verification"]');
      const sampleCount = await sampleTexts.count();

      for (let i = 0; i < Math.min(sampleCount, 3); i++) {
        const sample = sampleTexts.nth(i);
        await expect(sample.locator('[data-testid="original-text"]')).toBeVisible();
        await expect(sample.locator('[data-testid="ocr-text"]')).toBeVisible();

        // Mark as correct or flag for correction
        await sample.locator('[data-testid="mark-correct"]').click();
      }

      // Verify metadata accuracy
      await page.click('[data-testid="verify-metadata"]');

      await page.fill('[data-testid="document-date"]', '2024-01-15');
      await page.selectOption('[data-testid="document-category"]', 'Tax Documents');
      await page.fill('[data-testid="client-reference"]', migrationClient.accountNumber);

      // Check for sensitive data
      await page.click('[data-testid="scan-for-sensitive-data"]');
      await page.waitForSelector('[data-testid="sensitive-data-scan-complete"]');

      // Review any flagged sensitive data
      const sensitiveDataFlags = page.locator('[data-testid="sensitive-data-flag"]');
      const flagCount = await sensitiveDataFlags.count();

      if (flagCount > 0) {
        for (let i = 0; i < flagCount; i++) {
          const flag = sensitiveDataFlags.nth(i);
          await expect(flag.locator('[data-testid="data-type"]')).toBeVisible();
          await expect(flag.locator('[data-testid="location"]')).toBeVisible();

          // Decide on redaction
          await flag.locator('[data-testid="apply-redaction"]').click();
        }
      }

      // Complete quality assurance
      await page.click('[data-testid="approve-document-quality"]');

      await expect(page.locator('[data-testid="qa-approved-success"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/document-quality-assurance.png' });
    });
  });

  test.describe('Legacy Data Migration', () => {
    test('@critical should migrate legacy accounting software data', async () => {
      await page.goto('/migration/legacy-data');

      // Start legacy data migration
      await page.click('[data-testid="start-legacy-migration"]');

      // Select legacy system type
      await page.selectOption('[data-testid="legacy-system-type"]', 'QuickBooks Desktop');

      // Configure data source
      await page.fill('[data-testid="legacy-database-path"]', 'C:\\QuickBooks\\Company Files\\GCMCClient.qbw');
      await page.fill('[data-testid="data-date-range-start"]', '2020-01-01');
      await page.fill('[data-testid="data-date-range-end"]', '2024-01-31');

      // Select data types to migrate
      await page.check('[data-testid="migrate-chart-of-accounts"]');
      await page.check('[data-testid="migrate-customer-data"]');
      await page.check('[data-testid="migrate-vendor-data"]');
      await page.check('[data-testid="migrate-transactions"]');
      await page.check('[data-testid="migrate-reports"]');

      // Configure data mapping
      await page.click('[data-testid="configure-data-mapping"]');

      // Map customer fields
      await page.selectOption('[data-testid="map-customer-name"]', 'Full Name');
      await page.selectOption('[data-testid="map-customer-email"]', 'Email Address');
      await page.selectOption('[data-testid="map-customer-phone"]', 'Phone Number');
      await page.selectOption('[data-testid="map-customer-address"]', 'Billing Address');

      // Map transaction fields
      await page.selectOption('[data-testid="map-transaction-date"]', 'Date');
      await page.selectOption('[data-testid="map-transaction-amount"]', 'Amount');
      await page.selectOption('[data-testid="map-transaction-description"]', 'Memo');
      await page.selectOption('[data-testid="map-transaction-account"]', 'Account');

      // Set up data transformation rules
      await page.click('[data-testid="setup-transformation-rules"]');

      // Configure date format transformation
      await page.selectOption('[data-testid="source-date-format"]', 'MM/DD/YYYY');
      await page.selectOption('[data-testid="target-date-format"]', 'YYYY-MM-DD');

      // Configure currency transformation
      await page.selectOption('[data-testid="source-currency"]', 'USD');
      await page.selectOption('[data-testid="target-currency"]', 'GYD');
      await page.fill('[data-testid="exchange-rate"]', '210.00');

      // Save migration configuration
      await page.click('[data-testid="save-migration-config"]');

      // Start data extraction
      await page.click('[data-testid="start-data-extraction"]');

      // Monitor extraction progress
      await page.waitForSelector('[data-testid="extraction-progress"]');

      // Wait for extraction completion
      await page.waitForSelector('[data-testid="extraction-complete"]', { timeout: 60000 });

      // Review extracted data
      await page.click('[data-testid="review-extracted-data"]');

      // Verify data summary
      await expect(page.locator('[data-testid="extracted-customers-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="extracted-transactions-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="extracted-accounts-count"]')).toBeVisible();

      // Check for data quality issues
      await page.click('[data-testid="check-data-quality"]');

      // Review any data quality warnings
      const qualityWarnings = page.locator('[data-testid="data-quality-warning"]');
      const warningCount = await qualityWarnings.count();

      if (warningCount > 0) {
        for (let i = 0; i < Math.min(warningCount, 3); i++) {
          const warning = qualityWarnings.nth(i);
          await expect(warning.locator('[data-testid="warning-type"]')).toBeVisible();
          await expect(warning.locator('[data-testid="affected-records"]')).toBeVisible();

          // Resolve warning if possible
          await warning.locator('[data-testid="resolve-warning"]').click();
        }
      }

      // Approve data for import
      await page.click('[data-testid="approve-data-import"]');

      await expect(page.locator('[data-testid="migration-approved-success"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/legacy-data-migration.png' });
    });

    test('@regression should handle legacy data conflicts and duplicates', async () => {
      await page.goto('/migration/data-conflicts');

      // View conflict resolution queue
      await expect(page.locator('[data-testid="conflict-resolution-queue"]')).toBeVisible();

      // Handle duplicate customers
      await page.click('[data-testid="resolve-customer-duplicates"]');

      const duplicateGroups = page.locator('[data-testid="duplicate-group"]');
      const groupCount = await duplicateGroups.count();

      for (let i = 0; i < Math.min(groupCount, 2); i++) {
        const group = duplicateGroups.nth(i);

        // Review duplicate records
        await group.locator('[data-testid="review-duplicates"]').click();

        // Select merge strategy
        await group.locator('[data-testid="merge-strategy"]').selectOption('Combine Records');

        // Choose primary record
        await group.locator('[data-testid="primary-record"]').first().check();

        // Configure field merging
        await group.locator('[data-testid="merge-email"]').check();
        await group.locator('[data-testid="merge-phone"]').check();
        await group.locator('[data-testid="merge-address"]').check();

        // Execute merge
        await group.locator('[data-testid="execute-merge"]').click();

        await expect(group.locator('[data-testid="merge-success"]')).toBeVisible();
      }

      // Handle account mapping conflicts
      await page.click('[data-testid="resolve-account-conflicts"]');

      const accountConflicts = page.locator('[data-testid="account-conflict"]');
      const conflictCount = await accountConflicts.count();

      for (let i = 0; i < Math.min(conflictCount, 3); i++) {
        const conflict = accountConflicts.nth(i);

        // View conflict details
        await expect(conflict.locator('[data-testid="legacy-account-name"]')).toBeVisible();
        await expect(conflict.locator('[data-testid="suggested-mapping"]')).toBeVisible();

        // Accept or modify mapping
        await conflict.locator('[data-testid="accept-mapping"]').click();
      }

      // Validate all conflicts resolved
      await page.click('[data-testid="validate-conflict-resolution"]');

      await expect(page.locator('[data-testid="conflicts-resolved-success"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/legacy-data-conflict-resolution.png' });
    });
  });

  test.describe('Hybrid Workflow Management', () => {
    test('@critical should manage parallel physical and digital workflows', async () => {
      await page.goto('/workflows/hybrid-management');

      // Set up hybrid workflow for tax season
      await page.click('[data-testid="create-hybrid-workflow"]');

      // Configure workflow details
      await page.fill('[data-testid="workflow-name"]', 'Tax Season 2024 Hybrid Process');
      await page.selectOption('[data-testid="workflow-type"]', 'Tax Preparation');
      await page.fill('[data-testid="start-date"]', '2024-02-01');
      await page.fill('[data-testid="end-date"]', '2024-04-30');

      // Define physical process steps
      await page.click('[data-testid="add-physical-steps"]');

      const physicalSteps = [
        'Collect physical tax documents from clients',
        'Sort documents by client and category',
        'Schedule document scanning sessions',
        'Prepare physical backup storage'
      ];

      for (const step of physicalSteps) {
        await page.click('[data-testid="add-step"]');
        await page.fill('[data-testid="step-name"]', step);
        await page.selectOption('[data-testid="step-type"]', 'Physical');
        await page.fill('[data-testid="estimated-duration"]', '30');
        await page.click('[data-testid="save-step"]');
      }

      // Define digital process steps
      await page.click('[data-testid="add-digital-steps"]');

      const digitalSteps = [
        'Scan and OCR physical documents',
        'Verify digital document quality',
        'Extract tax information using AI',
        'Prepare electronic tax returns',
        'Submit returns digitally to GRA'
      ];

      for (const step of digitalSteps) {
        await page.click('[data-testid="add-step"]');
        await page.fill('[data-testid="step-name"]', step);
        await page.selectOption('[data-testid="step-type"]', 'Digital');
        await page.fill('[data-testid="estimated-duration"]', '45');
        await page.click('[data-testid="save-step"]');
      }

      // Configure workflow dependencies
      await page.click('[data-testid="configure-dependencies"]');

      // Set up step dependencies
      await page.selectOption('[data-testid="dependent-step"]', 'Scan and OCR physical documents');
      await page.selectOption('[data-testid="prerequisite-step"]', 'Collect physical tax documents from clients');
      await page.click('[data-testid="add-dependency"]');

      // Configure parallel execution
      await page.check('[data-testid="enable-parallel-execution"]');
      await page.fill('[data-testid="max-parallel-clients"]', '5');

      // Set up progress tracking
      await page.check('[data-testid="track-physical-progress"]');
      await page.check('[data-testid="track-digital-progress"]');
      await page.check('[data-testid="automated-status-updates"]');

      // Save hybrid workflow
      await page.click('[data-testid="save-hybrid-workflow"]');

      await expect(page.locator('[data-testid="workflow-created-success"]')).toBeVisible();

      // Test workflow execution
      await page.click('[data-testid="start-workflow"]');

      // Verify workflow dashboard
      await expect(page.locator('[data-testid="workflow-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="physical-progress-tracker"]')).toBeVisible();
      await expect(page.locator('[data-testid="digital-progress-tracker"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/hybrid-workflow-management.png' });
    });

    test('@regression should coordinate physical and digital handoffs', async () => {
      await page.goto('/workflows/handoff-coordination');

      // View active handoff points
      await expect(page.locator('[data-testid="handoff-queue"]')).toBeVisible();

      // Process physical-to-digital handoff
      await page.click('[data-testid="physical-to-digital-handoff"]').first();

      // Verify physical completion
      await page.check('[data-testid="physical-documents-collected"]');
      await page.check('[data-testid="documents-sorted-organized"]');
      await page.check('[data-testid="quality-check-passed"]');

      // Document handoff details
      await page.fill('[data-testid="handoff-notes"]', 'Tax documents for 15 clients ready for scanning. Priority clients flagged.');
      await page.fill('[data-testid="document-count"]', '450');
      await page.selectOption('[data-testid="priority-level"]', 'High');

      // Assign to digital team
      await page.selectOption('[data-testid="assigned-scanner"]', 'Digital Processing Team A');
      await page.fill('[data-testid="expected-completion"]', '2024-02-15');

      // Complete handoff
      await page.click('[data-testid="complete-handoff"]');

      // Verify handoff recorded
      await expect(page.locator('[data-testid="handoff-completed-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="tracking-number"]')).toBeVisible();

      // Monitor digital processing
      await page.click('[data-testid="monitor-digital-processing"]');

      await expect(page.locator('[data-testid="scanning-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="ocr-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="quality-assurance-progress"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/physical-digital-handoff.png' });
    });
  });

  test.describe('Client Communication During Migration', () => {
    test('@critical should manage client migration communication', async () => {
      await page.goto('/migration/client-communication');

      // Set up migration communication plan
      await page.click('[data-testid="create-communication-plan"]');

      // Configure client notification settings
      await page.fill('[data-testid="migration-start-date"]', '2024-02-01');
      await page.fill('[data-testid="expected-completion"]', '2024-04-30');

      // Set up notification schedule
      await page.check('[data-testid="pre-migration-notice"]');
      await page.fill('[data-testid="pre-migration-days"]', '14');

      await page.check('[data-testid="weekly-progress-updates"]');
      await page.check('[data-testid="completion-notification"]');
      await page.check('[data-testid="access-instructions"]');

      // Configure communication channels
      await page.check('[data-testid="email-notifications"]');
      await page.check('[data-testid="sms-updates"]');
      await page.check('[data-testid="client-portal-messages"]');

      // Create migration FAQ
      await page.click('[data-testid="create-migration-faq"]');

      const faqItems = [
        {
          question: 'What happens to my physical documents?',
          answer: 'Physical documents are scanned and digitized. Originals are securely stored and can be returned upon request.'
        },
        {
          question: 'How long will the migration take?',
          answer: 'The migration process typically takes 2-3 months depending on the volume of documents.'
        },
        {
          question: 'Will I be able to access my documents during migration?',
          answer: 'Yes, documents are made available in our digital portal as soon as they are processed.'
        }
      ];

      for (const faq of faqItems) {
        await page.click('[data-testid="add-faq-item"]');
        await page.fill('[data-testid="faq-question"]', faq.question);
        await page.fill('[data-testid="faq-answer"]', faq.answer);
        await page.click('[data-testid="save-faq-item"]');
      }

      // Send initial migration notice
      await page.click('[data-testid="send-initial-notice"]');

      // Select clients for notification
      await page.click('[data-testid="select-all-migration-clients"]');

      // Customize message
      await page.fill('[data-testid="notification-message"]', `
        Dear Valued Client,

        We are excited to inform you that we will be transitioning to a fully digital document management system to better serve you. This migration will begin on February 1st, 2024, and is expected to complete by April 30th, 2024.

        Benefits of this transition include:
        - Faster access to your documents
        - Enhanced security and backup
        - Improved collaboration capabilities
        - Reduced environmental impact

        We will keep you informed throughout the process. If you have any questions, please don't hesitate to contact us.

        Best regards,
        GCMC-KAJ Team
      `);

      // Send notifications
      await page.click('[data-testid="send-notifications"]');

      await expect(page.locator('[data-testid="notifications-sent-success"]')).toBeVisible();

      // Track communication metrics
      await page.click('[data-testid="view-communication-metrics"]');

      await expect(page.locator('[data-testid="emails-sent"]')).toBeVisible();
      await expect(page.locator('[data-testid="emails-opened"]')).toBeVisible();
      await expect(page.locator('[data-testid="client-responses"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/client-migration-communication.png' });
    });

    test('@regression should handle client feedback and concerns', async () => {
      await page.goto('/migration/client-feedback');

      // View client feedback queue
      await expect(page.locator('[data-testid="feedback-queue"]')).toBeVisible();

      // Process client concern
      await page.click('[data-testid="feedback-item"]').first();

      // Review feedback details
      await expect(page.locator('[data-testid="client-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="feedback-type"]')).toBeVisible();
      await expect(page.locator('[data-testid="feedback-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="urgency-level"]')).toBeVisible();

      // Categorize feedback
      await page.selectOption('[data-testid="feedback-category"]', 'Document Access Concern');

      // Assign to team member
      await page.selectOption('[data-testid="assigned-to"]', 'Migration Support Team');

      // Add response
      await page.fill('[data-testid="response-message"]', `
        Thank you for your concern regarding document access during migration.

        I want to assure you that:
        1. Your documents will be accessible throughout the migration process
        2. We provide temporary access methods if needed
        3. Our team is available to assist with any access issues

        I will personally ensure your documents are prioritized in our processing queue.

        Please let me know if you have any other concerns.
      `);

      // Set follow-up reminder
      await page.check('[data-testid="set-follow-up"]');
      await page.fill('[data-testid="follow-up-date"]', '2024-02-15');

      // Send response
      await page.click('[data-testid="send-response"]');

      await expect(page.locator('[data-testid="response-sent-success"]')).toBeVisible();

      // Update feedback status
      await page.selectOption('[data-testid="feedback-status"]', 'Resolved');
      await page.click('[data-testid="save-feedback-status"]');

      await page.screenshot({ path: 'test-results/client-feedback-handling.png' });
    });
  });

  test.describe('Data Integrity Verification', () => {
    test('@critical should verify data integrity post-migration', async () => {
      await page.goto('/migration/data-integrity');

      // Start comprehensive data integrity check
      await page.click('[data-testid="start-integrity-check"]');

      // Configure integrity verification
      await page.check('[data-testid="verify-document-count"]');
      await page.check('[data-testid="verify-file-checksums"]');
      await page.check('[data-testid="verify-metadata-accuracy"]');
      await page.check('[data-testid="verify-ocr-quality"]');
      await page.check('[data-testid="verify-data-relationships"]');

      // Set verification scope
      await page.selectOption('[data-testid="verification-scope"]', 'Full Migration');
      await page.fill('[data-testid="sample-percentage"]', '100');

      // Start verification process
      await page.click('[data-testid="run-verification"]');

      // Monitor verification progress
      await page.waitForSelector('[data-testid="verification-progress"]');

      // Wait for completion
      await page.waitForSelector('[data-testid="verification-complete"]', { timeout: 120000 });

      // Review verification results
      await page.click('[data-testid="view-verification-results"]');

      // Check document count verification
      await expect(page.locator('[data-testid="document-count-status"]')).toContainText('PASS');
      await expect(page.locator('[data-testid="expected-documents"]')).toBeVisible();
      await expect(page.locator('[data-testid="migrated-documents"]')).toBeVisible();

      // Check file integrity
      await expect(page.locator('[data-testid="checksum-verification-status"]')).toContainText('PASS');
      await expect(page.locator('[data-testid="corrupted-files-count"]')).toContainText('0');

      // Check metadata accuracy
      await expect(page.locator('[data-testid="metadata-accuracy-score"]')).toBeVisible();

      const metadataScore = await page.locator('[data-testid="metadata-accuracy-percentage"]').textContent();
      const score = parseInt(metadataScore?.replace('%', '') || '0');
      expect(score).toBeGreaterThan(95); // 95%+ accuracy required

      // Check OCR quality
      await expect(page.locator('[data-testid="ocr-quality-score"]')).toBeVisible();

      // Review any integrity issues
      const integrityIssues = page.locator('[data-testid="integrity-issue"]');
      const issueCount = await integrityIssues.count();

      if (issueCount > 0) {
        // Log issues for investigation
        for (let i = 0; i < issueCount; i++) {
          const issue = integrityIssues.nth(i);
          const issueType = await issue.locator('[data-testid="issue-type"]').textContent();
          const issueDescription = await issue.locator('[data-testid="issue-description"]').textContent();
          console.log(`Integrity Issue: ${issueType} - ${issueDescription}`);

          // Mark for resolution if critical
          const severity = await issue.locator('[data-testid="issue-severity"]').textContent();
          if (severity === 'Critical') {
            await issue.locator('[data-testid="escalate-issue"]').click();
          }
        }
      }

      // Generate integrity report
      await page.click('[data-testid="generate-integrity-report"]');

      await expect(page.locator('[data-testid="report-generated-success"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/data-integrity-verification.png' });
    });

    test('@regression should validate migrated financial data accuracy', async () => {
      await page.goto('/migration/financial-data-validation');

      // Select validation period
      await page.fill('[data-testid="validation-start-date"]', '2023-01-01');
      await page.fill('[data-testid="validation-end-date"]', '2023-12-31');

      // Configure financial validation tests
      await page.check('[data-testid="validate-trial-balance"]');
      await page.check('[data-testid="validate-transaction-totals"]');
      await page.check('[data-testid="validate-account-balances"]');
      await page.check('[data-testid="validate-tax-calculations"]');

      // Run financial validation
      await page.click('[data-testid="run-financial-validation"]');

      // Wait for validation completion
      await page.waitForSelector('[data-testid="financial-validation-complete"]', { timeout: 60000 });

      // Review validation results
      await expect(page.locator('[data-testid="trial-balance-validation"]')).toContainText('BALANCED');
      await expect(page.locator('[data-testid="transaction-total-validation"]')).toContainText('MATCHED');

      // Check for discrepancies
      const discrepancies = page.locator('[data-testid="financial-discrepancy"]');
      const discrepancyCount = await discrepancies.count();

      if (discrepancyCount > 0) {
        for (let i = 0; i < discrepancyCount; i++) {
          const discrepancy = discrepancies.nth(i);
          await expect(discrepancy.locator('[data-testid="discrepancy-amount"]')).toBeVisible();
          await expect(discrepancy.locator('[data-testid="discrepancy-account"]')).toBeVisible();

          // Investigate discrepancy
          await discrepancy.locator('[data-testid="investigate-discrepancy"]').click();
        }
      }

      // Approve financial validation
      await page.click('[data-testid="approve-financial-validation"]');

      await expect(page.locator('[data-testid="validation-approved-success"]')).toBeVisible();

      await page.screenshot({ path: 'test-results/financial-data-validation.png' });
    });
  });

  test.afterEach(async () => {
    // Return to dashboard
    await page.goto('/dashboard');
  });
});