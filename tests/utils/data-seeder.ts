import { PrismaClient } from "@prisma/client";
import type {
	Client,
	Document,
	Filing,
	Service,
	ServiceRequest,
	Tenant,
	User,
} from "@prisma/client";

/**
 * Data Seeder for E2E Tests
 *
 * Provides methods to seed and cleanup test data.
 */
export class DataSeeder {
	private prisma: PrismaClient;
	private createdRecords: Map<string, string[]> = new Map();

	constructor() {
		this.prisma = new PrismaClient({
			datasources: {
				db: {
					url: process.env.DATABASE_URL,
				},
			},
		});
	}

	/**
	 * Track created record for cleanup
	 */
	private trackRecord(model: string, id: string) {
		if (!this.createdRecords.has(model)) {
			this.createdRecords.set(model, []);
		}
		this.createdRecords.get(model)?.push(id);
	}

	/**
	 * Create a test tenant
	 */
	async createTenant(
		data?: Partial<Omit<Tenant, "id" | "createdAt" | "updatedAt">>,
	) {
		const tenant = await this.prisma.tenant.create({
			data: {
				name: data?.name || "Test Tenant",
				slug: data?.slug || "test-tenant",
				tier: data?.tier || "PROFESSIONAL",
				status: data?.status || "ACTIVE",
				...data,
			},
		});
		this.trackRecord("tenant", tenant.id);
		return tenant;
	}

	/**
	 * Create a test user
	 */
	async createUser(
		data?: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>,
	) {
		const user = await this.prisma.user.create({
			data: {
				name: data?.name || "Test User",
				email: data?.email || `test-${Date.now()}@example.com`,
				emailVerified: data?.emailVerified ?? true,
				...data,
			},
		});
		this.trackRecord("user", user.id);
		return user;
	}

	/**
	 * Create a test client
	 */
	async createClient(
		tenantId: string,
		data?: Partial<Omit<Client, "id" | "tenantId" | "createdAt">>,
	) {
		const client = await this.prisma.client.create({
			data: {
				tenantId,
				fullName: data?.fullName || "Test Client",
				email: data?.email || `client-${Date.now()}@example.com`,
				phone: data?.phone || "+1234567890",
				status: data?.status || "ACTIVE",
				...data,
			},
		});
		this.trackRecord("client", client.id);
		return client;
	}

	/**
	 * Create a test service
	 */
	async createService(
		tenantId: string,
		data?: Partial<Omit<Service, "id" | "tenantId" | "createdAt">>,
	) {
		const service = await this.prisma.service.create({
			data: {
				tenantId,
				name: data?.name || "Test Service",
				description: data?.description || "Test service description",
				category: data?.category || "COMPLIANCE",
				status: data?.status || "ACTIVE",
				basePrice: data?.basePrice || 100,
				currency: data?.currency || "USD",
				...data,
			},
		});
		this.trackRecord("service", service.id);
		return service;
	}

	/**
	 * Create a test service request
	 */
	async createServiceRequest(
		tenantId: string,
		clientId: string,
		serviceId: string,
		data?: Partial<
			Omit<ServiceRequest, "id" | "clientId" | "serviceId" | "createdAt">
		>,
	) {
		const serviceRequest = await this.prisma.serviceRequest.create({
			data: {
				tenantId,
				clientId,
				serviceId,
				status: data?.status || "PENDING",
				priority: data?.priority || "MEDIUM",
				...data,
			},
		});
		this.trackRecord("serviceRequest", serviceRequest.id);
		return serviceRequest;
	}

	/**
	 * Create a test document
	 */
	async createDocument(
		tenantId: string,
		data?: Partial<Omit<Document, "id" | "tenantId" | "createdAt">>,
	) {
		const document = await this.prisma.document.create({
			data: {
				tenantId,
				title: data?.title || "Test Document",
				type: data?.type || "CONTRACT",
				status: data?.status || "ACTIVE",
				storageKey: data?.storageKey || `test-doc-${Date.now()}`,
				mimeType: data?.mimeType || "application/pdf",
				size: data?.size || 1024,
				...data,
			},
		});
		this.trackRecord("document", document.id);
		return document;
	}

	/**
	 * Create a test filing
	 */
	async createFiling(
		tenantId: string,
		clientId: string,
		data?: Partial<Omit<Filing, "id" | "tenantId" | "clientId" | "createdAt">>,
	) {
		const filing = await this.prisma.filing.create({
			data: {
				tenantId,
				clientId,
				filingType: data?.filingType || "ANNUAL_REPORT",
				jurisdiction: data?.jurisdiction || "FEDERAL",
				status: data?.status || "DRAFT",
				dueDate:
					data?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				...data,
			},
		});
		this.trackRecord("filing", filing.id);
		return filing;
	}

	/**
	 * Cleanup all created records
	 */
	async cleanup() {
		// Delete in reverse order to respect foreign key constraints
		const deleteOrder = [
			"filing",
			"document",
			"serviceRequest",
			"service",
			"client",
			"user",
			"tenant",
		];

		for (const model of deleteOrder) {
			const ids = this.createdRecords.get(model);
			if (ids && ids.length > 0) {
				try {
					// @ts-expect-error - Dynamic model access
					await this.prisma[model].deleteMany({
						where: {
							id: { in: ids },
						},
					});
				} catch (error) {
					console.warn(`Failed to cleanup ${model}:`, error);
				}
			}
		}

		await this.prisma.$disconnect();
	}

	/**
	 * Get Prisma client for custom queries
	 */
	getPrisma() {
		return this.prisma;
	}
}
