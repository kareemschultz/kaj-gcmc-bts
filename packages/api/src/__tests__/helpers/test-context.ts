/**
 * Mock tRPC Context Creator
 *
 * Helper function to create mock context for testing tRPC procedures
 */

import type { Context } from "../../context";
import type { UserRole } from "@GCMC-KAJ/types";

/**
 * Create a mock tRPC context for testing
 *
 * @param userId - The user ID (defaults to test user)
 * @param tenantId - The tenant ID (defaults to test tenant)
 * @param role - The user role (defaults to FirmAdmin)
 * @returns Mock context object matching the Context type
 */
export function createMockContext(
	userId: string,
	tenantId: number,
	role: UserRole,
): Context {
	return {
		session: {
			id: `test-session-${userId}`,
			userId,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
			token: `test-token-${userId}`,
			createdAt: new Date(),
			updatedAt: new Date(),
			ipAddress: "127.0.0.1",
			userAgent: "test-agent",
		},
		user: {
			id: userId,
			email: `${userId}@test.com`,
			name: `Test User ${userId}`,
		},
		tenantId,
		role,
		tenant: {
			id: tenantId,
			name: "Test Tenant",
			code: "TEST",
		},
	};
}

/**
 * Create a mock context without authentication (for testing public procedures)
 */
export function createUnauthenticatedContext(): Context {
	return {
		session: null,
		user: null,
		tenantId: undefined,
		role: undefined,
		tenant: undefined,
	};
}

/**
 * Create a mock context with specific user details
 */
export function createMockContextWithUser(params: {
	userId: string;
	email: string;
	name: string;
	tenantId: number;
	tenantName: string;
	tenantCode: string;
	role: UserRole;
}): Context {
	return {
		session: {
			id: `test-session-${params.userId}`,
			userId: params.userId,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
			token: `test-token-${params.userId}`,
			createdAt: new Date(),
			updatedAt: new Date(),
			ipAddress: "127.0.0.1",
			userAgent: "test-agent",
		},
		user: {
			id: params.userId,
			email: params.email,
			name: params.name,
		},
		tenantId: params.tenantId,
		role: params.role,
		tenant: {
			id: params.tenantId,
			name: params.tenantName,
			code: params.tenantCode,
		},
	};
}

/**
 * Helper to create contexts for all test roles
 */
export const testContexts = {
	superAdmin: (userId = "test-superadmin-1", tenantId = 1) =>
		createMockContext(userId, tenantId, "SuperAdmin"),

	firmAdmin: (userId = "test-firmadmin-1", tenantId = 1) =>
		createMockContext(userId, tenantId, "FirmAdmin"),

	complianceManager: (userId = "test-compliance-mgr-1", tenantId = 1) =>
		createMockContext(userId, tenantId, "ComplianceManager"),

	complianceOfficer: (userId = "test-compliance-off-1", tenantId = 1) =>
		createMockContext(userId, tenantId, "ComplianceOfficer"),

	documentOfficer: (userId = "test-doc-officer-1", tenantId = 1) =>
		createMockContext(userId, tenantId, "DocumentOfficer"),

	filingClerk: (userId = "test-filing-clerk-1", tenantId = 1) =>
		createMockContext(userId, tenantId, "FilingClerk"),

	viewer: (userId = "test-viewer-1", tenantId = 1) =>
		createMockContext(userId, tenantId, "Viewer"),

	clientPortalUser: (userId = "test-client-portal-1", tenantId = 1) =>
		createMockContext(userId, tenantId, "ClientPortalUser"),

	unauthenticated: createUnauthenticatedContext,
};
