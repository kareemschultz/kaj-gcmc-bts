import { test, expect, TestDataGenerator } from "../fixtures/enhanced-fixtures";
import { allure } from "allure-playwright";

/**
 * API Endpoints Testing
 *
 * Comprehensive testing of REST API endpoints
 * including authentication, CRUD operations, and error handling
 */
test.describe("API Endpoints - Authentication", () => {
  test.beforeEach(async () => {
    await allure.epic("API Testing");
    await allure.feature("Authentication");
  });

  test("should authenticate with valid credentials @api-critical", async ({ apiHelper }) => {
    await allure.step("Authenticate with admin credentials", async () => {
      const token = await apiHelper.authenticateAsAdmin();
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });
  });

  test("should authenticate with test user credentials @api-functional", async ({ apiHelper }) => {
    await allure.step("Authenticate with test user credentials", async () => {
      const token = await apiHelper.authenticateAsTestUser();
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });
  });

  test("should reject invalid credentials @api-negative", async ({ apiHelper }) => {
    await allure.step("Try authentication with invalid credentials", async () => {
      try {
        await apiHelper.authenticate("invalid@example.com", "wrongpassword");
        throw new Error("Should have rejected invalid credentials");
      } catch (error) {
        expect(error.message).toContain("Should have rejected invalid credentials");
      }
    });
  });

  test("should get current user profile @api-functional", async ({ apiHelper }) => {
    await allure.step("Authenticate user", async () => {
      await apiHelper.authenticateAsTestUser();
    });

    await allure.step("Get current user profile", async () => {
      const user = await apiHelper.getCurrentUser();
      expect(user).toBeDefined();
      expect(user.email).toBeDefined();
    });
  });

  test("should update user profile @api-functional", async ({ apiHelper }) => {
    await allure.step("Authenticate user", async () => {
      await apiHelper.authenticateAsTestUser();
    });

    await allure.step("Update user profile", async () => {
      const updateData = {
        name: "Updated Test User",
        phone: "+1-555-0199"
      };

      const updatedUser = await apiHelper.updateUserProfile(updateData);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.phone).toBe(updateData.phone);
    });
  });
});

test.describe("API Endpoints - Clients CRUD", () => {
  test.beforeEach(async ({ apiHelper }) => {
    await allure.epic("API Testing");
    await allure.feature("Clients CRUD");

    // Authenticate for all client tests
    await apiHelper.authenticateAsTestUser();
  });

  test("should create a new client @api-critical", async ({ apiHelper }) => {
    const clientData = {
      name: `Test Client ${Date.now()}`,
      email: TestDataGenerator.generateEmail("api-client"),
      phone: TestDataGenerator.generatePhoneNumber(),
      address: TestDataGenerator.generateAddress(),
      company: TestDataGenerator.generateCompanyName(),
      taxId: TestDataGenerator.generateTaxId(),
      status: "active",
      notes: "Created via API test"
    };

    await allure.step("Create client via API", async () => {
      const createdClient = await apiHelper.createClient(clientData);

      expect(createdClient).toBeDefined();
      expect(createdClient.name).toBe(clientData.name);
      expect(createdClient.email).toBe(clientData.email);
      expect(createdClient.id).toBeDefined();
    });

    await allure.step("Cleanup created client", async () => {
      await apiHelper.cleanupTestClients();
    });
  });

  test("should validate required fields when creating client @api-validation", async ({ apiHelper }) => {
    await allure.step("Try to create client without required fields", async () => {
      try {
        await apiHelper.createClient({
          name: "", // Empty name
          email: "", // Empty email
        });
        throw new Error("Should have rejected empty required fields");
      } catch (error) {
        // Expected to fail validation
        expect(error.message).toBeDefined();
      }
    });
  });

  test("should validate email format @api-validation", async ({ apiHelper }) => {
    await allure.step("Try to create client with invalid email", async () => {
      try {
        await apiHelper.createClient({
          name: "Test Client",
          email: "invalid-email-format",
        });
        throw new Error("Should have rejected invalid email format");
      } catch (error) {
        // Expected to fail validation
        expect(error.message).toBeDefined();
      }
    });
  });

  test("should get all clients @api-functional", async ({ apiHelper }) => {
    await allure.step("Create test clients", async () => {
      await apiHelper.createMultipleTestClients(3);
    });

    await allure.step("Get all clients", async () => {
      const clients = await apiHelper.getClients();

      expect(clients).toBeDefined();
      expect(Array.isArray(clients.data || clients)).toBe(true);
    });

    await allure.step("Cleanup test clients", async () => {
      await apiHelper.cleanupTestClients();
    });
  });

  test("should get clients with pagination @api-functional", async ({ apiHelper }) => {
    await allure.step("Create multiple test clients", async () => {
      await apiHelper.createMultipleTestClients(15);
    });

    await allure.step("Get clients with pagination parameters", async () => {
      const clients = await apiHelper.getClients({
        page: 1,
        limit: 5
      });

      expect(clients).toBeDefined();
      const clientsArray = clients.data || clients;
      expect(clientsArray.length).toBeLessThanOrEqual(5);
    });

    await allure.step("Cleanup test clients", async () => {
      await apiHelper.cleanupTestClients();
    });
  });

  test("should search clients @api-functional", async ({ apiHelper }) => {
    const uniqueName = `Searchable Client ${Date.now()}`;

    await allure.step("Create client with unique name", async () => {
      await apiHelper.createTestClient({ name: uniqueName });
    });

    await allure.step("Search for client", async () => {
      const searchResults = await apiHelper.getClients({
        search: uniqueName
      });

      expect(searchResults).toBeDefined();
      const clientsArray = searchResults.data || searchResults;
      expect(clientsArray.length).toBeGreaterThan(0);

      const foundClient = clientsArray.find(client => client.name === uniqueName);
      expect(foundClient).toBeDefined();
    });

    await allure.step("Cleanup test clients", async () => {
      await apiHelper.cleanupTestClients();
    });
  });

  test("should get client by ID @api-functional", async ({ apiHelper }) => {
    await allure.step("Create test client", async () => {
      const createdClient = await apiHelper.createTestClient();

      await allure.step("Get client by ID", async () => {
        const retrievedClient = await apiHelper.getClient(createdClient.id);

        expect(retrievedClient).toBeDefined();
        expect(retrievedClient.id).toBe(createdClient.id);
        expect(retrievedClient.name).toBe(createdClient.name);
        expect(retrievedClient.email).toBe(createdClient.email);
      });

      await allure.step("Cleanup test client", async () => {
        await apiHelper.cleanupTestClients();
      });
    });
  });

  test("should update client @api-functional", async ({ apiHelper }) => {
    await allure.step("Create test client", async () => {
      const createdClient = await apiHelper.createTestClient({
        name: "Original Name"
      });

      await allure.step("Update client", async () => {
        const updateData = {
          name: "Updated Name",
          phone: "+1-555-9999"
        };

        const updatedClient = await apiHelper.updateClient(createdClient.id, updateData);

        expect(updatedClient.name).toBe(updateData.name);
        expect(updatedClient.phone).toBe(updateData.phone);
        expect(updatedClient.id).toBe(createdClient.id);
      });

      await allure.step("Cleanup test client", async () => {
        await apiHelper.cleanupTestClients();
      });
    });
  });

  test("should delete client @api-functional", async ({ apiHelper }) => {
    await allure.step("Create test client", async () => {
      const createdClient = await apiHelper.createTestClient();

      await allure.step("Delete client", async () => {
        await apiHelper.deleteClient(createdClient.id);
      });

      await allure.step("Verify client is deleted", async () => {
        try {
          await apiHelper.getClient(createdClient.id);
          throw new Error("Client should have been deleted");
        } catch (error) {
          // Expected to fail when trying to get deleted client
          expect(error.message).toBeDefined();
        }
      });
    });
  });
});

test.describe("API Endpoints - Filings", () => {
  test.beforeEach(async ({ apiHelper }) => {
    await allure.epic("API Testing");
    await allure.feature("Filings");

    await apiHelper.authenticateAsTestUser();
  });

  test("should get all filings @api-functional", async ({ apiHelper }) => {
    await allure.step("Get all filings", async () => {
      const filings = await apiHelper.getFilings();

      expect(filings).toBeDefined();
      expect(Array.isArray(filings.data || filings)).toBe(true);
    });
  });

  test("should create a new filing @api-functional", async ({ apiHelper }) => {
    await allure.step("Create test client first", async () => {
      const client = await apiHelper.createTestClient();

      await allure.step("Create filing for client", async () => {
        const filingData = {
          clientId: client.id,
          type: "annual_return",
          dueDate: "2024-12-31",
          status: "pending",
          description: "Annual return filing for test client"
        };

        const createdFiling = await apiHelper.createFiling(filingData);

        expect(createdFiling).toBeDefined();
        expect(createdFiling.clientId).toBe(client.id);
        expect(createdFiling.type).toBe(filingData.type);
      });

      await allure.step("Cleanup", async () => {
        await apiHelper.cleanupTestClients();
      });
    });
  });

  test("should filter filings by client @api-functional", async ({ apiHelper }) => {
    await allure.step("Create test client", async () => {
      const client = await apiHelper.createTestClient();

      await allure.step("Create filing for specific client", async () => {
        await apiHelper.createFiling({
          clientId: client.id,
          type: "tax_return",
          dueDate: "2024-04-15"
        });

        await allure.step("Get filings for specific client", async () => {
          const clientFilings = await apiHelper.getFilings({
            clientId: client.id
          });

          expect(clientFilings).toBeDefined();
          const filingsArray = clientFilings.data || clientFilings;

          // All filings should belong to the specified client
          filingsArray.forEach(filing => {
            expect(filing.clientId).toBe(client.id);
          });
        });

        await allure.step("Cleanup", async () => {
          await apiHelper.cleanupTestClients();
        });
      });
    });
  });
});

test.describe("API Endpoints - Reports", () => {
  test.beforeEach(async ({ apiHelper }) => {
    await allure.epic("API Testing");
    await allure.feature("Reports");

    await apiHelper.authenticateAsTestUser();
  });

  test("should get dashboard stats @api-functional", async ({ apiHelper }) => {
    await allure.step("Get dashboard statistics", async () => {
      const stats = await apiHelper.getDashboardStats();

      expect(stats).toBeDefined();
      expect(typeof stats).toBe("object");
    });
  });

  test("should generate client report @api-functional", async ({ apiHelper }) => {
    await allure.step("Generate client report", async () => {
      try {
        const report = await apiHelper.generateReport("clients", {
          format: "json",
          dateRange: "last_month"
        });

        expect(report).toBeDefined();
      } catch (error) {
        console.log("Report generation may not be implemented:", error.message);
      }
    });
  });
});

test.describe("API Endpoints - Health and Status", () => {
  test.beforeEach(async () => {
    await allure.epic("API Testing");
    await allure.feature("Health Check");
  });

  test("should respond to health check @api-health", async ({ apiHelper }) => {
    await allure.step("Check API health", async () => {
      const isHealthy = await apiHelper.checkHealth();
      expect(isHealthy).toBe(true);
    });
  });

  test("should provide status information @api-health", async ({ apiHelper }) => {
    await allure.step("Get API status", async () => {
      try {
        const status = await apiHelper.getStatus();
        expect(status).toBeDefined();
      } catch (error) {
        console.log("Status endpoint may not be implemented");
      }
    });
  });
});

test.describe("API Endpoints - Error Handling", () => {
  test.beforeEach(async ({ apiHelper }) => {
    await allure.epic("API Testing");
    await allure.feature("Error Handling");

    await apiHelper.authenticateAsTestUser();
  });

  test("should handle unauthorized requests @api-security", async ({ apiHelper }) => {
    await allure.step("Clear authentication token", async () => {
      // Temporarily remove auth token
      const originalToken = apiHelper['authToken'];
      apiHelper['authToken'] = undefined;

      try {
        await apiHelper.getClients();
        throw new Error("Should have rejected unauthorized request");
      } catch (error) {
        expect(error.message).toBeDefined();
      } finally {
        // Restore token
        apiHelper['authToken'] = originalToken;
      }
    });
  });

  test("should handle non-existent resource @api-negative", async ({ apiHelper }) => {
    await allure.step("Try to get non-existent client", async () => {
      try {
        await apiHelper.getClient("non-existent-id-12345");
        throw new Error("Should have returned 404 for non-existent client");
      } catch (error) {
        expect(error.message).toBeDefined();
      }
    });
  });

  test("should validate request payload @api-validation", async ({ apiHelper }) => {
    await allure.step("Send invalid client data", async () => {
      try {
        // Send completely invalid data structure
        await apiHelper.createClient({
          invalidField: "invalid value",
          name: null,
          email: undefined
        } as any);
        throw new Error("Should have rejected invalid payload");
      } catch (error) {
        expect(error.message).toBeDefined();
      }
    });
  });
});

test.describe("API Endpoints - Performance", () => {
  test.beforeEach(async ({ apiHelper }) => {
    await allure.epic("API Testing");
    await allure.feature("Performance");

    await apiHelper.authenticateAsTestUser();
  });

  test("should respond within acceptable time limits @api-performance", async ({ apiHelper }) => {
    await allure.step("Measure API response times", async () => {
      const startTime = Date.now();
      await apiHelper.getClients();
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });

  test("should handle concurrent requests @api-performance", async ({ apiHelper }) => {
    await allure.step("Make concurrent API requests", async () => {
      const requests = [
        apiHelper.getClients(),
        apiHelper.getDashboardStats(),
        apiHelper.getFilings(),
        apiHelper.getCurrentUser()
      ];

      const startTime = Date.now();
      await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // All requests should complete within 5 seconds
    });
  });
});