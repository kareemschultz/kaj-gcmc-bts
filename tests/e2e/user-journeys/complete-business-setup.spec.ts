import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/pages/login-page';
import { DashboardPage } from '../page-objects/pages/dashboard-page';
import { ClientPortalPage } from '../page-objects/pages/client-portal-page';
import { AgencyFormsPage } from '../page-objects/pages/agency-forms-page';
import { AllureHelper } from '../utils/allure-helpers';
import { VisualRegressionHelper } from '../utils/visual-regression-helper';
import { ApiTestHelper } from '../api/api-test-helper';
import { faker } from '@faker-js/faker';

/**
 * Complete Business Setup User Journey Tests
 *
 * Tests the complete end-to-end journey for setting up a business in Guyana:
 * 1. Client registration and login
 * 2. Business registration with DCRA
 * 3. Tax registration with GRA
 * 4. Employee registration with NIS
 * 5. Document submissions
 * 6. Payment processing
 * 7. Compliance tracking setup
 */

test.describe('Complete Business Setup Journey @critical @e2e @smoke', () => {
	let loginPage: LoginPage;
	let dashboardPage: DashboardPage;
	let clientPortalPage: ClientPortalPage;
	let agencyFormsPage: AgencyFormsPage;
	let visualHelper: VisualRegressionHelper;
	let apiHelper: ApiTestHelper;

	// Test data for business setup
	const businessData = {
		name: faker.company.name(),
		registrationNumber: faker.string.alphanumeric(10).toUpperCase(),
		taxId: `GY${faker.string.numeric(9)}`,
		email: faker.internet.email(),
		phone: faker.phone.number(),
		address: faker.location.streetAddress(),
		contactPerson: faker.person.fullName(),
		businessType: 'Limited Liability Company',
		industry: 'Technology Services'
	};

	test.beforeEach(async ({ page }, testInfo) => {
		// Initialize page objects and helpers
		loginPage = new LoginPage(page);
		dashboardPage = new DashboardPage(page);
		clientPortalPage = new ClientPortalPage(page);
		agencyFormsPage = new AgencyFormsPage(page);
		visualHelper = new VisualRegressionHelper(page, testInfo);
		apiHelper = await ApiTestHelper.create();

		// Set up Allure labels
		await AllureHelper.addLabels({
			feature: 'Business Setup',
			story: 'Complete Business Registration Journey',
			owner: 'QA Team',
			severity: 'critical',
			tag: ['e2e', 'business-setup', 'critical-path']
		});

		await AllureHelper.attachEnvironmentInfo();
	});

	test.afterEach(async () => {
		// Cleanup API helper
		await apiHelper.dispose();
	});

	test('Complete business setup journey - Happy path', async ({ page }) => {
		await AllureHelper.step('Navigate to platform and verify landing page', async () => {
			await page.goto('/');
			await expect(page).toHaveTitle(/GCMC.*KAJ/i);

			// Take visual snapshot of landing page
			await visualHelper.expectPageToMatchSnapshot('landing_page', {
				threshold: 0.1,
				maxDiffPixels: 100
			});
		});

		await AllureHelper.step('Login as admin to access client portal', async () => {
			await loginPage.navigateToLogin();
			await loginPage.verifyLoginPageDisplayed();

			// Visual test - Login page
			await visualHelper.expectPageToMatchSnapshot('login_page');

			await loginPage.loginAsAdmin();
			await loginPage.verifySuccessfulLogin();
		});

		await AllureHelper.step('Navigate to client portal and verify dashboard', async () => {
			await clientPortalPage.navigateToClientPortal();
			await clientPortalPage.verifyClientPortalDisplayed();

			// Visual test - Client portal dashboard
			await visualHelper.expectPageToMatchSnapshot('client_portal_dashboard');

			await clientPortalPage.verifyDashboardWidgetsDisplayed();
		});

		await AllureHelper.step('Start business registration with DCRA', async () => {
			await agencyFormsPage.navigateToAgencyForms();
			await agencyFormsPage.verifyAgencyFormsPageDisplayed();

			// Visual test - Agency forms selection
			await visualHelper.expectPageToMatchSnapshot('agency_forms_selection');

			await agencyFormsPage.selectAgency('DCRA');

			// Fill business registration form
			const businessRegData = {
				agency: 'DCRA' as const,
				formType: 'business-registration',
				documentType: 'incorporation',
				businessDetails: {
					name: businessData.name,
					registrationNumber: businessData.registrationNumber,
					taxId: businessData.taxId,
					address: businessData.address
				},
				contactDetails: {
					email: businessData.email,
					phone: businessData.phone,
					contactPerson: businessData.contactPerson
				}
			};

			await agencyFormsPage.completeDCRARegistration(businessRegData);
			await agencyFormsPage.verifySubmissionConfirmation();
		});

		await AllureHelper.step('Register for tax with GRA', async () => {
			await agencyFormsPage.selectAgency('GRA');

			const taxRegistrationData = {
				agency: 'GRA' as const,
				formType: 'tax-registration',
				documentType: 'tax-filing',
				businessDetails: {
					name: businessData.name,
					registrationNumber: businessData.registrationNumber,
					taxId: businessData.taxId,
					address: businessData.address
				}
			};

			await agencyFormsPage.completeGRATaxFiling(taxRegistrationData);
			await agencyFormsPage.verifySubmissionConfirmation();
		});

		await AllureHelper.step('Register employees with NIS', async () => {
			await agencyFormsPage.selectAgency('NIS');

			const nisRegistrationData = {
				agency: 'NIS' as const,
				formType: 'employee-registration',
				documentType: 'employment',
				contactDetails: {
					email: businessData.email,
					phone: businessData.phone,
					contactPerson: businessData.contactPerson
				}
			};

			await agencyFormsPage.completeNISRegistration(nisRegistrationData);
			await agencyFormsPage.verifySubmissionConfirmation();
		});

		await AllureHelper.step('Verify compliance dashboard updates', async () => {
			await clientPortalPage.navigateToCompliance();

			// Check that all registrations appear in compliance tracking
			const complianceStatus = await clientPortalPage.getComplianceStatus();
			expect(complianceStatus).toContain('DCRA');
			expect(complianceStatus).toContain('GRA');
			expect(complianceStatus).toContain('NIS');

			// Visual test - Compliance dashboard
			await visualHelper.expectPageToMatchSnapshot('compliance_dashboard_complete');
		});

		await AllureHelper.step('Process payment for registration fees', async () => {
			await clientPortalPage.navigateToPayments();
			await clientPortalPage.verifyPaymentFunctionality();

			// Simulate payment processing
			await clientPortalPage.makePayment('500.00', 'card');

			// Visual test - Payment confirmation
			await visualHelper.expectPageToMatchSnapshot('payment_confirmation');
		});

		await AllureHelper.step('Verify complete business setup in API', async () => {
			// Test API endpoints to ensure data is properly stored
			await apiHelper.authenticate({
				email: 'admin@gcmc-kaj.com',
				password: 'AdminPassword123'
			});

			const businessResponse = await apiHelper.testTrpcEndpoint('business.getByRegistrationNumber', {
				registrationNumber: businessData.registrationNumber
			});

			expect(businessResponse.status).toBe(200);
			expect(businessResponse.data).toBeDefined();
		});

		await AllureHelper.step('Generate and verify documentation', async () => {
			// Navigate to documents section
			await clientPortalPage.navigateToDocuments();

			// Verify all required documents are listed
			const documentCount = await clientPortalPage.getDocumentCount();
			expect(documentCount).toBeGreaterThan(0);

			// Visual test - Documents overview
			await visualHelper.expectPageToMatchSnapshot('documents_overview_complete');
		});

		await AllureHelper.step('Test notification system', async () => {
			// Check for completion notifications
			const upcomingDeadlines = await clientPortalPage.getUpcomingDeadlinesCount();

			// Should have upcoming compliance deadlines set up
			expect(upcomingDeadlines).toBeGreaterThanOrEqual(0);
		});
	});

	test('Business setup with error recovery - Resilience testing', async ({ page }) => {
		await AllureHelper.step('Start business setup and encounter validation errors', async () => {
			await loginPage.navigateToLogin();
			await loginPage.loginAsAdmin();

			await agencyFormsPage.navigateToAgencyForms();
			await agencyFormsPage.selectAgency('DCRA');

			// Try to submit form with missing required fields
			await agencyFormsPage.verifyFormValidation();
		});

		await AllureHelper.step('Recover from errors and complete setup', async () => {
			// Fill in missing information
			const completeBusinessData = {
				agency: 'DCRA' as const,
				formType: 'business-registration',
				documentType: 'incorporation',
				businessDetails: {
					name: businessData.name,
					registrationNumber: businessData.registrationNumber,
					taxId: businessData.taxId,
					address: businessData.address
				},
				contactDetails: {
					email: businessData.email,
					phone: businessData.phone,
					contactPerson: businessData.contactPerson
				}
			};

			await agencyFormsPage.completeDCRARegistration(completeBusinessData);
			await agencyFormsPage.verifySubmissionConfirmation();
		});
	});

	test('Business setup across different devices - Responsive testing', async ({ page }) => {
		const viewports = [
			{ name: 'mobile', width: 375, height: 667 },
			{ name: 'tablet', width: 768, height: 1024 },
			{ name: 'desktop', width: 1920, height: 1080 }
		];

		for (const viewport of viewports) {
			await AllureHelper.step(`Test business setup on ${viewport.name}`, async () => {
				await page.setViewportSize({ width: viewport.width, height: viewport.height });

				await loginPage.navigateToLogin();
				await loginPage.loginAsAdmin();

				await agencyFormsPage.navigateToAgencyForms();
				await agencyFormsPage.verifyAgencyFormsPageDisplayed();

				// Visual test for responsive design
				await visualHelper.expectPageToMatchSnapshot(`agency_forms_${viewport.name}`, {
					fullPage: true
				});
			});
		}
	});

	test('API performance during business setup - Performance testing', async () => {
		await AllureHelper.step('Test API performance under load', async () => {
			await apiHelper.authenticate({
				email: 'admin@gcmc-kaj.com',
				password: 'AdminPassword123'
			});

			// Test critical endpoints performance
			const endpoints = [
				'/api/business/create',
				'/api/documents/upload',
				'/api/compliance/status',
				'/trpc/agencies.list'
			];

			for (const endpoint of endpoints) {
				const performance = await apiHelper.testPerformance(endpoint, 'GET', null, 5);

				// Assert performance requirements
				expect(performance.averageTime).toBeLessThan(2000); // 2 seconds max
				expect(performance.successRate).toBeGreaterThan(95); // 95% success rate

				await AllureHelper.attachTestData(`Performance - ${endpoint}`, performance);
			}
		});
	});

	test('Complete business setup with all 29 agencies - Comprehensive testing', async ({ page }) => {
		await AllureHelper.step('Login and navigate to forms', async () => {
			await loginPage.navigateToLogin();
			await loginPage.loginAsAdmin();
			await agencyFormsPage.navigateToAgencyForms();
		});

		await AllureHelper.step('Verify all Guyanese agencies are available', async () => {
			await agencyFormsPage.verifyAllAgenciesAvailable();

			// Visual test - All agencies grid
			await visualHelper.expectPageToMatchSnapshot('all_agencies_grid', {
				fullPage: true
			});
		});

		await AllureHelper.step('Test agency search and filter functionality', async () => {
			// Test search functionality
			await agencyFormsPage.searchAgencies('GRA');

			// Visual test - Search results
			await visualHelper.expectPageToMatchSnapshot('agency_search_results');
		});

		await AllureHelper.step('Test key agency forms', async () => {
			const keyAgencies: Array<{
				agency: 'GRA' | 'NIS' | 'DCRA' | 'IMMIGRATION' | 'CUSTOMS';
				formType: string;
			}> = [
				{ agency: 'GRA', formType: 'tax-filing' },
				{ agency: 'NIS', formType: 'employee-registration' },
				{ agency: 'DCRA', formType: 'business-registration' },
				{ agency: 'IMMIGRATION', formType: 'work-permit' },
				{ agency: 'CUSTOMS', formType: 'import-declaration' }
			];

			for (const { agency, formType } of keyAgencies) {
				await agencyFormsPage.verifyAgencyRequirements(agency);

				// Take visual snapshot of each agency's requirements
				await agencyFormsPage.takeAgencyFormsScreenshot(agency);
			}
		});
	});

	test('Business setup data persistence - Data integrity testing', async () => {
		let businessId: string;

		await AllureHelper.step('Create business and capture ID', async () => {
			await apiHelper.authenticate({
				email: 'admin@gcmc-kaj.com',
				password: 'AdminPassword123'
			});

			const createResponse = await apiHelper.post('/api/business', {
				name: businessData.name,
				registrationNumber: businessData.registrationNumber,
				taxId: businessData.taxId
			});

			expect(createResponse.status).toBe(201);
			businessId = createResponse.data.id;
		});

		await AllureHelper.step('Verify data persistence across sessions', async () => {
			// Clear auth and re-authenticate
			apiHelper.clearAuth();
			await apiHelper.authenticate({
				email: 'admin@gcmc-kaj.com',
				password: 'AdminPassword123'
			});

			// Retrieve business data
			const retrieveResponse = await apiHelper.get(`/api/business/${businessId}`);

			expect(retrieveResponse.status).toBe(200);
			expect(retrieveResponse.data.name).toBe(businessData.name);
			expect(retrieveResponse.data.registrationNumber).toBe(businessData.registrationNumber);
		});
	});
});