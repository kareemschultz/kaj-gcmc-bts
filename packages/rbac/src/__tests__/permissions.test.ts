/**
 * RBAC Permissions Tests
 *
 * Comprehensive tests for permission checking across all roles and modules
 */

import type { UserRole } from "@GCMC-KAJ/types";
import { describe, expect, it } from "vitest";
import {
	assertAdmin,
	assertPermission,
	canCreateEntity,
	canDeleteEntity,
	canEditEntity,
	canViewModule,
	ForbiddenError,
	getUserModules,
	getUserPermissions,
	hasPermission,
	isAdmin,
	isSuperAdmin,
	type UserPermissionContext,
} from "../permissions";

describe("RBAC Permissions", () => {
	const createUser = (
		role: UserRole,
		userId = "test-user",
		tenantId = 1,
	): UserPermissionContext => ({
		role,
		userId,
		tenantId,
	});

	describe("SuperAdmin", () => {
		it("should have all permissions on all modules", () => {
			const user = createUser("SuperAdmin");

			// Test all modules and actions
			const modules = [
				"clients",
				"documents",
				"filings",
				"services",
				"users",
				"settings",
				"compliance",
				"tasks",
				"messages",
				"analytics",
			];
			const actions = ["view", "create", "edit", "delete", "manage"];

			for (const module of modules) {
				for (const action of actions) {
					expect(hasPermission(user, module, action)).toBe(true);
				}
			}
		});

		it("should have permission on non-existent modules", () => {
			const user = createUser("SuperAdmin");
			expect(hasPermission(user, "non-existent-module", "any-action")).toBe(
				true,
			);
		});

		it("should pass isSuperAdmin check", () => {
			const user = createUser("SuperAdmin");
			expect(isSuperAdmin(user)).toBe(true);
			expect(isAdmin(user)).toBe(true);
		});
	});

	describe("FirmAdmin", () => {
		it("should have full access to clients module", () => {
			const user = createUser("FirmAdmin");

			expect(hasPermission(user, "clients", "view")).toBe(true);
			expect(hasPermission(user, "clients", "create")).toBe(true);
			expect(hasPermission(user, "clients", "edit")).toBe(true);
			expect(hasPermission(user, "clients", "delete")).toBe(true);
		});

		it("should have full access to documents module", () => {
			const user = createUser("FirmAdmin");

			expect(hasPermission(user, "documents", "view")).toBe(true);
			expect(hasPermission(user, "documents", "create")).toBe(true);
			expect(hasPermission(user, "documents", "edit")).toBe(true);
			expect(hasPermission(user, "documents", "delete")).toBe(true);
		});

		it("should have full access to filings module", () => {
			const user = createUser("FirmAdmin");

			expect(hasPermission(user, "filings", "view")).toBe(true);
			expect(hasPermission(user, "filings", "create")).toBe(true);
			expect(hasPermission(user, "filings", "edit")).toBe(true);
			expect(hasPermission(user, "filings", "delete")).toBe(true);
			expect(hasPermission(user, "filings", "submit")).toBe(true);
		});

		it("should have access to users and settings", () => {
			const user = createUser("FirmAdmin");

			expect(hasPermission(user, "users", "view")).toBe(true);
			expect(hasPermission(user, "users", "create")).toBe(true);
			expect(hasPermission(user, "settings", "view")).toBe(true);
			expect(hasPermission(user, "settings", "edit")).toBe(true);
		});

		it("should pass isAdmin check", () => {
			const user = createUser("FirmAdmin");
			expect(isSuperAdmin(user)).toBe(false);
			expect(isAdmin(user)).toBe(true);
		});
	});

	describe("ComplianceManager", () => {
		it("should have view and edit access to clients", () => {
			const user = createUser("ComplianceManager");

			expect(hasPermission(user, "clients", "view")).toBe(true);
			expect(hasPermission(user, "clients", "create")).toBe(true);
			expect(hasPermission(user, "clients", "edit")).toBe(true);
			expect(hasPermission(user, "clients", "delete")).toBe(false);
		});

		it("should have full access to compliance module", () => {
			const user = createUser("ComplianceManager");

			expect(hasPermission(user, "compliance", "view")).toBe(true);
			expect(hasPermission(user, "compliance", "edit")).toBe(true);
		});

		it("should have full access to filings", () => {
			const user = createUser("ComplianceManager");

			expect(hasPermission(user, "filings", "view")).toBe(true);
			expect(hasPermission(user, "filings", "create")).toBe(true);
			expect(hasPermission(user, "filings", "edit")).toBe(true);
			expect(hasPermission(user, "filings", "submit")).toBe(true);
		});

		it("should NOT have access to users management", () => {
			const user = createUser("ComplianceManager");
			expect(hasPermission(user, "users", "view")).toBe(false);
			expect(hasPermission(user, "users", "create")).toBe(false);
		});
	});

	describe("ComplianceOfficer", () => {
		it("should have view and edit access to clients", () => {
			const user = createUser("ComplianceOfficer");

			expect(hasPermission(user, "clients", "view")).toBe(true);
			expect(hasPermission(user, "clients", "edit")).toBe(true);
			expect(hasPermission(user, "clients", "create")).toBe(false);
			expect(hasPermission(user, "clients", "delete")).toBe(false);
		});

		it("should have access to documents", () => {
			const user = createUser("ComplianceOfficer");

			expect(hasPermission(user, "documents", "view")).toBe(true);
			expect(hasPermission(user, "documents", "create")).toBe(true);
			expect(hasPermission(user, "documents", "edit")).toBe(true);
			expect(hasPermission(user, "documents", "delete")).toBe(false);
		});

		it("should have access to filings", () => {
			const user = createUser("ComplianceOfficer");

			expect(hasPermission(user, "filings", "view")).toBe(true);
			expect(hasPermission(user, "filings", "create")).toBe(true);
			expect(hasPermission(user, "filings", "edit")).toBe(true);
			expect(hasPermission(user, "filings", "submit")).toBe(true);
		});
	});

	describe("DocumentOfficer", () => {
		it("should have view-only access to clients", () => {
			const user = createUser("DocumentOfficer");

			expect(hasPermission(user, "clients", "view")).toBe(true);
			expect(hasPermission(user, "clients", "create")).toBe(false);
			expect(hasPermission(user, "clients", "edit")).toBe(false);
			expect(hasPermission(user, "clients", "delete")).toBe(false);
		});

		it("should have full access to documents", () => {
			const user = createUser("DocumentOfficer");

			expect(hasPermission(user, "documents", "view")).toBe(true);
			expect(hasPermission(user, "documents", "create")).toBe(true);
			expect(hasPermission(user, "documents", "edit")).toBe(true);
		});

		it("should NOT have access to filings", () => {
			const user = createUser("DocumentOfficer");
			expect(hasPermission(user, "filings", "view")).toBe(false);
		});
	});

	describe("FilingClerk", () => {
		it("should have view-only access to clients", () => {
			const user = createUser("FilingClerk");

			expect(hasPermission(user, "clients", "view")).toBe(true);
			expect(hasPermission(user, "clients", "create")).toBe(false);
		});

		it("should have create and edit access to filings", () => {
			const user = createUser("FilingClerk");

			expect(hasPermission(user, "filings", "view")).toBe(true);
			expect(hasPermission(user, "filings", "create")).toBe(true);
			expect(hasPermission(user, "filings", "edit")).toBe(true);
		});
	});

	describe("Viewer", () => {
		it("should have view-only access to clients", () => {
			const user = createUser("Viewer");

			expect(hasPermission(user, "clients", "view")).toBe(true);
			expect(hasPermission(user, "clients", "create")).toBe(false);
			expect(hasPermission(user, "clients", "edit")).toBe(false);
			expect(hasPermission(user, "clients", "delete")).toBe(false);
		});

		it("should have view-only access to documents", () => {
			const user = createUser("Viewer");

			expect(hasPermission(user, "documents", "view")).toBe(true);
			expect(hasPermission(user, "documents", "create")).toBe(false);
			expect(hasPermission(user, "documents", "edit")).toBe(false);
		});

		it("should have view-only access to filings", () => {
			const user = createUser("Viewer");

			expect(hasPermission(user, "filings", "view")).toBe(true);
			expect(hasPermission(user, "filings", "create")).toBe(false);
		});

		it("should NOT have access to settings or users", () => {
			const user = createUser("Viewer");

			expect(hasPermission(user, "settings", "view")).toBe(false);
			expect(hasPermission(user, "users", "view")).toBe(false);
		});
	});

	describe("ClientPortalUser", () => {
		it("should have access to client portal", () => {
			const user = createUser("ClientPortalUser");

			expect(hasPermission(user, "client_portal", "view")).toBe(true);
			expect(hasPermission(user, "client_portal", "upload")).toBe(true);
			expect(hasPermission(user, "client_portal", "message")).toBe(true);
		});

		it("should NOT have access to internal modules", () => {
			const user = createUser("ClientPortalUser");

			expect(hasPermission(user, "clients", "view")).toBe(false);
			expect(hasPermission(user, "users", "view")).toBe(false);
			expect(hasPermission(user, "settings", "view")).toBe(false);
		});
	});

	describe("assertPermission", () => {
		it("should not throw for valid permissions", () => {
			const user = createUser("FirmAdmin");
			expect(() => assertPermission(user, "clients", "view")).not.toThrow();
		});

		it("should throw ForbiddenError for invalid permissions", () => {
			const user = createUser("Viewer");
			expect(() => assertPermission(user, "clients", "create")).toThrow(
				ForbiddenError,
			);
		});

		it("should use custom error message", () => {
			const user = createUser("Viewer");
			expect(() =>
				assertPermission(user, "clients", "create", "Custom error"),
			).toThrow("Custom error");
		});
	});

	describe("helper functions", () => {
		it("canViewModule should work correctly", () => {
			const admin = createUser("FirmAdmin");
			const viewer = createUser("Viewer");

			expect(canViewModule(admin, "clients")).toBe(true);
			expect(canViewModule(viewer, "clients")).toBe(true);
			expect(canViewModule(viewer, "settings")).toBe(false);
		});

		it("canCreateEntity should work correctly", () => {
			const admin = createUser("FirmAdmin");
			const viewer = createUser("Viewer");

			expect(canCreateEntity(admin, "clients")).toBe(true);
			expect(canCreateEntity(viewer, "clients")).toBe(false);
		});

		it("canEditEntity should work correctly", () => {
			const admin = createUser("FirmAdmin");
			const viewer = createUser("Viewer");

			expect(canEditEntity(admin, "clients")).toBe(true);
			expect(canEditEntity(viewer, "clients")).toBe(false);
		});

		it("canDeleteEntity should work correctly", () => {
			const admin = createUser("FirmAdmin");
			const complianceMgr = createUser("ComplianceManager");

			expect(canDeleteEntity(admin, "clients")).toBe(true);
			expect(canDeleteEntity(complianceMgr, "clients")).toBe(false);
		});
	});

	describe("assertAdmin", () => {
		it("should not throw for SuperAdmin", () => {
			const user = createUser("SuperAdmin");
			expect(() => assertAdmin(user)).not.toThrow();
		});

		it("should not throw for FirmAdmin", () => {
			const user = createUser("FirmAdmin");
			expect(() => assertAdmin(user)).not.toThrow();
		});

		it("should throw for non-admin roles", () => {
			const user = createUser("Viewer");
			expect(() => assertAdmin(user)).toThrow(ForbiddenError);
		});

		it("should use custom error message", () => {
			const user = createUser("Viewer");
			expect(() => assertAdmin(user, "Custom admin error")).toThrow(
				"Custom admin error",
			);
		});
	});

	describe("getUserPermissions", () => {
		it("should return all permissions for a role", () => {
			const permissions = getUserPermissions("FirmAdmin");
			expect(permissions).toBeDefined();
			expect(permissions.length).toBeGreaterThan(0);
		});

		it("should return empty array for invalid role", () => {
			const permissions = getUserPermissions("InvalidRole" as UserRole);
			expect(permissions).toEqual([]);
		});
	});

	describe("getUserModules", () => {
		it("should return all modules for SuperAdmin", () => {
			const user = createUser("SuperAdmin");
			const modules = getUserModules(user);

			expect(modules).toContain("clients");
			expect(modules).toContain("documents");
			expect(modules).toContain("filings");
			expect(modules).toContain("users");
			expect(modules).toContain("settings");
		});

		it("should return limited modules for Viewer", () => {
			const user = createUser("Viewer");
			const modules = getUserModules(user);

			expect(modules).toContain("clients");
			expect(modules).toContain("documents");
			expect(modules).toContain("filings");
			expect(modules).not.toContain("users");
			expect(modules).not.toContain("settings");
		});
	});
});
