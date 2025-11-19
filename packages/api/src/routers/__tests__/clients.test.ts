/**
 * Clients Router Tests
 *
 * Comprehensive tests for client management router
 * - Test tenant isolation
 * - Test RBAC permissions
 * - Test CRUD operations
 * - Test search and pagination
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Prisma client - no external variables in mock factory
vi.mock("@GCMC-KAJ/db", () => ({
	default: {
		client: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
			aggregate: vi.fn(),
		},
		$disconnect: vi.fn(),
		$connect: vi.fn(),
		$transaction: vi.fn(),
	},
}));

import prisma from "@GCMC-KAJ/db";
import { testContexts } from "../../__tests__/helpers/test-context";
import { clientsRouter } from "../clients";

// Get the mocked Prisma instance
const mockPrisma = vi.mocked(prisma);

// Mock test fixtures
const mockTestFixtures = {
	tenant: { id: 1, name: "Test Firm", code: "TEST-FIRM" },
	clients: [
		{ id: 1, name: "Test Client 1" },
		{ id: 2, name: "Test Company Ltd" },
	],
};

describe("Clients Router", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Setup conditional mock behavior for tenant isolation
		mockPrisma.client.findMany.mockImplementation((args: any) => {
			const tenantId = args?.where?.tenantId;
			if (tenantId === 1) {
				return Promise.resolve([
					{
						id: 1,
						name: "Test Client 1",
						type: "individual",
						email: "client1@test.com",
						tenantId: 1,
					},
					{
						id: 2,
						name: "Test Company Ltd",
						type: "company",
						email: "company@test.com",
						tenantId: 1,
					},
				]);
			}
			return Promise.resolve([]); // Empty for other tenants
		});

		mockPrisma.client.findUnique.mockImplementation((args: any) => {
			const tenantId = args?.where?.tenantId;
			const clientId = args?.where?.id;

			if (tenantId === 1 && clientId === 1) {
				return Promise.resolve({
					id: 1,
					name: "Test Client 1",
					type: "individual",
					email: "client1@test.com",
					tenantId: 1,
					_count: {
						documents: 2,
						filings: 1,
						serviceRequests: 0,
					},
				});
			}
			return Promise.resolve(null); // Not found for other tenants or invalid IDs
		});

		mockPrisma.client.count.mockImplementation((args: any) => {
			const tenantId = args?.where?.tenantId;
			if (tenantId === 1) {
				return Promise.resolve(2);
			}
			return Promise.resolve(0);
		});

		mockPrisma.client.create.mockResolvedValue({
			id: 3,
			name: "New Test Client",
			type: "individual",
			email: "newclient@test.com",
			tenantId: 1,
		});

		mockPrisma.client.update.mockImplementation((args: any) => {
			const tenantId = args?.where?.tenantId;
			if (tenantId === 1) {
				return Promise.resolve({
					id: 1,
					name: args.data?.name || "Updated Client Name",
					type: "individual",
					email: args.data?.email || "updated@test.com",
					tenantId: 1,
				});
			}
			return Promise.reject(new Error("Client not found"));
		});

		mockPrisma.client.delete.mockImplementation((args: any) => {
			const tenantId = args?.where?.tenantId;
			if (tenantId === 1) {
				return Promise.resolve({ id: 1 });
			}
			return Promise.reject(new Error("Client not found"));
		});

		mockPrisma.client.aggregate.mockResolvedValue({
			_count: { id: 2 },
		});
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("list", () => {
		it("should list clients for tenant with pagination", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const result = await caller.list({ page: 1, pageSize: 10 });

			expect(result.clients).toBeDefined();
			expect(Array.isArray(result.clients)).toBe(true);
			expect(result.clients.length).toBeGreaterThan(0);
			expect(result.pagination).toBeDefined();
			expect(result.pagination.page).toBe(1);
			expect(result.pagination.pageSize).toBe(10);
			expect(result.pagination.total).toBeGreaterThan(0);
		});

		it("should enforce tenant isolation - user only sees their tenant's clients", async () => {
			const tenant1Ctx = testContexts.firmAdmin(
				"test-firmadmin-1",
				mockTestFixtures.tenant.id,
			);
			const tenant2Ctx = testContexts.firmAdmin("test-firmadmin-2", 999);

			const caller1 = clientsRouter.createCaller(tenant1Ctx);
			const caller2 = clientsRouter.createCaller(tenant2Ctx);

			const result1 = await caller1.list({ page: 1, pageSize: 10 });
			const result2 = await caller2.list({ page: 1, pageSize: 10 });

			// Tenant 1 should see their clients
			expect(result1.clients.length).toBeGreaterThan(0);
			// Tenant 2 should see no clients (none created for them)
			expect(result2.clients.length).toBe(0);

			// Verify all clients in result1 belong to tenant 1
			for (const client of result1.clients) {
				expect(client.tenantId).toBe(mockTestFixtures.tenant.id);
			}
		});

		it("should support search by name", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			// Mock search results
			const mockSearchResult = {
				clients: [
					{ id: 1, name: "Unique Search Test Client", type: "individual" },
				],
				pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
			};

			const result = await caller.list({ search: "Unique Search" });

			expect(result.clients).toBeDefined();
			expect(Array.isArray(result.clients)).toBe(true);
		});

		it("should support filtering by type", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const result = await caller.list({ type: "company" });

			expect(result.clients.length).toBeGreaterThan(0);
			for (const client of result.clients) {
				expect(client.type).toBe("company");
			}
		});

		it("should allow FirmAdmin to view clients", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			await expect(
				caller.list({ page: 1, pageSize: 10 }),
			).resolves.toBeDefined();
		});

		it("should allow Viewer to view clients", async () => {
			const ctx = testContexts.viewer();
			const caller = clientsRouter.createCaller(ctx);

			await expect(
				caller.list({ page: 1, pageSize: 10 }),
			).resolves.toBeDefined();
		});
	});

	describe("get", () => {
		it("should get single client by ID", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const clientId = mockTestFixtures.clients[0].id;
			const result = await caller.get({ id: clientId });

			expect(result).toBeDefined();
			expect(result.id).toBe(clientId);
			expect(result.name).toBe(mockTestFixtures.clients[0].name);
		});

		it("should enforce tenant isolation on get", async () => {
			const tenant1Ctx = testContexts.firmAdmin(
				"test-firmadmin-1",
				mockTestFixtures.tenant.id,
			);
			const tenant2Ctx = testContexts.firmAdmin("test-firmadmin-2", 999);

			const caller1 = clientsRouter.createCaller(tenant1Ctx);
			const caller2 = clientsRouter.createCaller(tenant2Ctx);

			const clientId = mockTestFixtures.clients[0].id;

			// Tenant 1 can access their client
			await expect(caller1.get({ id: clientId })).resolves.toBeDefined();

			// Tenant 2 cannot access tenant 1's client
			await expect(caller2.get({ id: clientId })).rejects.toThrow("not found");
		});

		it("should include related counts", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const clientId = mockTestFixtures.clients[0].id;
			const result = await caller.get({ id: clientId });

			expect(result._count).toBeDefined();
			expect(result._count.documents).toBeDefined();
			expect(result._count.filings).toBeDefined();
			expect(result._count.serviceRequests).toBeDefined();
		});
	});

	describe("create", () => {
		it("should create new client with valid data", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const newClient = await caller.create({
				name: "New Test Client",
				type: "individual",
				email: "newclient@test.com",
				phone: "123-456-7890",
			});

			expect(newClient).toBeDefined();
			expect(newClient.id).toBeDefined();
			expect(newClient.name).toBe("New Test Client");
			expect(newClient.type).toBe("individual");
			expect(newClient.tenantId).toBe(mockTestFixtures.tenant.id);
		});

		it("should allow FirmAdmin to create clients", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			await expect(
				caller.create({
					name: "Admin Created Client",
					type: "company",
				}),
			).resolves.toBeDefined();
		});

		it("should deny Viewer from creating clients", async () => {
			const ctx = testContexts.viewer();
			const caller = clientsRouter.createCaller(ctx);

			await expect(
				caller.create({
					name: "Viewer Client",
					type: "individual",
				}),
			).rejects.toThrow();
		});

		it("should allow ComplianceManager to create clients", async () => {
			const ctx = testContexts.complianceManager();
			const caller = clientsRouter.createCaller(ctx);

			await expect(
				caller.create({
					name: "Compliance Created Client",
					type: "partnership",
				}),
			).resolves.toBeDefined();
		});

		it("should deny DocumentOfficer from creating clients", async () => {
			const ctx = testContexts.documentOfficer();
			const caller = clientsRouter.createCaller(ctx);

			await expect(
				caller.create({
					name: "Doc Officer Client",
					type: "individual",
				}),
			).rejects.toThrow();
		});

		it("should automatically assign tenant to created client", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const client = await caller.create({
				name: "Tenant Test Client",
				type: "individual",
			});

			expect(client.tenantId).toBe(mockTestFixtures.tenant.id);
		});
	});

	describe("update", () => {
		it("should update existing client", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const clientId = mockTestFixtures.clients[0].id;
			const updated = await caller.update({
				id: clientId,
				data: {
					name: "Updated Client Name",
					email: "updated@test.com",
				},
			});

			expect(updated).toBeDefined();
			expect(updated.name).toBe("Updated Client Name");
			expect(updated.email).toBe("updated@test.com");
		});

		it("should enforce tenant isolation on update", async () => {
			const _tenant1Ctx = testContexts.firmAdmin(
				"test-firmadmin-1",
				mockTestFixtures.tenant.id,
			);
			const tenant2Ctx = testContexts.firmAdmin("test-firmadmin-2", 999);

			const caller2 = clientsRouter.createCaller(tenant2Ctx);
			const clientId = mockTestFixtures.clients[0].id;

			// Tenant 2 cannot update tenant 1's client
			await expect(
				caller2.update({
					id: clientId,
					data: { name: "Hacked Name" },
				}),
			).rejects.toThrow("not found");
		});

		it("should allow FirmAdmin to update clients", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const clientId = mockTestFixtures.clients[0].id;
			await expect(
				caller.update({
					id: clientId,
					data: { name: "Admin Updated" },
				}),
			).resolves.toBeDefined();
		});

		it("should deny Viewer from updating clients", async () => {
			const ctx = testContexts.viewer();
			const caller = clientsRouter.createCaller(ctx);

			const clientId = mockTestFixtures.clients[0].id;
			await expect(
				caller.update({
					id: clientId,
					data: { name: "Viewer Updated" },
				}),
			).rejects.toThrow();
		});

		it("should allow ComplianceOfficer to update clients", async () => {
			const ctx = testContexts.complianceOfficer();
			const caller = clientsRouter.createCaller(ctx);

			const clientId = mockTestFixtures.clients[0].id;
			await expect(
				caller.update({
					id: clientId,
					data: { name: "Officer Updated" },
				}),
			).resolves.toBeDefined();
		});
	});

	describe("delete", () => {
		it("should delete client", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			// Use mock client to delete
			const clientId = mockTestFixtures.clients[0].id;

			const result = await caller.delete({ id: clientId });
			expect(result.success).toBe(true);

			// Verify delete was called
			expect(mockPrisma.client.delete).toHaveBeenCalledWith({
				where: { id: clientId, tenantId: 1 },
			});
		});

		it("should enforce tenant isolation on delete", async () => {
			const tenant2Ctx = testContexts.firmAdmin("test-firmadmin-2", 999);
			const caller2 = clientsRouter.createCaller(tenant2Ctx);

			const clientId = mockTestFixtures.clients[0].id;

			// Tenant 2 cannot delete tenant 1's client
			await expect(caller2.delete({ id: clientId })).rejects.toThrow();
		});

		it("should allow FirmAdmin to delete clients", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const clientId = mockTestFixtures.clients[0].id;

			await expect(caller.delete({ id: clientId })).resolves.toBeDefined();
		});

		it("should deny Viewer from deleting clients", async () => {
			const ctx = testContexts.viewer();
			const caller = clientsRouter.createCaller(ctx);

			const clientId = mockTestFixtures.clients[0].id;
			await expect(caller.delete({ id: clientId })).rejects.toThrow();
		});

		it("should deny ComplianceManager from deleting clients", async () => {
			const ctx = testContexts.complianceManager();
			const caller = clientsRouter.createCaller(ctx);

			const clientId = mockTestFixtures.clients[0].id;
			await expect(caller.delete({ id: clientId })).rejects.toThrow();
		});
	});

	describe("stats", () => {
		it("should return client statistics", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const stats = await caller.stats();

			expect(stats).toBeDefined();
			expect(stats.total).toBeGreaterThan(0);
			expect(stats.byType).toBeDefined();
			expect(Array.isArray(stats.byType)).toBe(true);
		});

		it("should allow Viewer to view stats", async () => {
			const ctx = testContexts.viewer();
			const caller = clientsRouter.createCaller(ctx);

			await expect(caller.stats()).resolves.toBeDefined();
		});
	});

	describe("pagination", () => {
		it("should handle different page sizes", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const page1 = await caller.list({ page: 1, pageSize: 1 });
			expect(page1.clients.length).toBeLessThanOrEqual(1);

			const page2 = await caller.list({ page: 1, pageSize: 10 });
			expect(page2.clients.length).toBeLessThanOrEqual(10);
		});

		it("should calculate total pages correctly", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = clientsRouter.createCaller(ctx);

			const result = await caller.list({ page: 1, pageSize: 1 });
			expect(result.pagination.totalPages).toBe(
				Math.ceil(result.pagination.total / 1),
			);
		});
	});
});
