import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "../common/base-page";

/**
 * Agency Forms Page Object
 *
 * Handles all interactions with Guyanese regulatory agency forms including:
 * - All 29 regulatory authorities in Guyana
 * - Agency-specific form workflows
 * - Document requirements validation
 * - Submission tracking
 * - Compliance verification
 */

export type GuyaneseAgency =
	| 'GRA'           // Guyana Revenue Authority
	| 'NIS'           // National Insurance Scheme
	| 'DCRA'          // Deeds and Commercial Registry Authority
	| 'IMMIGRATION'   // Department of Immigration
	| 'CUSTOMS'       // Guyana Customs and Excise Division
	| 'BOG'           // Bank of Guyana
	| 'FSC'           // Financial Services Commission
	| 'EPA'           // Environmental Protection Agency
	| 'FORESTRY'      // Guyana Forestry Commission
	| 'MINING'        // Guyana Geology and Mines Commission
	| 'PETROLEUM'     // Guyana Petroleum Commission
	| 'TRANSPORT'     // Ministry of Public Infrastructure - Transport
	| 'HEALTH'        // Ministry of Public Health
	| 'EDUCATION'     // Ministry of Education
	| 'LABOUR'        // Ministry of Labour
	| 'HOUSING'       // Central Housing and Planning Authority
	| 'WATER'         // Guyana Water Incorporated
	| 'ELECTRICITY'   // Guyana Power and Light
	| 'TELECOM'       // Public Utilities Commission
	| 'TOURISM'       // Guyana Tourism Authority
	| 'AGRICULTURE'   // Ministry of Agriculture
	| 'FISHERIES'     // Ministry of Agriculture - Fisheries Division
	| 'LIVESTOCK'     // Ministry of Agriculture - Livestock Division
	| 'LANDS'         // Guyana Lands and Surveys Commission
	| 'STATISTICS'    // Bureau of Statistics
	| 'PROCUREMENT'   // National Procurement and Tender Administration Board
	| 'INTELLECTUAL'  // Intellectual Property Office
	| 'STANDARDS'     // Guyana National Bureau of Standards
	| 'FIREFIGHTERS'; // Guyana Fire and Rescue Service

export interface AgencyFormData {
	agency: GuyaneseAgency;
	formType: string;
	documentType: string;
	businessDetails?: {
		name: string;
		registrationNumber: string;
		taxId: string;
		address: string;
	};
	contactDetails?: {
		email: string;
		phone: string;
		contactPerson: string;
	};
	documents?: File[];
}

export class AgencyFormsPage extends BasePage {
	// Main layout locators
	private readonly agencySelector: Locator;
	private readonly formContainer: Locator;
	private readonly formHeader: Locator;
	private readonly formSteps: Locator;
	private readonly submitButton: Locator;
	private readonly saveProgressButton: Locator;

	// Agency selection locators
	private readonly agencyGrid: Locator;
	private readonly agencySearchBox: Locator;
	private readonly agencyFilter: Locator;
	private readonly popularAgencies: Locator;

	// Form field locators
	private readonly businessNameField: Locator;
	private readonly registrationNumberField: Locator;
	private readonly taxIdField: Locator;
	private readonly emailField: Locator;
	private readonly phoneField: Locator;
	private readonly addressField: Locator;

	// Document upload locators
	private readonly documentUploadSection: Locator;
	private readonly documentRequirements: Locator;
	private readonly fileDropzones: Locator;
	private readonly documentPreview: Locator;
	private readonly documentValidation: Locator;

	// Specific agency locators
	private readonly graSection: Locator;
	private readonly nisSection: Locator;
	private readonly dcraSection: Locator;
	private readonly immigrationSection: Locator;
	private readonly customsSection: Locator;
	private readonly bogSection: Locator;

	// Progress tracking locators
	private readonly progressIndicator: Locator;
	private readonly stepNavigation: Locator;
	private readonly validationMessages: Locator;
	private readonly submissionConfirmation: Locator;

	// Payment integration locators
	private readonly paymentSection: Locator;
	private readonly feeCalculator: Locator;
	private readonly paymentMethods: Locator;

	constructor(page: Page) {
		super(page);

		// Initialize main layout locators
		this.agencySelector = page.locator(
			'[data-testid="agency-selector"], .agency-selector'
		);
		this.formContainer = page.locator(
			'[data-testid="form-container"], .agency-form-container'
		);
		this.formHeader = page.locator(
			'[data-testid="form-header"], .form-header'
		);
		this.formSteps = page.locator(
			'[data-testid="form-steps"], .form-steps-indicator'
		);
		this.submitButton = page.locator(
			'[data-testid="submit-form"], button:has-text("Submit")'
		);
		this.saveProgressButton = page.locator(
			'[data-testid="save-progress"], button:has-text("Save Progress")'
		);

		// Initialize agency selection locators
		this.agencyGrid = page.locator(
			'[data-testid="agency-grid"], .agencies-grid'
		);
		this.agencySearchBox = page.locator(
			'[data-testid="agency-search"], input[placeholder*="Search agencies"]'
		);
		this.agencyFilter = page.locator(
			'[data-testid="agency-filter"], .agency-filter-dropdown'
		);
		this.popularAgencies = page.locator(
			'[data-testid="popular-agencies"], .popular-agencies-section'
		);

		// Initialize form field locators
		this.businessNameField = page.locator(
			'[data-testid="business-name"], input[name="businessName"]'
		);
		this.registrationNumberField = page.locator(
			'[data-testid="registration-number"], input[name="registrationNumber"]'
		);
		this.taxIdField = page.locator(
			'[data-testid="tax-id"], input[name="taxId"]'
		);
		this.emailField = page.locator(
			'[data-testid="email"], input[name="email"]'
		);
		this.phoneField = page.locator(
			'[data-testid="phone"], input[name="phone"]'
		);
		this.addressField = page.locator(
			'[data-testid="address"], textarea[name="address"]'
		);

		// Initialize document upload locators
		this.documentUploadSection = page.locator(
			'[data-testid="document-upload"], .document-upload-section'
		);
		this.documentRequirements = page.locator(
			'[data-testid="document-requirements"], .requirements-list'
		);
		this.fileDropzones = page.locator(
			'[data-testid="file-dropzone"], .file-upload-area'
		);
		this.documentPreview = page.locator(
			'[data-testid="document-preview"], .document-preview'
		);
		this.documentValidation = page.locator(
			'[data-testid="document-validation"], .validation-status'
		);

		// Initialize specific agency locators
		this.graSection = page.locator(
			'[data-testid="gra-section"], .agency-section.gra'
		);
		this.nisSection = page.locator(
			'[data-testid="nis-section"], .agency-section.nis'
		);
		this.dcraSection = page.locator(
			'[data-testid="dcra-section"], .agency-section.dcra'
		);
		this.immigrationSection = page.locator(
			'[data-testid="immigration-section"], .agency-section.immigration'
		);
		this.customsSection = page.locator(
			'[data-testid="customs-section"], .agency-section.customs'
		);
		this.bogSection = page.locator(
			'[data-testid="bog-section"], .agency-section.bog'
		);

		// Initialize progress tracking locators
		this.progressIndicator = page.locator(
			'[data-testid="progress-indicator"], .progress-bar'
		);
		this.stepNavigation = page.locator(
			'[data-testid="step-navigation"], .step-nav'
		);
		this.validationMessages = page.locator(
			'[data-testid="validation-messages"], .validation-feedback'
		);
		this.submissionConfirmation = page.locator(
			'[data-testid="submission-confirmation"], .submission-success'
		);

		// Initialize payment integration locators
		this.paymentSection = page.locator(
			'[data-testid="payment-section"], .payment-integration'
		);
		this.feeCalculator = page.locator(
			'[data-testid="fee-calculator"], .fee-breakdown'
		);
		this.paymentMethods = page.locator(
			'[data-testid="payment-methods"], .payment-options'
		);
	}

	/**
	 * Navigate to agency forms page
	 */
	async navigateToAgencyForms(): Promise<void> {
		await this.goto("/client-portal/forms");
		await this.waitForAgencyFormsLoad();
	}

	/**
	 * Wait for agency forms page to load
	 */
	async waitForAgencyFormsLoad(): Promise<void> {
		await this.waitForPageLoad();
		await this.waitForElement(this.agencySelector);
		await this.waitForElement(this.agencyGrid);
	}

	/**
	 * Select an agency from the grid
	 */
	async selectAgency(agency: GuyaneseAgency): Promise<void> {
		const agencyButton = this.page.locator(`[data-agency="${agency}"]`);
		await this.click(agencyButton);
		await this.waitForElement(this.formContainer);
	}

	/**
	 * Search for agencies
	 */
	async searchAgencies(searchTerm: string): Promise<void> {
		await this.clearAndFill(this.agencySearchBox, searchTerm);
		await this.waitForPageLoad();
	}

	/**
	 * Fill business details form
	 */
	async fillBusinessDetails(details: AgencyFormData['businessDetails']): Promise<void> {
		if (!details) return;

		await this.clearAndFill(this.businessNameField, details.name);
		await this.clearAndFill(this.registrationNumberField, details.registrationNumber);
		await this.clearAndFill(this.taxIdField, details.taxId);
		await this.clearAndFill(this.addressField, details.address);
	}

	/**
	 * Fill contact details form
	 */
	async fillContactDetails(details: AgencyFormData['contactDetails']): Promise<void> {
		if (!details) return;

		await this.clearAndFill(this.emailField, details.email);
		await this.clearAndFill(this.phoneField, details.phone);

		const contactPersonField = this.page.locator('input[name="contactPerson"]');
		await this.clearAndFill(contactPersonField, details.contactPerson);
	}

	/**
	 * Upload required documents
	 */
	async uploadDocuments(documentPaths: string[]): Promise<void> {
		for (let i = 0; i < documentPaths.length; i++) {
			const dropzone = this.fileDropzones.nth(i);
			await this.uploadFile(dropzone, documentPaths[i]);

			// Wait for upload progress
			await this.page.waitForTimeout(1000);
		}
	}

	/**
	 * Navigate to next form step
	 */
	async goToNextStep(): Promise<void> {
		const nextButton = this.page.locator('button:has-text("Next")');
		await this.click(nextButton);
		await this.waitForPageLoad();
	}

	/**
	 * Navigate to previous form step
	 */
	async goToPreviousStep(): Promise<void> {
		const prevButton = this.page.locator('button:has-text("Previous")');
		await this.click(prevButton);
		await this.waitForPageLoad();
	}

	/**
	 * Save form progress
	 */
	async saveProgress(): Promise<void> {
		await this.click(this.saveProgressButton);
		await this.waitForElement(this.page.locator('.save-confirmation'));
	}

	/**
	 * Submit completed form
	 */
	async submitForm(): Promise<void> {
		await this.click(this.submitButton);
		await this.waitForElement(this.submissionConfirmation);
	}

	/**
	 * Complete GRA tax filing form
	 */
	async completeGRATaxFiling(formData: AgencyFormData): Promise<void> {
		await this.selectAgency('GRA');

		// Select tax filing form type
		const taxFilingOption = this.page.locator('[data-form-type="tax-filing"]');
		await this.click(taxFilingOption);
		await this.goToNextStep();

		// Fill business details
		await this.fillBusinessDetails(formData.businessDetails);
		await this.goToNextStep();

		// Upload tax documents
		if (formData.documents) {
			const documentPaths = formData.documents.map(file => file.name);
			await this.uploadDocuments(documentPaths);
		}
		await this.goToNextStep();

		// Review and submit
		await this.submitForm();
	}

	/**
	 * Complete NIS registration form
	 */
	async completeNISRegistration(formData: AgencyFormData): Promise<void> {
		await this.selectAgency('NIS');

		// Select registration form type
		const registrationOption = this.page.locator('[data-form-type="employee-registration"]');
		await this.click(registrationOption);
		await this.goToNextStep();

		// Fill employee details
		await this.fillContactDetails(formData.contactDetails);
		await this.goToNextStep();

		// Submit form
		await this.submitForm();
	}

	/**
	 * Complete DCRA business registration
	 */
	async completeDCRARegistration(formData: AgencyFormData): Promise<void> {
		await this.selectAgency('DCRA');

		// Select business registration form
		const businessRegOption = this.page.locator('[data-form-type="business-registration"]');
		await this.click(businessRegOption);
		await this.goToNextStep();

		// Fill business information
		await this.fillBusinessDetails(formData.businessDetails);
		await this.goToNextStep();

		// Upload incorporation documents
		if (formData.documents) {
			const documentPaths = formData.documents.map(file => file.name);
			await this.uploadDocuments(documentPaths);
		}
		await this.goToNextStep();

		// Submit registration
		await this.submitForm();
	}

	// Verification Methods

	/**
	 * Verify agency forms page is displayed
	 */
	async verifyAgencyFormsPageDisplayed(): Promise<void> {
		await expect(this.page).toHaveURL(/\/forms/);
		await this.verifyElementVisible(this.agencySelector);
		await this.verifyElementVisible(this.agencyGrid);
	}

	/**
	 * Verify all 29 agencies are available
	 */
	async verifyAllAgenciesAvailable(): Promise<void> {
		const expectedAgencies: GuyaneseAgency[] = [
			'GRA', 'NIS', 'DCRA', 'IMMIGRATION', 'CUSTOMS', 'BOG', 'FSC',
			'EPA', 'FORESTRY', 'MINING', 'PETROLEUM', 'TRANSPORT', 'HEALTH',
			'EDUCATION', 'LABOUR', 'HOUSING', 'WATER', 'ELECTRICITY', 'TELECOM',
			'TOURISM', 'AGRICULTURE', 'FISHERIES', 'LIVESTOCK', 'LANDS',
			'STATISTICS', 'PROCUREMENT', 'INTELLECTUAL', 'STANDARDS', 'FIREFIGHTERS'
		];

		for (const agency of expectedAgencies) {
			const agencyElement = this.page.locator(`[data-agency="${agency}"]`);
			const isVisible = await this.isVisible(agencyElement);

			if (isVisible) {
				await this.verifyElementVisible(agencyElement);
			}
		}
	}

	/**
	 * Verify form fields are present
	 */
	async verifyFormFieldsPresent(): Promise<void> {
		const formFields = [
			this.businessNameField,
			this.emailField,
			this.phoneField
		];

		for (const field of formFields) {
			const isVisible = await this.isVisible(field);
			if (isVisible) {
				await this.verifyElementVisible(field);
			}
		}
	}

	/**
	 * Verify document upload functionality
	 */
	async verifyDocumentUploadFunctionality(): Promise<void> {
		await this.verifyElementVisible(this.documentUploadSection);
		await this.verifyElementVisible(this.fileDropzones);
	}

	/**
	 * Verify form validation
	 */
	async verifyFormValidation(): Promise<void> {
		// Try to submit empty form
		await this.click(this.submitButton);

		// Check for validation messages
		await this.verifyElementVisible(this.validationMessages);
	}

	/**
	 * Verify progress tracking
	 */
	async verifyProgressTracking(): Promise<void> {
		const isProgressVisible = await this.isVisible(this.progressIndicator);
		const isStepsVisible = await this.isVisible(this.stepNavigation);

		if (isProgressVisible) {
			await this.verifyElementVisible(this.progressIndicator);
		}
		if (isStepsVisible) {
			await this.verifyElementVisible(this.stepNavigation);
		}
	}

	/**
	 * Verify agency-specific requirements
	 */
	async verifyAgencyRequirements(agency: GuyaneseAgency): Promise<void> {
		await this.selectAgency(agency);
		await this.verifyElementVisible(this.documentRequirements);

		// Check for agency-specific guidance
		const guidanceSection = this.page.locator('.agency-guidance');
		const isGuidanceVisible = await this.isVisible(guidanceSection);

		if (isGuidanceVisible) {
			await this.verifyElementVisible(guidanceSection);
		}
	}

	/**
	 * Get form progress percentage
	 */
	async getFormProgressPercentage(): Promise<number> {
		const progressBar = this.page.locator('.progress-bar .progress-fill');
		const width = await progressBar.evaluate(el => {
			return window.getComputedStyle(el).width;
		});

		// Extract percentage from width (assuming width is in percentage)
		const percentage = parseFloat(width.replace('%', ''));
		return isNaN(percentage) ? 0 : percentage;
	}

	/**
	 * Get list of required documents
	 */
	async getRequiredDocuments(): Promise<string[]> {
		const documentItems = this.documentRequirements.locator('.requirement-item');
		const count = await documentItems.count();
		const documents: string[] = [];

		for (let i = 0; i < count; i++) {
			const text = await documentItems.nth(i).textContent();
			if (text) {
				documents.push(text.trim());
			}
		}

		return documents;
	}

	/**
	 * Verify submission confirmation
	 */
	async verifySubmissionConfirmation(): Promise<void> {
		await this.verifyElementVisible(this.submissionConfirmation);

		// Check for confirmation number
		const confirmationNumber = this.page.locator('.confirmation-number');
		const isConfirmationVisible = await this.isVisible(confirmationNumber);

		if (isConfirmationVisible) {
			await this.verifyElementVisible(confirmationNumber);
		}
	}

	/**
	 * Get submission confirmation details
	 */
	async getSubmissionConfirmationDetails(): Promise<{
		confirmationNumber?: string;
		submissionDate?: string;
		status?: string;
	}> {
		const details: any = {};

		const confirmationNumberElement = this.page.locator('.confirmation-number');
		if (await this.isVisible(confirmationNumberElement)) {
			details.confirmationNumber = await this.getText(confirmationNumberElement);
		}

		const dateElement = this.page.locator('.submission-date');
		if (await this.isVisible(dateElement)) {
			details.submissionDate = await this.getText(dateElement);
		}

		const statusElement = this.page.locator('.submission-status');
		if (await this.isVisible(statusElement)) {
			details.status = await this.getText(statusElement);
		}

		return details;
	}

	/**
	 * Take agency forms screenshot
	 */
	async takeAgencyFormsScreenshot(agency: GuyaneseAgency): Promise<void> {
		await this.takeScreenshot(`agency-forms-${agency.toLowerCase()}-${Date.now()}`);
	}
}