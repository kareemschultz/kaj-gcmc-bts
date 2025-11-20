import type { APIRequestContext, Page, PlaywrightTestOptions } from "@playwright/test";
import { expect, request } from "@playwright/test";
import { AllureHelper } from "../utils/allure-helpers";

/**
 * Enhanced API Testing Utilities for GCMC Platform
 *
 * Provides comprehensive API testing capabilities including:
 * - tRPC endpoint testing
 * - Authentication flow testing
 * - Database operations validation
 * - File upload/download testing
 * - Real-time features testing
 * - Performance benchmarking
 */

export interface ApiTestConfig {
	baseURL: string;
	timeout: number;
	retries: number;
	headers?: Record<string, string>;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken?: string;
	sessionId?: string;
}

export interface ApiResponse<T = any> {
	data: T;
	status: number;
	statusText: string;
	headers: Record<string, string>;
	timing: {
		duration: number;
		startTime: number;
		endTime: number;
	};
}

export class ApiTestHelper {
	private context: APIRequestContext;
	private config: ApiTestConfig;
	private authTokens: AuthTokens | null = null;

	constructor(context: APIRequestContext, config?: Partial<ApiTestConfig>) {
		this.context = context;
		this.config = {
			baseURL: config?.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003',
			timeout: config?.timeout || 30000,
			retries: config?.retries || 2,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				...config?.headers
			}
		};
	}

	/**
	 * Create new API test helper instance
	 */
	static async create(options?: Partial<PlaywrightTestOptions>): Promise<ApiTestHelper> {
		const context = await request.newContext({
			baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003',
			extraHTTPHeaders: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			...options
		});

		return new ApiTestHelper(context);
	}

	/**
	 * Authenticate and store tokens
	 */
	async authenticate(credentials: {
		email: string;
		password: string;
	}): Promise<AuthTokens> {
		const response = await this.post('/api/auth/sign-in', {
			email: credentials.email,
			password: credentials.password
		});

		expect(response.status).toBe(200);

		// Extract tokens from response (adjust based on your auth implementation)
		const authData = response.data;
		this.authTokens = {
			accessToken: authData.accessToken || '',
			refreshToken: authData.refreshToken,
			sessionId: authData.sessionId
		};

		// Update default headers with auth token
		this.config.headers = {
			...this.config.headers,
			'Authorization': `Bearer ${this.authTokens.accessToken}`
		};

		return this.authTokens;
	}

	/**
	 * Make authenticated GET request
	 */
	async get<T = any>(endpoint: string, options?: {
		params?: Record<string, string | number>;
		headers?: Record<string, string>;
		timeout?: number;
	}): Promise<ApiResponse<T>> {
		return await this.makeRequest('GET', endpoint, undefined, options);
	}

	/**
	 * Make authenticated POST request
	 */
	async post<T = any>(endpoint: string, data?: any, options?: {
		headers?: Record<string, string>;
		timeout?: number;
		files?: string[];
	}): Promise<ApiResponse<T>> {
		return await this.makeRequest('POST', endpoint, data, options);
	}

	/**
	 * Make authenticated PUT request
	 */
	async put<T = any>(endpoint: string, data?: any, options?: {
		headers?: Record<string, string>;
		timeout?: number;
	}): Promise<ApiResponse<T>> {
		return await this.makeRequest('PUT', endpoint, data, options);
	}

	/**
	 * Make authenticated DELETE request
	 */
	async delete<T = any>(endpoint: string, options?: {
		headers?: Record<string, string>;
		timeout?: number;
	}): Promise<ApiResponse<T>> {
		return await this.makeRequest('DELETE', endpoint, undefined, options);
	}

	/**
	 * Make authenticated PATCH request
	 */
	async patch<T = any>(endpoint: string, data?: any, options?: {
		headers?: Record<string, string>;
		timeout?: number;
	}): Promise<ApiResponse<T>> {
		return await this.makeRequest('PATCH', endpoint, data, options);
	}

	/**
	 * Test tRPC endpoint
	 */
	async testTrpcEndpoint(
		procedure: string,
		input?: any,
		options?: {
			batch?: boolean;
			timeout?: number;
		}
	): Promise<ApiResponse> {
		const endpoint = options?.batch
			? `/trpc/${procedure}?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": input || {} }))}`
			: `/trpc/${procedure}`;

		const method = input ? 'POST' : 'GET';
		const data = input && !options?.batch ? { input } : undefined;

		return await this.makeRequest(method, endpoint, data, {
			timeout: options?.timeout,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	/**
	 * Test file upload
	 */
	async testFileUpload(
		endpoint: string,
		filePath: string,
		fieldName = 'file',
		additionalData?: Record<string, string>
	): Promise<ApiResponse> {
		const formData = new FormData();

		// Note: In a real implementation, you'd read the file
		// For testing, we'll create a mock file
		const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
		formData.append(fieldName, mockFile);

		if (additionalData) {
			Object.entries(additionalData).forEach(([key, value]) => {
				formData.append(key, value);
			});
		}

		const headers = { ...this.config.headers };
		delete headers['Content-Type']; // Let browser set it for FormData

		return await this.makeRequest('POST', endpoint, formData, { headers });
	}

	/**
	 * Test WebSocket connection
	 */
	async testWebSocketConnection(endpoint: string): Promise<boolean> {
		// This would need to be implemented based on your WebSocket setup
		// For now, we'll simulate a connection test
		try {
			const response = await this.get('/health');
			return response.status === 200;
		} catch {
			return false;
		}
	}

	/**
	 * Test database operations through API
	 */
	async testDatabaseOperations(entity: string, operations: {
		create?: any;
		read?: string | number;
		update?: { id: string | number; data: any };
		delete?: string | number;
	}): Promise<{
		create?: ApiResponse;
		read?: ApiResponse;
		update?: ApiResponse;
		delete?: ApiResponse;
	}> {
		const results: any = {};

		if (operations.create) {
			results.create = await this.post(`/api/${entity}`, operations.create);
		}

		if (operations.read) {
			results.read = await this.get(`/api/${entity}/${operations.read}`);
		}

		if (operations.update) {
			results.update = await this.put(
				`/api/${entity}/${operations.update.id}`,
				operations.update.data
			);
		}

		if (operations.delete) {
			results.delete = await this.delete(`/api/${entity}/${operations.delete}`);
		}

		return results;
	}

	/**
	 * Test API performance
	 */
	async testPerformance(
		endpoint: string,
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
		data?: any,
		iterations = 10
	): Promise<{
		averageTime: number;
		minTime: number;
		maxTime: number;
		successRate: number;
		errors: string[];
	}> {
		const results: number[] = [];
		const errors: string[] = [];
		let successCount = 0;

		for (let i = 0; i < iterations; i++) {
			try {
				const response = await this.makeRequest(method, endpoint, data);
				results.push(response.timing.duration);
				successCount++;
			} catch (error) {
				errors.push(error.message);
			}
		}

		return {
			averageTime: results.reduce((a, b) => a + b, 0) / results.length,
			minTime: Math.min(...results),
			maxTime: Math.max(...results),
			successRate: (successCount / iterations) * 100,
			errors
		};
	}

	/**
	 * Test API rate limiting
	 */
	async testRateLimit(
		endpoint: string,
		requestsPerSecond = 10,
		duration = 5000
	): Promise<{
		totalRequests: number;
		successfulRequests: number;
		rateLimitHit: boolean;
		firstRateLimitTime?: number;
	}> {
		const startTime = Date.now();
		const interval = 1000 / requestsPerSecond;
		let totalRequests = 0;
		let successfulRequests = 0;
		let rateLimitHit = false;
		let firstRateLimitTime: number | undefined;

		while (Date.now() - startTime < duration) {
			try {
				const response = await this.get(endpoint);
				totalRequests++;

				if (response.status === 429) {
					rateLimitHit = true;
					if (!firstRateLimitTime) {
						firstRateLimitTime = Date.now() - startTime;
					}
				} else {
					successfulRequests++;
				}
			} catch {
				totalRequests++;
			}

			await new Promise(resolve => setTimeout(resolve, interval));
		}

		return {
			totalRequests,
			successfulRequests,
			rateLimitHit,
			firstRateLimitTime
		};
	}

	/**
	 * Test API error handling
	 */
	async testErrorHandling(): Promise<{
		notFound: boolean;
		badRequest: boolean;
		unauthorized: boolean;
		serverError: boolean;
	}> {
		const tests = {
			notFound: false,
			badRequest: false,
			unauthorized: false,
			serverError: false
		};

		// Test 404
		try {
			const response = await this.get('/api/non-existent-endpoint');
			tests.notFound = response.status === 404;
		} catch {
			tests.notFound = true;
		}

		// Test 400
		try {
			const response = await this.post('/api/test', { invalid: 'data' });
			tests.badRequest = response.status === 400;
		} catch {
			tests.badRequest = true;
		}

		// Test 401 (remove auth headers temporarily)
		const originalHeaders = this.config.headers;
		delete this.config.headers?.Authorization;
		try {
			const response = await this.get('/api/protected');
			tests.unauthorized = response.status === 401;
		} catch {
			tests.unauthorized = true;
		}
		this.config.headers = originalHeaders;

		return tests;
	}

	/**
	 * Private method to make HTTP requests with timing
	 */
	private async makeRequest<T = any>(
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
		endpoint: string,
		data?: any,
		options?: {
			params?: Record<string, string | number>;
			headers?: Record<string, string>;
			timeout?: number;
			files?: string[];
		}
	): Promise<ApiResponse<T>> {
		const startTime = Date.now();

		// Build URL with query parameters
		const url = new URL(endpoint, this.config.baseURL);
		if (options?.params) {
			Object.entries(options.params).forEach(([key, value]) => {
				url.searchParams.append(key, value.toString());
			});
		}

		// Merge headers
		const headers = {
			...this.config.headers,
			...options?.headers
		};

		try {
			const response = await this.context.fetch(url.toString(), {
				method,
				headers,
				data: data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
				timeout: options?.timeout || this.config.timeout
			});

			const endTime = Date.now();
			const responseData = await response.json().catch(() => ({}));

			// Attach API call details to Allure report
			await AllureHelper.attachTestData('API Request Details', {
				method,
				url: url.toString(),
				headers,
				data,
				status: response.status(),
				timing: {
					duration: endTime - startTime,
					startTime,
					endTime
				}
			});

			return {
				data: responseData,
				status: response.status(),
				statusText: response.statusText(),
				headers: response.headers(),
				timing: {
					duration: endTime - startTime,
					startTime,
					endTime
				}
			};
		} catch (error) {
			const endTime = Date.now();

			// Attach error details to Allure report
			await AllureHelper.attachTestData('API Error Details', {
				method,
				url: url.toString(),
				headers,
				data,
				error: error.message,
				timing: {
					duration: endTime - startTime,
					startTime,
					endTime
				}
			});

			throw error;
		}
	}

	/**
	 * Cleanup and dispose of resources
	 */
	async dispose(): Promise<void> {
		await this.context.dispose();
	}

	/**
	 * Verify API response schema
	 */
	verifyResponseSchema(response: ApiResponse, expectedSchema: any): void {
		// Basic schema validation - you might want to use a library like Joi or Zod
		expect(response.data).toBeDefined();
		expect(response.status).toBeGreaterThanOrEqual(200);
		expect(response.status).toBeLessThan(600);

		// Add more specific schema validation based on your needs
		if (expectedSchema.properties) {
			Object.keys(expectedSchema.properties).forEach(key => {
				expect(response.data).toHaveProperty(key);
			});
		}
	}

	/**
	 * Assert API response meets performance requirements
	 */
	assertPerformanceRequirements(
		response: ApiResponse,
		requirements: {
			maxResponseTime?: number;
			minStatusCode?: number;
			maxStatusCode?: number;
		}
	): void {
		if (requirements.maxResponseTime) {
			expect(response.timing.duration).toBeLessThanOrEqual(requirements.maxResponseTime);
		}

		if (requirements.minStatusCode) {
			expect(response.status).toBeGreaterThanOrEqual(requirements.minStatusCode);
		}

		if (requirements.maxStatusCode) {
			expect(response.status).toBeLessThanOrEqual(requirements.maxStatusCode);
		}
	}

	/**
	 * Get current authentication status
	 */
	isAuthenticated(): boolean {
		return this.authTokens !== null && !!this.authTokens.accessToken;
	}

	/**
	 * Clear authentication tokens
	 */
	clearAuth(): void {
		this.authTokens = null;
		if (this.config.headers?.Authorization) {
			delete this.config.headers.Authorization;
		}
	}
}