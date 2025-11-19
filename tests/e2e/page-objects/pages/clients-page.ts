import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "../common/base-page";

/**
 * Clients Page Object
 *
 * Handles all interactions with the clients management page including:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Client listing and filtering
 * - Client detail views
 * - Form validation
 */
export class ClientsPage extends BasePage {
  // Page navigation and layout
  private readonly pageTitle: Locator;
  private readonly addClientButton: Locator;
  private readonly clientsList: Locator;
  private readonly searchBox: Locator;
  private readonly filterDropdown: Locator;

  // Client table elements
  private readonly clientsTable: Locator;
  private readonly tableHeaders: Locator;
  private readonly tableRows: Locator;
  private readonly clientRow: (clientName: string) => Locator;
  private readonly editButton: (row: number) => Locator;
  private readonly deleteButton: (row: number) => Locator;
  private readonly viewButton: (row: number) => Locator;

  // Client form elements
  private readonly clientForm: Locator;
  private readonly nameField: Locator;
  private readonly emailField: Locator;
  private readonly phoneField: Locator;
  private readonly addressField: Locator;
  private readonly companyField: Locator;
  private readonly taxIdField: Locator;
  private readonly statusSelect: Locator;
  private readonly notesField: Locator;
  private readonly saveButton: Locator;
  private readonly cancelButton: Locator;

  // Modal and confirmation elements
  private readonly modal: Locator;
  private readonly modalTitle: Locator;
  private readonly confirmDeleteButton: Locator;
  private readonly cancelDeleteButton: Locator;
  private readonly successMessage: Locator;
  private readonly errorMessage: Locator;
  private readonly validationErrors: Locator;

  // Pagination and sorting
  private readonly pagination: Locator;
  private readonly nextPageButton: Locator;
  private readonly previousPageButton: Locator;
  private readonly pageInfo: Locator;
  private readonly sortButtons: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize page navigation and layout
    this.pageTitle = page.locator('h1:has-text("Clients"), [data-testid="page-title"]');
    this.addClientButton = page.locator('button:has-text("Add Client"), [data-testid="add-client"], .btn-add-client');
    this.clientsList = page.locator('[data-testid="clients-list"], .clients-list, .client-container');
    this.searchBox = page.locator('input[placeholder*="Search"], input[type="search"], [data-testid="search"]');
    this.filterDropdown = page.locator('select[name="filter"], [data-testid="filter"], .filter-dropdown');

    // Initialize client table elements
    this.clientsTable = page.locator('table, [data-testid="clients-table"], .clients-table');
    this.tableHeaders = page.locator('thead th, [data-testid="table-header"]');
    this.tableRows = page.locator('tbody tr, [data-testid="client-row"]');

    this.clientRow = (clientName: string) =>
      page.locator(`tr:has-text("${clientName}"), [data-testid="client-${clientName}"]`);
    this.editButton = (row: number) =>
      page.locator(`tbody tr:nth-child(${row + 1}) button:has-text("Edit"), tbody tr:nth-child(${row + 1}) [data-testid="edit"]`);
    this.deleteButton = (row: number) =>
      page.locator(`tbody tr:nth-child(${row + 1}) button:has-text("Delete"), tbody tr:nth-child(${row + 1}) [data-testid="delete"]`);
    this.viewButton = (row: number) =>
      page.locator(`tbody tr:nth-child(${row + 1}) button:has-text("View"), tbody tr:nth-child(${row + 1}) [data-testid="view"]`);

    // Initialize client form elements
    this.clientForm = page.locator('form, [data-testid="client-form"], .client-form');
    this.nameField = page.locator('input[name="name"], input[name="fullName"], [data-testid="name"]');
    this.emailField = page.locator('input[name="email"], input[type="email"], [data-testid="email"]');
    this.phoneField = page.locator('input[name="phone"], input[type="tel"], [data-testid="phone"]');
    this.addressField = page.locator('textarea[name="address"], input[name="address"], [data-testid="address"]');
    this.companyField = page.locator('input[name="company"], input[name="companyName"], [data-testid="company"]');
    this.taxIdField = page.locator('input[name="taxId"], input[name="tin"], [data-testid="tax-id"]');
    this.statusSelect = page.locator('select[name="status"], [data-testid="status"]');
    this.notesField = page.locator('textarea[name="notes"], [data-testid="notes"]');
    this.saveButton = page.locator('button[type="submit"], button:has-text("Save"), [data-testid="save"]');
    this.cancelButton = page.locator('button:has-text("Cancel"), [data-testid="cancel"]');

    // Initialize modal and confirmation elements
    this.modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]');
    this.modalTitle = page.locator('.modal-title, [data-testid="modal-title"]');
    this.confirmDeleteButton = page.locator('button:has-text("Delete"), button:has-text("Confirm"), [data-testid="confirm-delete"]');
    this.cancelDeleteButton = page.locator('button:has-text("Cancel"), [data-testid="cancel-delete"]');
    this.successMessage = page.locator('.alert-success, .success, [data-testid="success"]');
    this.errorMessage = page.locator('.alert-error, .error, [data-testid="error"]');
    this.validationErrors = page.locator('.field-error, .validation-error, [role="alert"]');

    // Initialize pagination and sorting
    this.pagination = page.locator('.pagination, [data-testid="pagination"]');
    this.nextPageButton = page.locator('button:has-text("Next"), .pagination-next');
    this.previousPageButton = page.locator('button:has-text("Previous"), .pagination-prev');
    this.pageInfo = page.locator('.page-info, [data-testid="page-info"]');
    this.sortButtons = page.locator('.sort-button, [data-testid^="sort"]');
  }

  /**
   * Navigate to clients page
   */
  async navigateToClients(): Promise<void> {
    await this.goto("/dashboard/clients");
    await this.waitForClientsPageLoad();
  }

  /**
   * Wait for clients page to load completely
   */
  async waitForClientsPageLoad(): Promise<void> {
    await this.waitForPageLoad();
    await this.waitForElement(this.pageTitle);
    await this.waitForElement(this.addClientButton);
  }

  // CRUD Operations

  /**
   * Click add client button to open create form
   */
  async clickAddClient(): Promise<void> {
    await this.click(this.addClientButton);
    await this.waitForElement(this.clientForm);
  }

  /**
   * Create a new client with provided data
   */
  async createClient(clientData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    company?: string;
    taxId?: string;
    status?: string;
    notes?: string;
  }): Promise<void> {
    await this.clickAddClient();
    await this.fillClientForm(clientData);
    await this.saveClient();
    await this.waitForSuccessMessage();
  }

  /**
   * Fill client form with data
   */
  async fillClientForm(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    company?: string;
    taxId?: string;
    status?: string;
    notes?: string;
  }): Promise<void> {
    await this.clearAndFill(this.nameField, data.name);
    await this.clearAndFill(this.emailField, data.email);

    if (data.phone) {
      await this.clearAndFill(this.phoneField, data.phone);
    }

    if (data.address) {
      await this.clearAndFill(this.addressField, data.address);
    }

    if (data.company) {
      await this.clearAndFill(this.companyField, data.company);
    }

    if (data.taxId) {
      await this.clearAndFill(this.taxIdField, data.taxId);
    }

    if (data.status) {
      await this.selectOption(this.statusSelect, data.status);
    }

    if (data.notes) {
      await this.clearAndFill(this.notesField, data.notes);
    }
  }

  /**
   * Save client form
   */
  async saveClient(): Promise<void> {
    await this.click(this.saveButton);
    await this.waitForNavigation();
  }

  /**
   * Cancel client form
   */
  async cancelClientForm(): Promise<void> {
    await this.click(this.cancelButton);
    await this.waitForNavigation();
  }

  /**
   * Edit client by row index
   */
  async editClient(rowIndex: number, newData: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    company: string;
    taxId: string;
    status: string;
    notes: string;
  }>): Promise<void> {
    await this.clickEditClient(rowIndex);
    await this.fillClientForm(newData as any);
    await this.saveClient();
    await this.waitForSuccessMessage();
  }

  /**
   * Click edit button for specific client row
   */
  async clickEditClient(rowIndex: number): Promise<void> {
    await this.click(this.editButton(rowIndex));
    await this.waitForElement(this.clientForm);
  }

  /**
   * View client details by row index
   */
  async viewClient(rowIndex: number): Promise<void> {
    await this.click(this.viewButton(rowIndex));
    await this.waitForNavigation();
  }

  /**
   * Delete client by row index
   */
  async deleteClient(rowIndex: number): Promise<void> {
    await this.click(this.deleteButton(rowIndex));
    await this.waitForElement(this.modal);
    await this.confirmDelete();
    await this.waitForSuccessMessage();
  }

  /**
   * Confirm delete action in modal
   */
  async confirmDelete(): Promise<void> {
    await this.click(this.confirmDeleteButton);
    await this.waitForNavigation();
  }

  /**
   * Cancel delete action in modal
   */
  async cancelDelete(): Promise<void> {
    await this.click(this.cancelDeleteButton);
    await this.waitForElement(this.clientsTable);
  }

  // Search and Filter Operations

  /**
   * Search for clients by query
   */
  async searchClients(query: string): Promise<void> {
    await this.clearAndFill(this.searchBox, query);
    await this.pressKey("Enter");
    await this.waitForPageLoad();
  }

  /**
   * Filter clients by status
   */
  async filterClientsByStatus(status: string): Promise<void> {
    await this.selectOption(this.filterDropdown, status);
    await this.waitForPageLoad();
  }

  /**
   * Clear search and filters
   */
  async clearSearchAndFilters(): Promise<void> {
    await this.clearAndFill(this.searchBox, "");
    await this.selectOption(this.filterDropdown, "all");
    await this.waitForPageLoad();
  }

  // Table Operations

  /**
   * Get total number of client rows
   */
  async getClientRowCount(): Promise<number> {
    await this.waitForElement(this.clientsTable);
    return await this.tableRows.count();
  }

  /**
   * Get client data from specific row
   */
  async getClientDataFromRow(rowIndex: number): Promise<{
    name: string;
    email: string;
    company?: string;
    status?: string;
  }> {
    const row = this.tableRows.nth(rowIndex);
    const cells = row.locator("td");

    return {
      name: await cells.nth(0).textContent() || "",
      email: await cells.nth(1).textContent() || "",
      company: await cells.nth(2).textContent() || "",
      status: await cells.nth(3).textContent() || "",
    };
  }

  /**
   * Find client row by name
   */
  async findClientByName(name: string): Promise<number> {
    const rowCount = await this.getClientRowCount();

    for (let i = 0; i < rowCount; i++) {
      const clientData = await this.getClientDataFromRow(i);
      if (clientData.name.includes(name)) {
        return i;
      }
    }

    return -1; // Not found
  }

  /**
   * Sort clients by column
   */
  async sortClientsByColumn(columnName: string): Promise<void> {
    const sortButton = this.page.locator(`[data-testid="sort-${columnName}"], th:has-text("${columnName}") button`);
    await this.click(sortButton);
    await this.waitForPageLoad();
  }

  // Pagination Operations

  /**
   * Go to next page
   */
  async goToNextPage(): Promise<void> {
    const isEnabled = await this.nextPageButton.isEnabled();
    if (isEnabled) {
      await this.click(this.nextPageButton);
      await this.waitForPageLoad();
    }
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage(): Promise<void> {
    const isEnabled = await this.previousPageButton.isEnabled();
    if (isEnabled) {
      await this.click(this.previousPageButton);
      await this.waitForPageLoad();
    }
  }

  // Verification Methods

  /**
   * Verify clients page is displayed
   */
  async verifyClientsPageDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(/\/clients/);
    await this.verifyElementVisible(this.pageTitle);
    await this.verifyElementVisible(this.addClientButton);
    await this.verifyElementVisible(this.clientsTable);
  }

  /**
   * Verify client form is displayed
   */
  async verifyClientFormDisplayed(): Promise<void> {
    await this.verifyElementVisible(this.clientForm);
    await this.verifyElementVisible(this.nameField);
    await this.verifyElementVisible(this.emailField);
    await this.verifyElementVisible(this.saveButton);
    await this.verifyElementVisible(this.cancelButton);
  }

  /**
   * Verify delete confirmation modal
   */
  async verifyDeleteModalDisplayed(): Promise<void> {
    await this.verifyElementVisible(this.modal);
    await this.verifyElementVisible(this.confirmDeleteButton);
    await this.verifyElementVisible(this.cancelDeleteButton);
  }

  /**
   * Verify success message is displayed
   */
  async waitForSuccessMessage(): Promise<void> {
    await this.waitForElement(this.successMessage);
    await this.verifyElementVisible(this.successMessage);
  }

  /**
   * Verify error message is displayed
   */
  async verifyErrorMessage(): Promise<void> {
    await this.verifyElementVisible(this.errorMessage);
  }

  /**
   * Verify validation errors
   */
  async verifyValidationErrors(): Promise<void> {
    await this.verifyElementVisible(this.validationErrors);
  }

  /**
   * Verify client exists in table
   */
  async verifyClientExists(clientName: string): Promise<void> {
    const rowIndex = await this.findClientByName(clientName);
    expect(rowIndex).toBeGreaterThan(-1);
  }

  /**
   * Verify client does not exist in table
   */
  async verifyClientNotExists(clientName: string): Promise<void> {
    const rowIndex = await this.findClientByName(clientName);
    expect(rowIndex).toBe(-1);
  }

  /**
   * Verify search results
   */
  async verifySearchResults(expectedCount?: number): Promise<void> {
    await this.waitForPageLoad();
    const actualCount = await this.getClientRowCount();

    if (expectedCount !== undefined) {
      expect(actualCount).toBe(expectedCount);
    } else {
      expect(actualCount).toBeGreaterThanOrEqual(0);
    }
  }

  /**
   * Verify table headers
   */
  async verifyTableHeaders(): Promise<void> {
    await this.verifyElementVisible(this.tableHeaders);

    const expectedHeaders = ["Name", "Email", "Company", "Status"];
    const headerElements = await this.tableHeaders.all();

    for (let i = 0; i < expectedHeaders.length; i++) {
      const headerText = await headerElements[i]?.textContent();
      expect(headerText).toContain(expectedHeaders[i]);
    }
  }

  /**
   * Verify pagination controls
   */
  async verifyPaginationControls(): Promise<void> {
    const paginationVisible = await this.isVisible(this.pagination);
    if (paginationVisible) {
      await this.verifyElementVisible(this.pagination);
    }
  }
}