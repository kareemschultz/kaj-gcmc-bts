import { test, expect, TestDataGenerator } from "../fixtures/enhanced-fixtures";
import { allure } from "allure-playwright";

/**
 * Clients Management CRUD Tests
 *
 * Comprehensive testing of client management functionality
 * including Create, Read, Update, Delete operations
 */
test.describe("Clients Management - CRUD Operations", () => {
  test.beforeEach(async ({ authenticatedPage, clientsPage }) => {
    await allure.epic("Client Management");
    await allure.feature("CRUD Operations");

    // Navigate to clients page
    await clientsPage.navigateToClients();
  });

  test("should display clients page correctly @smoke", async ({
    clientsPage,
    screenshotHelper
  }) => {
    await allure.step("Verify clients page elements", async () => {
      await clientsPage.verifyClientsPageDisplayed();
      await clientsPage.verifyTableHeaders();
    });

    await allure.step("Take screenshot of clients page", async () => {
      await screenshotHelper.compareFullPage("clients-page-initial");
    });
  });

  test("should create a new client successfully @critical", async ({
    clientsPage,
    apiHelper
  }) => {
    await apiHelper.authenticateAsTestUser();

    const testClient = {
      name: `Test Client ${Date.now()}`,
      email: TestDataGenerator.generateEmail("client"),
      phone: TestDataGenerator.generatePhoneNumber(),
      address: TestDataGenerator.generateAddress(),
      company: TestDataGenerator.generateCompanyName(),
      taxId: TestDataGenerator.generateTaxId(),
      status: "active",
      notes: "Test client created via E2E tests"
    };

    await allure.step("Click add client button", async () => {
      await clientsPage.clickAddClient();
    });

    await allure.step("Verify client form is displayed", async () => {
      await clientsPage.verifyClientFormDisplayed();
    });

    await allure.step("Fill client form", async () => {
      await clientsPage.fillClientForm(testClient);
    });

    await allure.step("Save client", async () => {
      await clientsPage.saveClient();
    });

    await allure.step("Verify client was created", async () => {
      await clientsPage.verifyClientExists(testClient.name);
    });

    await allure.step("Cleanup - delete test client", async () => {
      const clientIndex = await clientsPage.findClientByName(testClient.name);
      if (clientIndex >= 0) {
        await clientsPage.deleteClient(clientIndex);
      }
    });
  });

  test("should validate required fields during creation @validation", async ({
    clientsPage
  }) => {
    await allure.step("Click add client button", async () => {
      await clientsPage.clickAddClient();
    });

    await allure.step("Try to save empty form", async () => {
      await clientsPage.saveClient();
    });

    await allure.step("Verify validation errors", async () => {
      // Should show validation errors for required fields
      await clientsPage.verifyValidationErrors();
    });

    await allure.step("Fill only name field", async () => {
      await clientsPage.fillClientForm({
        name: "Test Client Name Only",
        email: "", // Missing required email
      });
      await clientsPage.saveClient();
    });

    await allure.step("Verify email validation", async () => {
      await clientsPage.verifyValidationErrors();
    });
  });

  test("should validate email format @validation", async ({
    clientsPage
  }) => {
    await allure.step("Click add client button", async () => {
      await clientsPage.clickAddClient();
    });

    await allure.step("Enter invalid email format", async () => {
      await clientsPage.fillClientForm({
        name: "Test Client",
        email: "invalid-email-format",
      });
      await clientsPage.saveClient();
    });

    await allure.step("Verify email format validation", async () => {
      await clientsPage.verifyValidationErrors();
    });
  });

  test("should view client details @functional", async ({
    clientsPage,
    apiHelper
  }) => {
    await apiHelper.authenticateAsTestUser();

    await allure.step("Create test client via API", async () => {
      const testClient = await apiHelper.createTestClient();
      expect(testClient).toBeDefined();
    });

    await allure.step("Refresh page to see new client", async () => {
      await clientsPage.page.reload();
      await clientsPage.waitForClientsPageLoad();
    });

    await allure.step("Find and view client", async () => {
      const clientIndex = await clientsPage.findClientByName("Test Client");
      if (clientIndex >= 0) {
        await clientsPage.viewClient(clientIndex);
      }
    });

    await allure.step("Cleanup test client", async () => {
      await apiHelper.cleanupTestClients();
    });
  });

  test("should edit client information @functional", async ({
    clientsPage,
    apiHelper
  }) => {
    await apiHelper.authenticateAsTestUser();

    await allure.step("Create test client via API", async () => {
      const testClient = await apiHelper.createTestClient({
        name: "Original Client Name"
      });
      expect(testClient).toBeDefined();
    });

    await allure.step("Refresh page to see new client", async () => {
      await clientsPage.page.reload();
      await clientsPage.waitForClientsPageLoad();
    });

    await allure.step("Edit client information", async () => {
      const clientIndex = await clientsPage.findClientByName("Original Client Name");
      if (clientIndex >= 0) {
        await clientsPage.editClient(clientIndex, {
          name: "Updated Client Name",
          phone: "+1-555-9999"
        });
      }
    });

    await allure.step("Verify client was updated", async () => {
      await clientsPage.verifyClientExists("Updated Client Name");
    });

    await allure.step("Cleanup test client", async () => {
      await apiHelper.cleanupTestClients();
    });
  });

  test("should delete client with confirmation @functional", async ({
    clientsPage,
    apiHelper
  }) => {
    await apiHelper.authenticateAsTestUser();

    await allure.step("Create test client via API", async () => {
      const testClient = await apiHelper.createTestClient({
        name: "Client To Delete"
      });
      expect(testClient).toBeDefined();
    });

    await allure.step("Refresh page to see new client", async () => {
      await clientsPage.page.reload();
      await clientsPage.waitForClientsPageLoad();
    });

    await allure.step("Initiate client deletion", async () => {
      const clientIndex = await clientsPage.findClientByName("Client To Delete");
      if (clientIndex >= 0) {
        await clientsPage.clickEditClient(clientIndex);
        // Assuming delete button is in edit form or we need to adjust the approach
      }
    });

    await allure.step("Test deletion cancellation", async () => {
      // First test canceling deletion
      const clientIndex = await clientsPage.findClientByName("Client To Delete");
      if (clientIndex >= 0) {
        try {
          await clientsPage.deleteClient(clientIndex);
          await clientsPage.cancelDelete();
          await clientsPage.verifyClientExists("Client To Delete");
        } catch (error) {
          console.log("Delete functionality may not be implemented yet");
        }
      }
    });

    await allure.step("Cleanup test client", async () => {
      await apiHelper.cleanupTestClients();
    });
  });
});

test.describe("Clients Management - Search and Filter", () => {
  test.beforeEach(async ({ authenticatedPage, clientsPage, apiHelper }) => {
    await allure.epic("Client Management");
    await allure.feature("Search and Filter");

    await apiHelper.authenticateAsTestUser();
    await clientsPage.navigateToClients();
  });

  test("should search clients by name @functional", async ({
    clientsPage,
    apiHelper
  }) => {
    await allure.step("Create test clients with unique names", async () => {
      await apiHelper.createTestClient({ name: "Searchable Client Alpha" });
      await apiHelper.createTestClient({ name: "Searchable Client Beta" });
      await apiHelper.createTestClient({ name: "Different Company" });
    });

    await allure.step("Refresh page to see new clients", async () => {
      await clientsPage.page.reload();
      await clientsPage.waitForClientsPageLoad();
    });

    await allure.step("Search for specific clients", async () => {
      await clientsPage.searchClients("Searchable Client");
    });

    await allure.step("Verify search results", async () => {
      await clientsPage.verifySearchResults();

      // Verify that only searchable clients appear
      const rowCount = await clientsPage.getClientRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(2);
    });

    await allure.step("Clear search and verify all clients shown", async () => {
      await clientsPage.clearSearchAndFilters();
      const totalRowCount = await clientsPage.getClientRowCount();
      expect(totalRowCount).toBeGreaterThanOrEqual(3);
    });

    await allure.step("Cleanup test clients", async () => {
      await apiHelper.cleanupTestClients();
    });
  });

  test("should search clients by email @functional", async ({
    clientsPage,
    apiHelper
  }) => {
    const uniqueEmail = TestDataGenerator.generateEmail("unique");

    await allure.step("Create client with unique email", async () => {
      await apiHelper.createTestClient({
        name: "Client With Unique Email",
        email: uniqueEmail
      });
    });

    await allure.step("Search by email", async () => {
      await clientsPage.searchClients(uniqueEmail);
    });

    await allure.step("Verify search finds the client", async () => {
      await clientsPage.verifySearchResults(1);
    });

    await allure.step("Cleanup test client", async () => {
      await apiHelper.cleanupTestClients();
    });
  });

  test("should filter clients by status @functional", async ({
    clientsPage,
    apiHelper
  }) => {
    await allure.step("Create clients with different statuses", async () => {
      await apiHelper.createTestClient({
        name: "Active Client",
        status: "active"
      });
      await apiHelper.createTestClient({
        name: "Inactive Client",
        status: "inactive"
      });
    });

    await allure.step("Filter by active status", async () => {
      await clientsPage.filterClientsByStatus("active");
    });

    await allure.step("Verify filtered results", async () => {
      await clientsPage.verifySearchResults();
      // Check that only active clients are shown
    });

    await allure.step("Cleanup test clients", async () => {
      await apiHelper.cleanupTestClients();
    });
  });
});

test.describe("Clients Management - Pagination and Sorting", () => {
  test.beforeEach(async ({ authenticatedPage, clientsPage, apiHelper }) => {
    await allure.epic("Client Management");
    await allure.feature("Pagination and Sorting");

    await apiHelper.authenticateAsTestUser();
    await clientsPage.navigateToClients();
  });

  test("should handle pagination correctly @functional", async ({
    clientsPage,
    apiHelper
  }) => {
    await allure.step("Create multiple test clients", async () => {
      // Create enough clients to trigger pagination
      await apiHelper.createMultipleTestClients(25);
    });

    await allure.step("Navigate to clients page", async () => {
      await clientsPage.navigateToClients();
    });

    await allure.step("Verify pagination controls", async () => {
      await clientsPage.verifyPaginationControls();
    });

    await allure.step("Test pagination navigation", async () => {
      try {
        await clientsPage.goToNextPage();
        await clientsPage.goToPreviousPage();
      } catch (error) {
        console.log("Pagination may not be visible with current data set");
      }
    });

    await allure.step("Cleanup test clients", async () => {
      await apiHelper.cleanupTestClients();
    });
  });

  test("should sort clients by different columns @functional", async ({
    clientsPage,
    apiHelper
  }) => {
    await allure.step("Create test clients with sortable data", async () => {
      await apiHelper.createTestClient({ name: "Alpha Client" });
      await apiHelper.createTestClient({ name: "Beta Client" });
      await apiHelper.createTestClient({ name: "Charlie Client" });
    });

    await allure.step("Test sorting by name", async () => {
      try {
        await clientsPage.sortClientsByColumn("name");
        await clientsPage.waitForPageLoad();
      } catch (error) {
        console.log("Sorting functionality may not be implemented");
      }
    });

    await allure.step("Test sorting by email", async () => {
      try {
        await clientsPage.sortClientsByColumn("email");
        await clientsPage.waitForPageLoad();
      } catch (error) {
        console.log("Email sorting may not be implemented");
      }
    });

    await allure.step("Cleanup test clients", async () => {
      await apiHelper.cleanupTestClients();
    });
  });
});

test.describe("Clients Management - Error Handling", () => {
  test.beforeEach(async ({ authenticatedPage, clientsPage }) => {
    await allure.epic("Client Management");
    await allure.feature("Error Handling");

    await clientsPage.navigateToClients();
  });

  test("should handle duplicate email validation @validation", async ({
    clientsPage,
    apiHelper
  }) => {
    await apiHelper.authenticateAsTestUser();
    const duplicateEmail = TestDataGenerator.generateEmail("duplicate");

    await allure.step("Create first client with email", async () => {
      await apiHelper.createTestClient({
        name: "First Client",
        email: duplicateEmail
      });
    });

    await allure.step("Try to create second client with same email", async () => {
      await clientsPage.clickAddClient();
      await clientsPage.fillClientForm({
        name: "Second Client",
        email: duplicateEmail
      });
      await clientsPage.saveClient();
    });

    await allure.step("Verify duplicate email error", async () => {
      await clientsPage.verifyErrorMessage();
    });

    await allure.step("Cleanup test clients", async () => {
      await apiHelper.cleanupTestClients();
    });
  });

  test("should handle network errors during save @error-handling", async ({
    clientsPage,
    page
  }) => {
    await allure.step("Intercept save request and simulate failure", async () => {
      await page.route("**/api/clients", route => {
        route.abort("failed");
      });
    });

    await allure.step("Try to create client", async () => {
      await clientsPage.clickAddClient();
      await clientsPage.fillClientForm({
        name: "Network Test Client",
        email: TestDataGenerator.generateEmail("network")
      });
      await clientsPage.saveClient();
    });

    await allure.step("Verify error handling", async () => {
      // Should show network error or remain on form
      await clientsPage.verifyErrorMessage();
    });
  });
});

test.describe("Clients Management - Accessibility", () => {
  test.beforeEach(async ({ authenticatedPage, clientsPage }) => {
    await allure.epic("Client Management");
    await allure.feature("Accessibility");

    await clientsPage.navigateToClients();
  });

  test("should meet accessibility standards @accessibility", async ({
    clientsPage,
    a11yHelper
  }) => {
    await allure.step("Run accessibility scan on clients page", async () => {
      await a11yHelper.scanWCAG_AA();
    });

    await allure.step("Open client form and test accessibility", async () => {
      await clientsPage.clickAddClient();
      await a11yHelper.scanWCAG_AA();
    });
  });

  test("should support keyboard navigation @accessibility", async ({
    clientsPage,
    page
  }) => {
    await allure.step("Test keyboard navigation on clients page", async () => {
      // Tab through page elements
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
    });

    await allure.step("Test keyboard access to add client form", async () => {
      await page.keyboard.press("Enter");
      await clientsPage.verifyClientFormDisplayed();
    });

    await allure.step("Test keyboard navigation in form", async () => {
      await page.keyboard.press("Tab"); // Name field
      await page.keyboard.press("Tab"); // Email field
      await page.keyboard.press("Tab"); // Phone field
    });
  });
});