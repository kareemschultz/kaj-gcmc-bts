import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "../common/base-page";

/**
 * Client Portal Page Object
 *
 * Handles all interactions with the client portal including:
 * - Self-service dashboard
 * - Document uploads
 * - Compliance tracking
 * - Payment processing
 * - Communication with GCMC
 */
export class ClientPortalPage extends BasePage {
	// Main layout locators
	private readonly clientSidebar: Locator;
	private readonly clientMainContent: Locator;
	private readonly clientHeader: Locator;
	private readonly clientUserDropdown: Locator;
	private readonly clientLogoutButton: Locator;

	// Navigation locators
	private readonly navDashboard: Locator;
	private readonly navDocuments: Locator;
	private readonly navCompliance: Locator;
	private readonly navPayments: Locator;
	private readonly navMessages: Locator;
	private readonly navProfile: Locator;
	private readonly navSupport: Locator;

	// Dashboard content locators
	private readonly clientWelcome: Locator;
	private readonly complianceStatus: Locator;
	private readonly upcomingDeadlines: Locator;
	private readonly recentDocuments: Locator;
	private readonly paymentStatus: Locator;
	private readonly notificationPanel: Locator;

	// Document management locators
	private readonly documentUploadArea: Locator;
	private readonly documentList: Locator;
	private readonly documentSearchBox: Locator;
	private readonly documentFilter: Locator;
	private readonly uploadButton: Locator;
	private readonly fileDropzone: Locator;
	private readonly uploadProgress: Locator;

	// Agency form locators
	private readonly agencyFormSelector: Locator;
	private readonly graForms: Locator; // Guyana Revenue Authority
	private readonly nisForms: Locator; // National Insurance Scheme
	private readonly dcraForms: Locator; // Deeds and Commercial Registry Authority
	private readonly immigrationForms: Locator;
	private readonly customsForms: Locator;

	// Compliance tracking locators
	private readonly complianceCalendar: Locator;
	private readonly complianceChecklist: Locator;
	private readonly deadlineAlerts: Locator;
	private readonly complianceProgress: Locator;

	// Payment locators
	private readonly paymentHistory: Locator;
	private readonly pendingPayments: Locator;
	private readonly makePaymentButton: Locator;
	private readonly paymentForm: Locator;
	private readonly paymentMethodSelector: Locator;

	// Communication locators
	private readonly messagesList: Locator;
	private readonly newMessageButton: Locator;
	private readonly messageComposer: Locator;
	private readonly chatWidget: Locator;

	constructor(page: Page) {
		super(page);

		// Initialize main layout locators
		this.clientSidebar = page.locator(
			'[data-testid="client-sidebar"], .client-sidebar, nav[role="navigation"].client-nav'
		);
		this.clientMainContent = page.locator(
			'[data-testid="client-main-content"], main.client-main, .client-content'
		);
		this.clientHeader = page.locator(
			'[data-testid="client-header"], header.client-header'
		);
		this.clientUserDropdown = page.locator(
			'[data-testid="client-user-dropdown"], .client-user-menu'
		);
		this.clientLogoutButton = page.locator(
			'[data-testid="client-logout"], button:has-text("Logout")'
		);

		// Initialize navigation locators
		this.navDashboard = page.locator(
			'a[href*="/client-portal"], nav >> text="Dashboard"'
		);
		this.navDocuments = page.locator(
			'a[href*="/client-portal/documents"], nav >> text="Documents"'
		);
		this.navCompliance = page.locator(
			'a[href*="/client-portal/compliance"], nav >> text="Compliance"'
		);
		this.navPayments = page.locator(
			'a[href*="/client-portal/payments"], nav >> text="Payments"'
		);
		this.navMessages = page.locator(
			'a[href*="/client-portal/messages"], nav >> text="Messages"'
		);
		this.navProfile = page.locator(
			'a[href*="/client-portal/profile"], nav >> text="Profile"'
		);
		this.navSupport = page.locator(
			'a[href*="/client-portal/support"], nav >> text="Support"'
		);

		// Initialize dashboard content locators
		this.clientWelcome = page.locator(
			'[data-testid="client-welcome"], .client-welcome, h1:has-text("Welcome")'
		);
		this.complianceStatus = page.locator(
			'[data-testid="compliance-status"], .compliance-status-card'
		);
		this.upcomingDeadlines = page.locator(
			'[data-testid="upcoming-deadlines"], .deadlines-widget'
		);
		this.recentDocuments = page.locator(
			'[data-testid="recent-documents"], .recent-documents-widget'
		);
		this.paymentStatus = page.locator(
			'[data-testid="payment-status"], .payment-status-card'
		);
		this.notificationPanel = page.locator(
			'[data-testid="notifications"], .notification-panel'
		);

		// Initialize document management locators
		this.documentUploadArea = page.locator(
			'[data-testid="upload-area"], .upload-zone, .dropzone'
		);
		this.documentList = page.locator(
			'[data-testid="document-list"], .documents-grid'
		);
		this.documentSearchBox = page.locator(
			'[data-testid="document-search"], input[placeholder*="Search documents"]'
		);
		this.documentFilter = page.locator(
			'[data-testid="document-filter"], .document-filter-dropdown'
		);
		this.uploadButton = page.locator(
			'[data-testid="upload-button"], button:has-text("Upload")'
		);
		this.fileDropzone = page.locator(
			'[data-testid="dropzone"], .file-dropzone, input[type="file"]'
		);
		this.uploadProgress = page.locator(
			'[data-testid="upload-progress"], .upload-progress'
		);

		// Initialize agency form locators
		this.agencyFormSelector = page.locator(
			'[data-testid="agency-selector"], .agency-form-selector'
		);
		this.graForms = page.locator(
			'[data-testid="gra-forms"], .gra-forms, button:has-text("GRA")'
		);
		this.nisForms = page.locator(
			'[data-testid="nis-forms"], .nis-forms, button:has-text("NIS")'
		);
		this.dcraForms = page.locator(
			'[data-testid="dcra-forms"], .dcra-forms, button:has-text("DCRA")'
		);
		this.immigrationForms = page.locator(
			'[data-testid="immigration-forms"], button:has-text("Immigration")'
		);
		this.customsForms = page.locator(
			'[data-testid="customs-forms"], button:has-text("Customs")'
		);

		// Initialize compliance tracking locators
		this.complianceCalendar = page.locator(
			'[data-testid="compliance-calendar"], .compliance-calendar'
		);
		this.complianceChecklist = page.locator(
			'[data-testid="compliance-checklist"], .compliance-checklist'
		);
		this.deadlineAlerts = page.locator(
			'[data-testid="deadline-alerts"], .deadline-alerts'
		);
		this.complianceProgress = page.locator(
			'[data-testid="compliance-progress"], .compliance-progress'
		);

		// Initialize payment locators
		this.paymentHistory = page.locator(
			'[data-testid="payment-history"], .payment-history-table'
		);
		this.pendingPayments = page.locator(
			'[data-testid="pending-payments"], .pending-payments-list'
		);
		this.makePaymentButton = page.locator(
			'[data-testid="make-payment"], button:has-text("Make Payment")'
		);
		this.paymentForm = page.locator(
			'[data-testid="payment-form"], .payment-form'
		);
		this.paymentMethodSelector = page.locator(
			'[data-testid="payment-method"], .payment-method-selector'
		);

		// Initialize communication locators
		this.messagesList = page.locator(
			'[data-testid="messages-list"], .messages-list'
		);
		this.newMessageButton = page.locator(
			'[data-testid="new-message"], button:has-text("New Message")'
		);
		this.messageComposer = page.locator(
			'[data-testid="message-composer"], .message-composer'
		);
		this.chatWidget = page.locator(
			'[data-testid="chat-widget"], .chat-widget'
		);
	}

	/**
	 * Navigate to client portal
	 */
	async navigateToClientPortal(): Promise<void> {
		await this.goto("/client-portal");
		await this.waitForClientPortalLoad();
	}

	/**
	 * Wait for client portal to load completely
	 */
	async waitForClientPortalLoad(): Promise<void> {
		await this.waitForPageLoad();
		await this.waitForElement(this.clientMainContent);
		await this.waitForElement(this.clientSidebar);
	}

	/**
	 * Navigate to documents section
	 */
	async navigateToDocuments(): Promise<void> {
		await this.click(this.navDocuments);
		await this.waitForNavigation();
	}

	/**
	 * Navigate to compliance section
	 */
	async navigateToCompliance(): Promise<void> {
		await this.click(this.navCompliance);
		await this.waitForNavigation();
	}

	/**
	 * Navigate to payments section
	 */
	async navigateToPayments(): Promise<void> {
		await this.click(this.navPayments);
		await this.waitForNavigation();
	}

	/**
	 * Navigate to messages section
	 */
	async navigateToMessages(): Promise<void> {
		await this.click(this.navMessages);
		await this.waitForNavigation();
	}

	/**
	 * Upload document using file dropzone
	 */
	async uploadDocument(filePath: string): Promise<void> {
		await this.uploadFile(this.fileDropzone, filePath);
		await this.waitForElement(this.uploadProgress);
		await this.page.waitForTimeout(2000); // Wait for upload to complete
	}

	/**
	 * Search for documents
	 */
	async searchDocuments(query: string): Promise<void> {
		await this.clearAndFill(this.documentSearchBox, query);
		await this.pressKey("Enter");
		await this.waitForPageLoad();
	}

	/**
	 * Select agency form (GRA, NIS, DCRA, etc.)
	 */
	async selectAgencyForm(agency: 'GRA' | 'NIS' | 'DCRA' | 'Immigration' | 'Customs'): Promise<void> {
		const agencyButtonMap = {
			'GRA': this.graForms,
			'NIS': this.nisForms,
			'DCRA': this.dcraForms,
			'Immigration': this.immigrationForms,
			'Customs': this.customsForms
		};

		const agencyButton = agencyButtonMap[agency];
		await this.click(agencyButton);
		await this.waitForNavigation();
	}

	/**
	 * Make a payment
	 */
	async makePayment(amount: string, method: 'card' | 'bank'): Promise<void> {
		await this.click(this.makePaymentButton);
		await this.waitForElement(this.paymentForm);

		// Select payment method
		await this.selectOption(this.paymentMethodSelector, method);

		// Fill payment details (simplified)
		await this.fill(this.page.locator('input[name="amount"]'), amount);

		// Submit payment
		await this.click(this.page.locator('button[type="submit"]'));
		await this.waitForNavigation();
	}

	/**
	 * Send a message to GCMC
	 */
	async sendMessage(subject: string, message: string): Promise<void> {
		await this.click(this.newMessageButton);
		await this.waitForElement(this.messageComposer);

		await this.fill(this.page.locator('input[name="subject"]'), subject);
		await this.fill(this.page.locator('textarea[name="message"]'), message);

		await this.click(this.page.locator('button:has-text("Send")'));
		await this.waitForNavigation();
	}

	/**
	 * Logout from client portal
	 */
	async logoutFromPortal(): Promise<void> {
		await this.click(this.clientUserDropdown);
		await this.waitForElement(this.clientLogoutButton);
		await this.click(this.clientLogoutButton);
		await this.waitForNavigation();
	}

	// Verification Methods

	/**
	 * Verify client portal is displayed correctly
	 */
	async verifyClientPortalDisplayed(): Promise<void> {
		await expect(this.page).toHaveURL(/\/client-portal/);
		await this.verifyElementVisible(this.clientSidebar);
		await this.verifyElementVisible(this.clientMainContent);
	}

	/**
	 * Verify client navigation is present
	 */
	async verifyClientNavigationPresent(): Promise<void> {
		await this.verifyElementVisible(this.navDocuments);
		await this.verifyElementVisible(this.navCompliance);
		await this.verifyElementVisible(this.navPayments);
	}

	/**
	 * Verify dashboard widgets are displayed
	 */
	async verifyDashboardWidgetsDisplayed(): Promise<void> {
		const widgets = [
			this.complianceStatus,
			this.upcomingDeadlines,
			this.recentDocuments,
			this.paymentStatus
		];

		for (const widget of widgets) {
			const isVisible = await this.isVisible(widget);
			if (isVisible) {
				await this.verifyElementVisible(widget);
			}
		}
	}

	/**
	 * Verify document upload functionality
	 */
	async verifyDocumentUploadFunctionality(): Promise<void> {
		await this.verifyElementVisible(this.documentUploadArea);
		await this.verifyElementVisible(this.fileDropzone);
	}

	/**
	 * Verify agency forms are available
	 */
	async verifyAgencyFormsAvailable(): Promise<void> {
		const agencies = [this.graForms, this.nisForms, this.dcraForms];

		for (const agency of agencies) {
			const isVisible = await this.isVisible(agency);
			if (isVisible) {
				await this.verifyElementVisible(agency);
			}
		}
	}

	/**
	 * Verify compliance tracking features
	 */
	async verifyComplianceTrackingFeatures(): Promise<void> {
		const features = [
			this.complianceCalendar,
			this.complianceChecklist,
			this.complianceProgress
		];

		for (const feature of features) {
			const isVisible = await this.isVisible(feature);
			if (isVisible) {
				await this.verifyElementVisible(feature);
			}
		}
	}

	/**
	 * Verify payment functionality
	 */
	async verifyPaymentFunctionality(): Promise<void> {
		const isPaymentHistoryVisible = await this.isVisible(this.paymentHistory);
		const isMakePaymentVisible = await this.isVisible(this.makePaymentButton);

		if (isPaymentHistoryVisible) {
			await this.verifyElementVisible(this.paymentHistory);
		}
		if (isMakePaymentVisible) {
			await this.verifyElementVisible(this.makePaymentButton);
		}
	}

	/**
	 * Verify messaging functionality
	 */
	async verifyMessagingFunctionality(): Promise<void> {
		const isMessagesListVisible = await this.isVisible(this.messagesList);
		const isNewMessageVisible = await this.isVisible(this.newMessageButton);

		if (isMessagesListVisible) {
			await this.verifyElementVisible(this.messagesList);
		}
		if (isNewMessageVisible) {
			await this.verifyElementVisible(this.newMessageButton);
		}
	}

	/**
	 * Get compliance status
	 */
	async getComplianceStatus(): Promise<string> {
		const isVisible = await this.isVisible(this.complianceStatus);
		return isVisible ? await this.getText(this.complianceStatus) : "";
	}

	/**
	 * Get upcoming deadlines count
	 */
	async getUpcomingDeadlinesCount(): Promise<number> {
		const isVisible = await this.isVisible(this.upcomingDeadlines);
		if (!isVisible) return 0;

		const deadlineItems = this.upcomingDeadlines.locator('.deadline-item');
		return await deadlineItems.count();
	}

	/**
	 * Get document count
	 */
	async getDocumentCount(): Promise<number> {
		const isVisible = await this.isVisible(this.documentList);
		if (!isVisible) return 0;

		const documents = this.documentList.locator('.document-item');
		return await documents.count();
	}

	/**
	 * Verify no console errors in client portal
	 */
	async verifyNoConsoleErrors(): Promise<void> {
		const errors = await this.getConsoleErrors();
		expect(errors).toHaveLength(0);
	}

	/**
	 * Take client portal screenshot
	 */
	async takeClientPortalScreenshot(name = "client-portal"): Promise<void> {
		await this.takeScreenshot(`${name}-${Date.now()}`);
	}
}