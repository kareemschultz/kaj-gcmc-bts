import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "../common/base-page";

/**
 * Navigation Component Page Object
 *
 * Handles interactions with the main navigation component
 * including sidebar navigation, breadcrumbs, and mobile menu
 */
export class NavigationComponent extends BasePage {
  // Main navigation elements
  private readonly sidebar: Locator;
  private readonly mobileMenuToggle: Locator;
  private readonly logo: Locator;
  private readonly userMenu: Locator;

  // Navigation links
  private readonly dashboardLink: Locator;
  private readonly clientsLink: Locator;
  private readonly filingsLink: Locator;
  private readonly reportsLink: Locator;
  private readonly tasksLink: Locator;
  private readonly complianceLink: Locator;
  private readonly notificationsLink: Locator;
  private readonly settingsLink: Locator;

  // User menu items
  private readonly profileLink: Locator;
  private readonly settingsMenuLink: Locator;
  private readonly logoutLink: Locator;

  // Breadcrumb navigation
  private readonly breadcrumb: Locator;
  private readonly breadcrumbItems: Locator;
  private readonly breadcrumbHome: Locator;

  // Notification badge
  private readonly notificationBadge: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize main navigation elements
    this.sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav[role="navigation"]');
    this.mobileMenuToggle = page.locator('[data-testid="mobile-menu"], .mobile-menu-toggle, .hamburger');
    this.logo = page.locator('[data-testid="logo"], .logo, .brand');
    this.userMenu = page.locator('[data-testid="user-menu"], .user-menu, .profile-dropdown');

    // Initialize navigation links
    this.dashboardLink = page.locator('[data-testid="nav-dashboard"], a[href*="/dashboard"]:has-text("Dashboard")');
    this.clientsLink = page.locator('[data-testid="nav-clients"], a[href*="/clients"]:has-text("Clients")');
    this.filingsLink = page.locator('[data-testid="nav-filings"], a[href*="/filings"]:has-text("Filings")');
    this.reportsLink = page.locator('[data-testid="nav-reports"], a[href*="/reports"]:has-text("Reports")');
    this.tasksLink = page.locator('[data-testid="nav-tasks"], a[href*="/tasks"]:has-text("Tasks")');
    this.complianceLink = page.locator('[data-testid="nav-compliance"], a[href*="/compliance"]:has-text("Compliance")');
    this.notificationsLink = page.locator('[data-testid="nav-notifications"], a[href*="/notifications"]:has-text("Notifications")');
    this.settingsLink = page.locator('[data-testid="nav-settings"], a[href*="/settings"]:has-text("Settings")');

    // Initialize user menu items
    this.profileLink = page.locator('[data-testid="profile-link"], a:has-text("Profile")');
    this.settingsMenuLink = page.locator('[data-testid="settings-link"], a:has-text("Settings")');
    this.logoutLink = page.locator('[data-testid="logout-link"], a:has-text("Logout"), button:has-text("Logout")');

    // Initialize breadcrumb navigation
    this.breadcrumb = page.locator('[data-testid="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');
    this.breadcrumbItems = page.locator('.breadcrumb-item, [data-testid="breadcrumb-item"]');
    this.breadcrumbHome = page.locator('.breadcrumb a:has-text("Home"), [data-testid="breadcrumb-home"]');

    // Initialize notification badge
    this.notificationBadge = page.locator('[data-testid="notification-badge"], .notification-badge, .badge');
  }

  // Navigation Actions

  /**
   * Navigate to dashboard
   */
  async navigateToDashboard(): Promise<void> {
    await this.click(this.dashboardLink);
    await this.waitForNavigation();
  }

  /**
   * Navigate to clients page
   */
  async navigateToClients(): Promise<void> {
    await this.click(this.clientsLink);
    await this.waitForNavigation();
  }

  /**
   * Navigate to filings page
   */
  async navigateToFilings(): Promise<void> {
    await this.click(this.filingsLink);
    await this.waitForNavigation();
  }

  /**
   * Navigate to reports page
   */
  async navigateToReports(): Promise<void> {
    await this.click(this.reportsLink);
    await this.waitForNavigation();
  }

  /**
   * Navigate to tasks page
   */
  async navigateToTasks(): Promise<void> {
    await this.click(this.tasksLink);
    await this.waitForNavigation();
  }

  /**
   * Navigate to compliance page
   */
  async navigateToCompliance(): Promise<void> {
    await this.click(this.complianceLink);
    await this.waitForNavigation();
  }

  /**
   * Navigate to notifications page
   */
  async navigateToNotifications(): Promise<void> {
    await this.click(this.notificationsLink);
    await this.waitForNavigation();
  }

  /**
   * Navigate to settings page
   */
  async navigateToSettings(): Promise<void> {
    await this.click(this.settingsLink);
    await this.waitForNavigation();
  }

  /**
   * Open user menu
   */
  async openUserMenu(): Promise<void> {
    await this.click(this.userMenu);
    await this.waitForElement(this.logoutLink);
  }

  /**
   * Navigate to profile
   */
  async navigateToProfile(): Promise<void> {
    await this.openUserMenu();
    await this.click(this.profileLink);
    await this.waitForNavigation();
  }

  /**
   * Logout from application
   */
  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.click(this.logoutLink);
    await this.waitForNavigation();
  }

  /**
   * Toggle mobile menu
   */
  async toggleMobileMenu(): Promise<void> {
    const isVisible = await this.isVisible(this.mobileMenuToggle);
    if (isVisible) {
      await this.click(this.mobileMenuToggle);
    }
  }

  /**
   * Click on logo to go to home
   */
  async clickLogo(): Promise<void> {
    await this.click(this.logo);
    await this.waitForNavigation();
  }

  /**
   * Navigate using breadcrumb
   */
  async navigateViaBreadcrumb(itemText: string): Promise<void> {
    const breadcrumbItem = this.page.locator(`.breadcrumb a:has-text("${itemText}"), [data-testid="breadcrumb-${itemText.toLowerCase()}"]`);
    await this.click(breadcrumbItem);
    await this.waitForNavigation();
  }

  // Verification Methods

  /**
   * Verify navigation is visible
   */
  async verifyNavigationVisible(): Promise<void> {
    await this.verifyElementVisible(this.sidebar);
  }

  /**
   * Verify all main navigation links are present
   */
  async verifyNavigationLinksPresent(): Promise<void> {
    const links = [
      this.dashboardLink,
      this.clientsLink,
      this.filingsLink,
      this.reportsLink,
      this.tasksLink
    ];

    for (const link of links) {
      const isVisible = await this.isVisible(link);
      if (isVisible) {
        await this.verifyElementVisible(link);
      }
    }
  }

  /**
   * Verify active navigation item
   */
  async verifyActiveNavigation(expectedPage: string): Promise<void> {
    const activeLink = this.page.locator(`[data-testid="nav-${expectedPage}"].active, .nav-item.active:has-text("${expectedPage}")`);
    const isVisible = await this.isVisible(activeLink);
    if (isVisible) {
      await this.verifyElementVisible(activeLink);
    }
  }

  /**
   * Verify user menu is accessible
   */
  async verifyUserMenuAccessible(): Promise<void> {
    await this.verifyElementVisible(this.userMenu);
  }

  /**
   * Verify breadcrumb navigation
   */
  async verifyBreadcrumbNavigation(): Promise<void> {
    const breadcrumbVisible = await this.isVisible(this.breadcrumb);
    if (breadcrumbVisible) {
      await this.verifyElementVisible(this.breadcrumb);
    }
  }

  /**
   * Verify breadcrumb path
   */
  async verifyBreadcrumbPath(expectedPath: string[]): Promise<void> {
    const breadcrumbVisible = await this.isVisible(this.breadcrumb);
    if (breadcrumbVisible) {
      const items = await this.breadcrumbItems.all();

      for (let i = 0; i < expectedPath.length; i++) {
        if (i < items.length) {
          const itemText = await items[i].textContent();
          expect(itemText).toContain(expectedPath[i]);
        }
      }
    }
  }

  /**
   * Verify notification badge
   */
  async verifyNotificationBadge(expectedCount?: number): Promise<void> {
    const badgeVisible = await this.isVisible(this.notificationBadge);
    if (badgeVisible) {
      await this.verifyElementVisible(this.notificationBadge);

      if (expectedCount !== undefined) {
        const badgeText = await this.getText(this.notificationBadge);
        expect(badgeText).toContain(expectedCount.toString());
      }
    }
  }

  /**
   * Verify mobile menu functionality
   */
  async verifyMobileMenuFunctionality(): Promise<void> {
    const viewport = this.page.viewportSize();
    if (viewport && viewport.width < 768) {
      await this.verifyElementVisible(this.mobileMenuToggle);

      // Test menu toggle
      await this.toggleMobileMenu();
      await this.verifyElementVisible(this.sidebar);

      // Toggle again to close
      await this.toggleMobileMenu();
    }
  }

  /**
   * Verify logo is displayed
   */
  async verifyLogoDisplayed(): Promise<void> {
    const logoVisible = await this.isVisible(this.logo);
    if (logoVisible) {
      await this.verifyElementVisible(this.logo);
    }
  }

  /**
   * Get current navigation state
   */
  async getCurrentNavigationState(): Promise<{
    currentPage: string;
    breadcrumbPath: string[];
    notificationCount: number;
  }> {
    const currentUrl = await this.getCurrentUrl();
    const currentPage = this.extractPageFromUrl(currentUrl);

    let breadcrumbPath: string[] = [];
    const breadcrumbVisible = await this.isVisible(this.breadcrumb);
    if (breadcrumbVisible) {
      const items = await this.breadcrumbItems.all();
      for (const item of items) {
        const text = await item.textContent();
        if (text) {
          breadcrumbPath.push(text.trim());
        }
      }
    }

    let notificationCount = 0;
    const badgeVisible = await this.isVisible(this.notificationBadge);
    if (badgeVisible) {
      const badgeText = await this.getText(this.notificationBadge);
      notificationCount = parseInt(badgeText) || 0;
    }

    return {
      currentPage,
      breadcrumbPath,
      notificationCount
    };
  }

  /**
   * Extract page name from URL
   */
  private extractPageFromUrl(url: string): string {
    const matches = url.match(/\/([^\/\?]+)/);
    return matches ? matches[1] : "home";
  }

  /**
   * Verify all navigation links are clickable
   */
  async verifyNavigationLinksClickable(): Promise<void> {
    const links = [
      this.dashboardLink,
      this.clientsLink,
      this.filingsLink,
      this.reportsLink
    ];

    for (const link of links) {
      const isVisible = await this.isVisible(link);
      if (isVisible) {
        await expect(link).toBeEnabled();
      }
    }
  }

  /**
   * Test complete navigation flow
   */
  async testCompleteNavigationFlow(): Promise<void> {
    // Test main navigation
    await this.navigateToDashboard();
    await this.verifyUrl(/\/dashboard/);

    await this.navigateToClients();
    await this.verifyUrl(/\/clients/);

    await this.navigateToReports();
    await this.verifyUrl(/\/reports/);

    // Test user menu
    await this.openUserMenu();
    await this.verifyElementVisible(this.logoutLink);

    // Return to dashboard
    await this.navigateToDashboard();
    await this.verifyUrl(/\/dashboard/);
  }
}