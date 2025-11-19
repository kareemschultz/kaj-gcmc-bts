import type { APIRequestContext, Page } from "@playwright/test";
import { expect, request } from "@playwright/test";

/**
 * API Helper Class
 *
 * Provides utilities for API testing including:
 * - Authentication
 * - CRUD operations
 * - Request/Response validation
 * - Error handling
 */
export class ApiHelper {
  private apiContext: APIRequestContext | undefined;
  private baseURL: string;
  private authToken: string | undefined;

  constructor(baseURL: string = process.env.API_URL || "http://localhost:3003") {
    this.baseURL = baseURL;
  }

  /**
   * Initialize API context
   */
  async initializeContext(): Promise<void> {
    this.apiContext = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Authenticate and get token
   */
  async authenticate(email: string, password: string): Promise<string> {
    if (!this.apiContext) {
      await this.initializeContext();
    }

    const response = await this.apiContext!.post("/api/auth/login", {
      data: {
        email,
        password,
      },
    });

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    this.authToken = responseData.token || responseData.accessToken;

    expect(this.authToken).toBeDefined();
    return this.authToken!;
  }

  /**
   * Authenticate as admin
   */
  async authenticateAsAdmin(): Promise<string> {
    return await this.authenticate("admin@gcmc-kaj.com", "AdminPassword123");
  }

  /**
   * Authenticate as test user
   */
  async authenticateAsTestUser(): Promise<string> {
    return await this.authenticate("admin@test.gcmc.com", "TestPassword123!");
  }

  /**
   * Get authenticated headers
   */
  private getAuthHeaders(): Record<string, string> {
    if (!this.authToken) {
      throw new Error("No authentication token available. Please authenticate first.");
    }

    return {
      "Authorization": `Bearer ${this.authToken}`,
      "Content-Type": "application/json",
    };
  }

  // Client API Methods

  /**
   * Get all clients
   */
  async getClients(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<any> {
    if (!this.apiContext) await this.initializeContext();

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.status) searchParams.append("status", params.status);

    const url = `/api/clients${searchParams.toString() ? "?" + searchParams.toString() : ""}`;

    const response = await this.apiContext!.get(url, {
      headers: this.getAuthHeaders(),
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Create a new client
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
  }): Promise<any> {
    if (!this.apiContext) await this.initializeContext();

    const response = await this.apiContext!.post("/api/clients", {
      headers: this.getAuthHeaders(),
      data: clientData,
    });

    expect(response.status()).toBe(201);
    return await response.json();
  }

  /**
   * Get client by ID
   */
  async getClient(clientId: string): Promise<any> {
    if (!this.apiContext) await this.initializeContext();

    const response = await this.apiContext!.get(`/api/clients/${clientId}`, {
      headers: this.getAuthHeaders(),
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Update client
   */
  async updateClient(clientId: string, updateData: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    company: string;
    taxId: string;
    status: string;
    notes: string;
  }>): Promise<any> {
    if (!this.apiContext) await this.initializeContext();

    const response = await this.apiContext!.put(`/api/clients/${clientId}`, {
      headers: this.getAuthHeaders(),
      data: updateData,
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Delete client
   */
  async deleteClient(clientId: string): Promise<void> {
    if (!this.apiContext) await this.initializeContext();

    const response = await this.apiContext!.delete(`/api/clients/${clientId}`, {
      headers: this.getAuthHeaders(),
    });

    expect(response.status()).toBe(204);
  }

  // Filing API Methods

  /**
   * Get all filings
   */
  async getFilings(params?: {
    page?: number;
    limit?: number;
    clientId?: string;
    status?: string;
  }): Promise<any> {
    if (!this.apiContext) await this.initializeContext();

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.clientId) searchParams.append("clientId", params.clientId);
    if (params?.status) searchParams.append("status", params.status);

    const url = `/api/filings${searchParams.toString() ? "?" + searchParams.toString() : ""}`;

    const response = await this.apiContext!.get(url, {
      headers: this.getAuthHeaders(),
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Create a new filing
   */
  async createFiling(filingData: {
    clientId: string;
    type: string;
    dueDate: string;
    status?: string;
    description?: string;
  }): Promise<any> {
    if (!this.apiContext) await this.initializeContext();

    const response = await this.apiContext!.post("/api/filings", {
      headers: this.getAuthHeaders(),
      data: filingData,
    });

    expect(response.status()).toBe(201);
    return await response.json();
  }

  // Report API Methods

  /**
   * Generate report
   */
  async generateReport(reportType: string, params?: any): Promise<any> {
    if (!this.apiContext) await this.initializeContext();

    const response = await this.apiContext!.post(`/api/reports/${reportType}`, {
      headers: this.getAuthHeaders(),
      data: params,
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(): Promise<any> {
    if (!this.apiContext) await this.initializeContext();

    const response = await this.apiContext!.get("/api/dashboard/stats", {
      headers: this.getAuthHeaders(),
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  // User API Methods

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<any> {
    if (!this.apiContext) await this.initializeContext();

    const response = await this.apiContext!.get("/api/auth/me", {
      headers: this.getAuthHeaders(),
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updateData: {
    name?: string;
    email?: string;
    phone?: string;
  }): Promise<any> {
    if (!this.apiContext) await this.initializeContext();

    const response = await this.apiContext!.put("/api/auth/profile", {
      headers: this.getAuthHeaders(),
      data: updateData,
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  // Health Check and Status

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    if (!this.apiContext) await this.initializeContext();

    try {
      const response = await this.apiContext!.get("/api/health");
      return response.status() === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API status
   */
  async getStatus(): Promise<any> {
    if (!this.apiContext) await this.initializeContext();

    const response = await this.apiContext!.get("/api/status");
    expect(response.status()).toBe(200);
    return await response.json();
  }

  // Utility Methods

  /**
   * Validate response schema
   */
  validateResponseSchema(response: any, expectedKeys: string[]): void {
    for (const key of expectedKeys) {
      expect(response).toHaveProperty(key);
    }
  }

  /**
   * Validate error response
   */
  async validateErrorResponse(response: any, expectedStatus: number, expectedMessage?: string): Promise<void> {
    expect(response.status()).toBe(expectedStatus);

    const errorData = await response.json();
    expect(errorData).toHaveProperty("error");

    if (expectedMessage) {
      expect(errorData.error).toContain(expectedMessage);
    }
  }

  /**
   * Wait for async operation
   */
  async waitForOperation(
    operation: () => Promise<any>,
    condition: (result: any) => boolean,
    maxAttempts: number = 10,
    delayMs: number = 1000
  ): Promise<any> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await operation();
        if (condition(result)) {
          return result;
        }
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error(`Operation did not complete within ${maxAttempts} attempts`);
  }

  /**
   * Cleanup - dispose API context
   */
  async cleanup(): Promise<void> {
    if (this.apiContext) {
      await this.apiContext.dispose();
    }
  }

  /**
   * Create test data helper
   */
  async createTestClient(overrides?: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    company: string;
  }>): Promise<any> {
    const timestamp = Date.now();
    const testData = {
      name: `Test Client ${timestamp}`,
      email: `test.client.${timestamp}@example.com`,
      phone: "+1-555-0123",
      address: "123 Test St, Test City, TC 12345",
      company: `Test Company ${timestamp}`,
      ...overrides,
    };

    return await this.createClient(testData);
  }

  /**
   * Create multiple test clients
   */
  async createMultipleTestClients(count: number): Promise<any[]> {
    const clients: any[] = [];

    for (let i = 0; i < count; i++) {
      const client = await this.createTestClient({
        name: `Test Client ${Date.now()}-${i}`,
        email: `test.client.${Date.now()}.${i}@example.com`,
      });
      clients.push(client);
    }

    return clients;
  }

  /**
   * Clean up test clients
   */
  async cleanupTestClients(): Promise<void> {
    try {
      const clients = await this.getClients({ search: "Test Client" });

      if (clients.data) {
        for (const client of clients.data) {
          await this.deleteClient(client.id);
        }
      }
    } catch (error) {
      console.log("Error cleaning up test clients:", error);
    }
  }
}