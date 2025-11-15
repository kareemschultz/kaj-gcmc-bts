/**
 * RBAC Middleware Tests
 *
 * Tests for RBAC middleware integration with tRPC procedures
 */

import type { UserRole } from "@GCMC-KAJ/types";
import { describe, expect, it } from "vitest";
import {
	assertPermission,
	assertTenantAccess,
	canAccessClient,
	ForbiddenError,
	type UserPermissionContext,
} from "../permissions";

describe("RBAC Middleware", () => {
	const createUser = (
		role: UserRole,
		userId = "test-user",
		tenantId = 1,
	): UserPermissionContext => ({
		role,
		userId,
		tenantId,
	});

	describe("Permission Middleware", () => {
		it("should grant access with correct permissions", () => {
			const user = createUser("FirmAdmin");

			expect(() => assertPermission(user, "clients", "view")).not.toThrow();
			expect(() => assertPermission(user, "clients", "create")).not.toThrow();
			expect(() => assertPermission(user, "clients", "edit")).not.toThrow();
			expect(() => assertPermission(user, "clients", "delete")).not.toThrow();
		});

		it("should deny access without permissions", () => {
			const user = createUser("Viewer");

			expect(() => assertPermission(user, "clients", "create")).toThrow(
				ForbiddenError,
			);
			expect(() => assertPermission(user, "clients", "edit")).toThrow(
				ForbiddenError,
			);
			expect(() => assertPermission(user, "clients", "delete")).toThrow(
				ForbiddenError,
			);
		});

		it("should allow SuperAdmin to bypass all checks", () => {
			const user = createUser("SuperAdmin");

			// SuperAdmin can access any module with any action
			expect(() => assertPermission(user, "clients", "delete")).not.toThrow();
			expect(() => assertPermission(user, "users", "delete")).not.toThrow();
			expect(() => assertPermission(user, "settings", "edit")).not.toThrow();
			expect(() =>
				assertPermission(user, "any-module", "any-action"),
			).not.toThrow();
		});

		it("should grant partial access for limited roles", () => {
			const user = createUser("DocumentOfficer");

			// Can view clients but not modify
			expect(() => assertPermission(user, "clients", "view")).not.toThrow();
			expect(() => assertPermission(user, "clients", "create")).toThrow(
				ForbiddenError,
			);

			// Can fully manage documents
			expect(() => assertPermission(user, "documents", "view")).not.toThrow();
			expect(() => assertPermission(user, "documents", "create")).not.toThrow();
			expect(() => assertPermission(user, "documents", "edit")).not.toThrow();
		});
	});

	describe("Tenant Isolation Middleware", () => {
		it("should allow access to same tenant resources", () => {
			expect(() => assertTenantAccess(1, 1)).not.toThrow();
			expect(() => assertTenantAccess(100, 100)).not.toThrow();
		});

		it("should deny access to different tenant resources", () => {
			expect(() => assertTenantAccess(1, 2)).toThrow(ForbiddenError);
			expect(() => assertTenantAccess(1, 999)).toThrow(ForbiddenError);
		});

		it("should provide appropriate error message", () => {
			try {
				assertTenantAccess(1, 2);
				expect.fail("Should have thrown error");
			} catch (error) {
				expect(error).toBeInstanceOf(ForbiddenError);
				expect((error as Error).message).toContain("different tenant");
			}
		});
	});

	describe("Client Access Control", () => {
		it("should allow admin to access any client", () => {
			const admin = createUser("FirmAdmin");
			expect(canAccessClient(admin, 1, [])).toBe(true);
			expect(canAccessClient(admin, 999, [])).toBe(true);
		});

		it("should allow SuperAdmin to access any client", () => {
			const admin = createUser("SuperAdmin");
			expect(canAccessClient(admin, 1, [])).toBe(true);
			expect(canAccessClient(admin, 999, [])).toBe(true);
		});

		it("should allow staff to access any client", () => {
			const officer = createUser("ComplianceOfficer");
			expect(canAccessClient(officer, 1, [])).toBe(true);
			expect(canAccessClient(officer, 999, [])).toBe(true);
		});

		it("should restrict ClientPortalUser to assigned clients", () => {
			const portalUser = createUser("ClientPortalUser");
			const assignedClients = [1, 5, 10];

			expect(canAccessClient(portalUser, 1, assignedClients)).toBe(true);
			expect(canAccessClient(portalUser, 5, assignedClients)).toBe(true);
			expect(canAccessClient(portalUser, 10, assignedClients)).toBe(true);
			expect(canAccessClient(portalUser, 2, assignedClients)).toBe(false);
			expect(canAccessClient(portalUser, 999, assignedClients)).toBe(false);
		});

		it("should deny ClientPortalUser access to unassigned clients", () => {
			const portalUser = createUser("ClientPortalUser");
			expect(canAccessClient(portalUser, 1, [])).toBe(false);
		});
	});

	describe("Module-Specific Access Patterns", () => {
		describe("Clients Module", () => {
			it("should allow FirmAdmin full CRUD", () => {
				const user = createUser("FirmAdmin");

				expect(() => assertPermission(user, "clients", "view")).not.toThrow();
				expect(() => assertPermission(user, "clients", "create")).not.toThrow();
				expect(() => assertPermission(user, "clients", "edit")).not.toThrow();
				expect(() => assertPermission(user, "clients", "delete")).not.toThrow();
			});

			it("should allow Viewer read-only", () => {
				const user = createUser("Viewer");

				expect(() => assertPermission(user, "clients", "view")).not.toThrow();
				expect(() => assertPermission(user, "clients", "create")).toThrow();
				expect(() => assertPermission(user, "clients", "edit")).toThrow();
				expect(() => assertPermission(user, "clients", "delete")).toThrow();
			});
		});

		describe("Documents Module", () => {
			it("should allow DocumentOfficer to manage documents", () => {
				const user = createUser("DocumentOfficer");

				expect(() => assertPermission(user, "documents", "view")).not.toThrow();
				expect(() =>
					assertPermission(user, "documents", "create"),
				).not.toThrow();
				expect(() => assertPermission(user, "documents", "edit")).not.toThrow();
			});

			it("should deny Viewer from creating documents", () => {
				const user = createUser("Viewer");

				expect(() => assertPermission(user, "documents", "view")).not.toThrow();
				expect(() => assertPermission(user, "documents", "create")).toThrow();
			});
		});

		describe("Filings Module", () => {
			it("should allow ComplianceOfficer to submit filings", () => {
				const user = createUser("ComplianceOfficer");

				expect(() => assertPermission(user, "filings", "view")).not.toThrow();
				expect(() => assertPermission(user, "filings", "create")).not.toThrow();
				expect(() => assertPermission(user, "filings", "submit")).not.toThrow();
			});

			it("should deny DocumentOfficer from accessing filings", () => {
				const user = createUser("DocumentOfficer");

				expect(() => assertPermission(user, "filings", "view")).toThrow();
			});
		});

		describe("Users Module", () => {
			it("should allow FirmAdmin to manage users", () => {
				const user = createUser("FirmAdmin");

				expect(() => assertPermission(user, "users", "view")).not.toThrow();
				expect(() => assertPermission(user, "users", "create")).not.toThrow();
				expect(() => assertPermission(user, "users", "edit")).not.toThrow();
				expect(() => assertPermission(user, "users", "delete")).not.toThrow();
			});

			it("should deny non-admins from managing users", () => {
				const user = createUser("ComplianceManager");

				expect(() => assertPermission(user, "users", "view")).toThrow();
			});
		});

		describe("Settings Module", () => {
			it("should allow FirmAdmin to access settings", () => {
				const user = createUser("FirmAdmin");

				expect(() => assertPermission(user, "settings", "view")).not.toThrow();
				expect(() => assertPermission(user, "settings", "edit")).not.toThrow();
			});

			it("should deny non-admins from accessing settings", () => {
				const user = createUser("ComplianceOfficer");

				expect(() => assertPermission(user, "settings", "view")).toThrow();
			});
		});

		describe("Compliance Module", () => {
			it("should allow ComplianceManager full access", () => {
				const user = createUser("ComplianceManager");

				expect(() =>
					assertPermission(user, "compliance", "view"),
				).not.toThrow();
				expect(() =>
					assertPermission(user, "compliance", "edit"),
				).not.toThrow();
			});

			it("should allow FirmAdmin to view compliance", () => {
				const user = createUser("FirmAdmin");

				expect(() =>
					assertPermission(user, "compliance", "view"),
				).not.toThrow();
			});
		});
	});

	describe("Cross-Role Access Patterns", () => {
		it("should enforce hierarchy: SuperAdmin > FirmAdmin > Staff > Viewer", () => {
			const superAdmin = createUser("SuperAdmin");
			const firmAdmin = createUser("FirmAdmin");
			const staff = createUser("ComplianceOfficer");
			const viewer = createUser("Viewer");

			// All can view clients
			expect(() =>
				assertPermission(superAdmin, "clients", "view"),
			).not.toThrow();
			expect(() =>
				assertPermission(firmAdmin, "clients", "view"),
			).not.toThrow();
			expect(() => assertPermission(staff, "clients", "view")).not.toThrow();
			expect(() => assertPermission(viewer, "clients", "view")).not.toThrow();

			// Only admins can delete
			expect(() =>
				assertPermission(superAdmin, "clients", "delete"),
			).not.toThrow();
			expect(() =>
				assertPermission(firmAdmin, "clients", "delete"),
			).not.toThrow();
			expect(() => assertPermission(staff, "clients", "delete")).toThrow();
			expect(() => assertPermission(viewer, "clients", "delete")).toThrow();
		});
	});

	describe("Error Handling", () => {
		it("should provide clear error messages", () => {
			const user = createUser("Viewer");

			try {
				assertPermission(user, "clients", "delete");
				expect.fail("Should have thrown error");
			} catch (error) {
				expect(error).toBeInstanceOf(ForbiddenError);
				expect((error as Error).message).toContain("Viewer");
				expect((error as Error).message).toContain("delete");
				expect((error as Error).message).toContain("clients");
			}
		});

		it("should support custom error messages", () => {
			const user = createUser("Viewer");
			const customMessage = "You don't have permission to do this";

			try {
				assertPermission(user, "clients", "delete", customMessage);
				expect.fail("Should have thrown error");
			} catch (error) {
				expect((error as Error).message).toBe(customMessage);
			}
		});
	});
});
