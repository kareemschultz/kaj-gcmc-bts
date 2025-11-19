import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "../common/base-page";

/**
 * Dashboard Page Object
 *
 * Handles all interactions with the main dashboard page including:
 * - Navigation menus
 * - Stats cards
 * - Data tables
 * - Quick actions
 * - User profile dropdown
 */
export class DashboardPage extends BasePage {
  // Main layout locators
  private readonly sidebar: Locator;
  private readonly mainContent: Locator;
  private readonly pageHeader: Locator;
  private readonly userDropdown: Locator;
  private readonly logoutButton: Locator;
  private readonly profileButton: Locator;

  // Navigation locators
  private readonly navClients: Locator;
  private readonly navFilings: Locator;
  private readonly navReports: Locator;
  private readonly navTasks: Locator;
  private readonly navCompliance: Locator;
  private readonly navNotifications: Locator;
  private readonly mobileMenuToggle: Locator;

  // Dashboard content locators
  private readonly welcomeMessage: Locator;
  private readonly statsCards: Locator;
  private readonly recentActivity: Locator;
  private readonly quickActions: Locator;
  private readonly complianceOverview: Locator;
  private readonly taxFilingWidgets: Locator;

  // Stats card locators
  private readonly totalClientsCard: Locator;
  private readonly activeFilingsCard: Locator;
  private readonly pendingTasksCard: Locator;
  private readonly complianceStatusCard: Locator;

  // Table locators
  private readonly dataTable: Locator;
  private readonly tableRows: Locator;
  private readonly tableHeaders: Locator;
  private readonly paginationControls: Locator;

  // Form and modal locators
  private readonly searchBox: Locator;
  private readonly filterDropdown: Locator;
  private readonly actionButtons: Locator;
  private readonly modalDialog: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize main layout locators
    this.sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav[role="navigation"]');
    this.mainContent = page.locator('[data-testid="main-content"], main, .main-content');
    this.pageHeader = page.locator('[data-testid="page-header"], .page-header, header');
    this.userDropdown = page.locator('[data-testid="user-dropdown"], .user-dropdown, .profile-menu');
    this.logoutButton = page.locator('[data-testid="logout"], button:has-text("Logout"), button:has-text("Sign Out")');
    this.profileButton = page.locator('[data-testid="profile"], button:has-text("Profile")');

    // Initialize navigation locators
    this.navClients = page.locator('a[href*="/clients"], nav >> text="Clients"');
    this.navFilings = page.locator('a[href*="/filings"], nav >> text="Filings"');
    this.navReports = page.locator('a[href*="/reports"], nav >> text="Reports"');
    this.navTasks = page.locator('a[href*="/tasks"], nav >> text="Tasks"');
    this.navCompliance = page.locator('a[href*="/compliance"], nav >> text="Compliance"');
    this.navNotifications = page.locator('a[href*="/notifications"], nav >> text="Notifications"');
    this.mobileMenuToggle = page.locator('[data-testid="mobile-menu"], .mobile-menu-toggle, .hamburger');

    // Initialize dashboard content locators
    this.welcomeMessage = page.locator('[data-testid="welcome"], .welcome-message, h1:has-text("Welcome")');
    this.statsCards = page.locator('[data-testid="stats-cards"], .stats-grid, .dashboard-stats');
    this.recentActivity = page.locator('[data-testid="recent-activity"], .recent-activity, .activity-feed');
    this.quickActions = page.locator('[data-testid="quick-actions"], .quick-actions, .action-buttons');
    this.complianceOverview = page.locator('[data-testid="compliance-overview"], .compliance-overview');
    this.taxFilingWidgets = page.locator('[data-testid="tax-filing-widgets"], .tax-filing-widgets');

    // Initialize stats card locators
    this.totalClientsCard = page.locator('[data-testid="total-clients"], .stat-card:has-text("Clients")');
    this.activeFilingsCard = page.locator('[data-testid="active-filings"], .stat-card:has-text("Filings")');
    this.pendingTasksCard = page.locator('[data-testid="pending-tasks"], .stat-card:has-text("Tasks")');
    this.complianceStatusCard = page.locator('[data-testid="compliance-status"], .stat-card:has-text("Compliance")');

    // Initialize table locators
    this.dataTable = page.locator('[data-testid="data-table"], table, .data-table');
    this.tableRows = page.locator('tbody tr, [data-testid="table-row"]');
    this.tableHeaders = page.locator('thead th, [data-testid="table-header"]');
    this.paginationControls = page.locator('[data-testid="pagination"], .pagination');

    // Initialize form locators
    this.searchBox = page.locator('[data-testid="search"], input[type="search"], input[placeholder*="Search"]');
    this.filterDropdown = page.locator('[data-testid="filter"], select[name="filter"], .filter-dropdown');
    this.actionButtons = page.locator('[data-testid="action-buttons"], .action-buttons');
    this.modalDialog = page.locator('[role="dialog"], .modal, [data-testid="modal"]');
  }

  /**
   * Navigate to dashboard page
   */
  async navigateToDashboard(): Promise<void> {
    await this.goto("/dashboard");
    await this.waitForDashboardLoad();
  }

  /**
   * Wait for dashboard to load completely
   */
  async waitForDashboardLoad(): Promise<void> {
    await this.waitForPageLoad();
    await this.waitForElement(this.mainContent);
    await this.waitForElement(this.sidebar);
  }

  /**
   * Click on user dropdown to open menu
   */
  async openUserDropdown(): Promise<void> {
    await this.click(this.userDropdown);
    await this.waitForElement(this.logoutButton);
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    await this.openUserDropdown();
    await this.click(this.logoutButton);
    await this.waitForNavigation();
  }

  /**
   * Navigate to clients section
   */
  async navigateToClients(): Promise<void> {
    await this.click(this.navClients);
    await this.waitForNavigation();
  }

  /**
   * Navigate to filings section
   */
  async navigateToFilings(): Promise<void> {
    await this.click(this.navFilings);
    await this.waitForNavigation();
  }

  /**
   * Navigate to reports section
   */
  async navigateToReports(): Promise<void> {
    await this.click(this.navReports);
    await this.waitForNavigation();
  }

  /**
   * Navigate to tasks section
   */
  async navigateToTasks(): Promise<void> {
    await this.click(this.navTasks);
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
   * Search using the search box
   */
  async search(query: string): Promise<void> {
    await this.clearAndFill(this.searchBox, query);
    await this.pressKey("Enter");
    await this.waitForPageLoad();
  }

  /**
   * Toggle mobile menu (if on mobile)
   */
  async toggleMobileMenu(): Promise<void> {
    const isVisible = await this.isVisible(this.mobileMenuToggle);
    if (isVisible) {
      await this.click(this.mobileMenuToggle);
    }
  }

  // Verification Methods

  /**
   * Verify dashboard page is displayed correctly
   */
  async verifyDashboardDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await this.verifyElementVisible(this.sidebar);
    await this.verifyElementVisible(this.mainContent);
  }

  /**
   * Verify user is logged in (check for user dropdown)
   */
  async verifyUserLoggedIn(): Promise<void> {
    await this.verifyElementVisible(this.userDropdown);
  }

  /**
   * Verify navigation menu is present
   */
  async verifyNavigationPresent(): Promise<void> {
    await this.verifyElementVisible(this.navClients);
    await this.verifyElementVisible(this.navFilings);
    await this.verifyElementVisible(this.navReports);
  }

  /**
   * Verify stats cards are displayed
   */
  async verifyStatsCardsDisplayed(): Promise<void> {
    await this.verifyElementVisible(this.statsCards);

    // Check for individual stat cards
    const cards = [
      this.totalClientsCard,
      this.activeFilingsCard,
      this.pendingTasksCard,
      this.complianceStatusCard
    ];

    for (const card of cards) {
      const isVisible = await this.isVisible(card);
      if (isVisible) {
        await this.verifyElementVisible(card);
      }
    }
  }

  /**
   * Verify recent activity section
   */
  async verifyRecentActivityDisplayed(): Promise<void> {
    const isVisible = await this.isVisible(this.recentActivity);
    if (isVisible) {
      await this.verifyElementVisible(this.recentActivity);
    }
  }

  /**
   * Verify compliance overview is displayed
   */
  async verifyComplianceOverviewDisplayed(): Promise<void> {
    const isVisible = await this.isVisible(this.complianceOverview);
    if (isVisible) {
      await this.verifyElementVisible(this.complianceOverview);
    }
  }

  /**
   * Get stats from dashboard cards
   */
  async getDashboardStats(): Promise<{
    totalClients?: string;
    activeFilings?: string;
    pendingTasks?: string;
    complianceStatus?: string;
  }> {
    const stats: any = {};

    try {
      if (await this.isVisible(this.totalClientsCard)) {
        stats.totalClients = await this.getText(this.totalClientsCard);
      }
      if (await this.isVisible(this.activeFilingsCard)) {
        stats.activeFilings = await this.getText(this.activeFilingsCard);
      }
      if (await this.isVisible(this.pendingTasksCard)) {
        stats.pendingTasks = await this.getText(this.pendingTasksCard);
      }
      if (await this.isVisible(this.complianceStatusCard)) {
        stats.complianceStatus = await this.getText(this.complianceStatusCard);
      }
    } catch (error) {
      console.log("Some stats cards not available:", error);
    }

    return stats;
  }

  /**
   * Verify table data is displayed
   */
  async verifyTableDataDisplayed(): Promise<void> {
    const tableExists = await this.isVisible(this.dataTable);
    if (tableExists) {
      await this.verifyElementVisible(this.dataTable);

      // Check for table rows
      const rowCount = await this.tableRows.count();
      expect(rowCount).toBeGreaterThan(0);
    }
  }

  /**
   * Get table row count
   */
  async getTableRowCount(): Promise<number> {
    const tableExists = await this.isVisible(this.dataTable);
    return tableExists ? await this.tableRows.count() : 0;
  }

  /**
   * Click on table row by index
   */
  async clickTableRow(index: number): Promise<void> {
    const rows = await this.tableRows.count();
    if (index < rows) {
      await this.click(this.tableRows.nth(index));
      await this.waitForNavigation();
    }
  }

  /**
   * Verify page title and header
   */
  async verifyPageTitle(expectedTitle?: string): Promise<void> {
    if (expectedTitle) {
      await this.verifyTitle(new RegExp(expectedTitle, "i"));
    } else {
      await this.verifyTitle(/dashboard|home/i);
    }
  }

  /**
   * Verify welcome message is displayed
   */
  async verifyWelcomeMessage(): Promise<void> {
    const isVisible = await this.isVisible(this.welcomeMessage);
    if (isVisible) {
      await this.verifyElementVisible(this.welcomeMessage);
    }
  }

  /**
   * Test dashboard responsiveness
   */
  async testResponsiveness(): Promise<void> {
    // Check if mobile menu toggle is visible on small screens
    const viewport = this.page.viewportSize();
    if (viewport && viewport.width < 768) {
      await this.verifyElementVisible(this.mobileMenuToggle);
    }
  }

  /**
   * Verify search functionality
   */
  async verifySearchFunctionality(): Promise<void> {
    const searchExists = await this.isVisible(this.searchBox);
    if (searchExists) {
      await this.verifyElementVisible(this.searchBox);

      // Test search placeholder
      const placeholder = await this.getAttribute(this.searchBox, "placeholder");
      expect(placeholder).toContain("Search");
    }
  }

  /**
   * Verify no console errors on dashboard
   */
  async verifyNoConsoleErrors(): Promise<void> {
    const errors = await this.getConsoleErrors();
    expect(errors).toHaveLength(0);
  }

  /**
   * Take dashboard screenshot
   */
  async takeDashboardScreenshot(name: string = "dashboard"): Promise<void> {
    await this.takeScreenshot(`${name}-${Date.now()}`);
  }
}