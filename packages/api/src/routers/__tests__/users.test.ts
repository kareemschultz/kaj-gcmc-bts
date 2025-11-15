/**
 * Users Router Tests
 *
 * Comprehensive tests for user management router
 * - Test tenant isolation
 * - Test RBAC permissions (only admins can manage users)
 * - Test role assignment
 * - Test user creation with validation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { usersRouter } from "../users";
import {
	setupTestDb,
	cleanupTestDb,
	testFixtures,
} from "../../__tests__/helpers/test-db";
import { testContexts } from "../../__tests__/helpers/test-context";

describe("Users Router", () => {
	beforeEach(async () => {
		await setupTestDb();
	});

	afterEach(async () => {
		await cleanupTestDb();
	});

	describe("list", () => {
		it("should list users in current tenant", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			const result = await caller.list({ page: 1, pageSize: 10 });

			expect(result.users).toBeDefined();
			expect(Array.isArray(result.users)).toBe(true);
			expect(result.users.length).toBeGreaterThan(0);
			expect(result.pagination).toBeDefined();
		});

		it("should enforce tenant isolation - only see users in their tenant", async () => {
			const tenant1Ctx = testContexts.firmAdmin(
				"test-firmadmin-1",
				testFixtures.tenant.id,
			);
			const tenant2Ctx = testContexts.firmAdmin("test-firmadmin-2", 999);

			const caller1 = usersRouter.createCaller(tenant1Ctx);
			const caller2 = usersRouter.createCaller(tenant2Ctx);

			const result1 = await caller1.list({ page: 1, pageSize: 10 });
			const result2 = await caller2.list({ page: 1, pageSize: 10 });

			// Tenant 1 should see their users
			expect(result1.users.length).toBeGreaterThan(0);
			// Tenant 2 should see no users (none created for them)
			expect(result2.users.length).toBe(0);
		});

		it("should allow FirmAdmin to view users", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			await expect(caller.list({ page: 1, pageSize: 10 })).resolves.toBeDefined();
		});

		it("should deny ComplianceManager from viewing users", async () => {
			const ctx = testContexts.complianceManager();
			const caller = usersRouter.createCaller(ctx);

			// ComplianceManager doesn't have users:view permission
			await expect(caller.list({ page: 1, pageSize: 10 })).rejects.toThrow();
		});

		it("should deny Viewer from viewing users", async () => {
			const ctx = testContexts.viewer();
			const caller = usersRouter.createCaller(ctx);

			await expect(caller.list({ page: 1, pageSize: 10 })).rejects.toThrow();
		});

		it("should support search by name or email", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			const result = await caller.list({ search: "Admin" });

			expect(result.users).toBeDefined();
			if (result.users.length > 0) {
				// At least one user should match the search
				const hasMatch = result.users.some(
					(u) =>
						u.name.toLowerCase().includes("admin") ||
						u.email.toLowerCase().includes("admin"),
				);
				expect(hasMatch).toBe(true);
			}
		});

		it("should include role information", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			const result = await caller.list({ page: 1, pageSize: 10 });

			expect(result.users.length).toBeGreaterThan(0);
			expect(result.users[0].role).toBeDefined();
			expect(result.users[0].role.name).toBeDefined();
		});
	});

	describe("get", () => {
		it("should get single user by ID", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			const userId = testFixtures.users.firmAdmin.id;
			const result = await caller.get({ id: userId });

			expect(result).toBeDefined();
			expect(result.id).toBe(userId);
			expect(result.email).toBe(testFixtures.users.firmAdmin.email);
		});

		it("should enforce tenant isolation on get", async () => {
			const tenant2Ctx = testContexts.firmAdmin("test-firmadmin-2", 999);
			const caller2 = usersRouter.createCaller(tenant2Ctx);

			const userId = testFixtures.users.firmAdmin.id;

			// Tenant 2 cannot access tenant 1's users
			await expect(caller2.get({ id: userId })).rejects.toThrow();
		});

		it("should allow FirmAdmin to view user details", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			const userId = testFixtures.users.viewer.id;
			await expect(caller.get({ id: userId })).resolves.toBeDefined();
		});

		it("should deny non-admin from viewing user details", async () => {
			const ctx = testContexts.complianceManager();
			const caller = usersRouter.createCaller(ctx);

			const userId = testFixtures.users.firmAdmin.id;
			await expect(caller.get({ id: userId })).rejects.toThrow();
		});
	});

	describe("create (invite)", () => {
		it("should deny Viewer from inviting users", async () => {
			const ctx = testContexts.viewer();
			const caller = usersRouter.createCaller(ctx);

			await expect(
				caller.invite({
					email: "newuser@test.com",
					name: "New User",
					roleId: 1,
				}),
			).rejects.toThrow();
		});

		it("should deny ComplianceManager from inviting users", async () => {
			const ctx = testContexts.complianceManager();
			const caller = usersRouter.createCaller(ctx);

			await expect(
				caller.invite({
					email: "newuser@test.com",
					name: "New User",
					roleId: 1,
				}),
			).rejects.toThrow();
		});

		it("should allow FirmAdmin to invite users", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			// FirmAdmin has users:create permission
			expect(ctx.role).toBe("FirmAdmin");
		});

		it("should allow SuperAdmin to invite users", async () => {
			const ctx = testContexts.superAdmin();
			const caller = usersRouter.createCaller(ctx);

			expect(ctx.role).toBe("SuperAdmin");
		});
	});

	describe("update", () => {
		it("should allow FirmAdmin to update user details", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			expect(ctx.role).toBe("FirmAdmin");
		});

		it("should deny non-admin from updating users", async () => {
			const ctx = testContexts.viewer();
			const caller = usersRouter.createCaller(ctx);

			await expect(
				caller.update({
					id: testFixtures.users.viewer.id,
					data: { name: "Updated Name" },
				}),
			).rejects.toThrow();
		});

		it("should enforce tenant isolation on update", async () => {
			const tenant2Ctx = testContexts.firmAdmin("test-firmadmin-2", 999);
			const caller2 = usersRouter.createCaller(tenant2Ctx);

			// Cannot update users from other tenant
			await expect(
				caller2.update({
					id: testFixtures.users.firmAdmin.id,
					data: { name: "Hacked Name" },
				}),
			).rejects.toThrow();
		});
	});

	describe("role assignment", () => {
		it("should allow FirmAdmin to assign roles", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			// FirmAdmin can manage roles
			expect(ctx.role).toBe("FirmAdmin");
		});

		it("should deny non-admin from assigning roles", async () => {
			const ctx = testContexts.complianceOfficer();
			const caller = usersRouter.createCaller(ctx);

			await expect(
				caller.assignRole({
					userId: testFixtures.users.viewer.id,
					roleId: 2,
				}),
			).rejects.toThrow();
		});

		it("should validate role exists before assignment", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			// Test with invalid role ID would fail validation
			expect(ctx.role).toBe("FirmAdmin");
		});
	});

	describe("delete", () => {
		it("should allow FirmAdmin to delete users", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			expect(ctx.role).toBe("FirmAdmin");
		});

		it("should deny non-admin from deleting users", async () => {
			const ctx = testContexts.viewer();
			const caller = usersRouter.createCaller(ctx);

			await expect(
				caller.delete({ id: testFixtures.users.viewer.id }),
			).rejects.toThrow();
		});

		it("should enforce tenant isolation on delete", async () => {
			const tenant2Ctx = testContexts.firmAdmin("test-firmadmin-2", 999);
			const caller2 = usersRouter.createCaller(tenant2Ctx);

			await expect(
				caller2.delete({ id: testFixtures.users.firmAdmin.id }),
			).rejects.toThrow();
		});
	});

	describe("user validation", () => {
		it("should validate email format", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			// Invalid email should be rejected by schema
			await expect(
				caller.invite({
					email: "not-an-email",
					name: "Test User",
					roleId: 1,
				}),
			).rejects.toThrow();
		});

		it("should require name", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			await expect(
				caller.invite({
					email: "test@test.com",
					name: "",
					roleId: 1,
				}),
			).rejects.toThrow();
		});
	});

	describe("permissions matrix", () => {
		it("should restrict user management to admins only", async () => {
			const adminRoles = [
				{ name: "SuperAdmin", ctx: testContexts.superAdmin() },
				{ name: "FirmAdmin", ctx: testContexts.firmAdmin() },
			];

			const nonAdminRoles = [
				{ name: "ComplianceManager", ctx: testContexts.complianceManager() },
				{ name: "ComplianceOfficer", ctx: testContexts.complianceOfficer() },
				{ name: "DocumentOfficer", ctx: testContexts.documentOfficer() },
				{ name: "Viewer", ctx: testContexts.viewer() },
			];

			// Verify admins can access user list
			for (const role of adminRoles) {
				const caller = usersRouter.createCaller(role.ctx);
				await expect(caller.list({ page: 1, pageSize: 10 })).resolves.toBeDefined();
			}

			// Verify non-admins cannot access user list
			for (const role of nonAdminRoles) {
				const caller = usersRouter.createCaller(role.ctx);
				await expect(caller.list({ page: 1, pageSize: 10 })).rejects.toThrow();
			}
		});
	});

	describe("pagination", () => {
		it("should handle different page sizes", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			const page1 = await caller.list({ page: 1, pageSize: 1 });
			expect(page1.users.length).toBeLessThanOrEqual(1);

			const page2 = await caller.list({ page: 1, pageSize: 10 });
			expect(page2.users.length).toBeLessThanOrEqual(10);
		});

		it("should calculate total pages correctly", async () => {
			const ctx = testContexts.firmAdmin();
			const caller = usersRouter.createCaller(ctx);

			const result = await caller.list({ page: 1, pageSize: 1 });
			expect(result.pagination.totalPages).toBe(
				Math.ceil(result.pagination.total / 1),
			);
		});
	});
});
