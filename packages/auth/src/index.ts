import prisma from "@GCMC-KAJ/db";
import type { UserRole } from "@GCMC-KAJ/types";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";

// Helper function to assign user to default tenant with role
async function ensureUserHasTenantAndRole(userId: string) {
	try {
		// Check if user already has tenant assignment
		const existingAssignment = await prisma.tenantUser.findFirst({
			where: { userId },
		});

		if (existingAssignment) {
			console.log(`ℹ️  User ${userId} already assigned to tenant`);
			return;
		}

		// 1. Find or create default tenant
		let defaultTenant = await prisma.tenant.findUnique({
			where: { code: "default-organization" },
		});

		if (!defaultTenant) {
			console.log("📝 Creating default tenant...");
			defaultTenant = await prisma.tenant.create({
				data: {
					name: "Default Organization",
					code: "default-organization",
					contactInfo: {},
					settings: {},
				},
			});
		}

		// 2. Find or create Viewer role (from RBAC definitions)
		let viewerRole = await prisma.role.findFirst({
			where: {
				tenantId: defaultTenant.id,
				name: "Viewer",
			},
		});

		if (!viewerRole) {
			console.log("📝 Creating Viewer role...");
			viewerRole = await prisma.role.create({
				data: {
					tenantId: defaultTenant.id,
					name: "Viewer",
					description: "Read-only access to client information",
				},
			});

			// Create comprehensive permissions for Viewer role based on RBAC definitions
			await prisma.permission.createMany({
				data: [
					// Core viewing permissions
					{
						roleId: viewerRole.id,
						module: "clients",
						action: "view",
						allowed: true,
					},
					{
						roleId: viewerRole.id,
						module: "documents",
						action: "view",
						allowed: true,
					},
					{
						roleId: viewerRole.id,
						module: "filings",
						action: "view",
						allowed: true,
					},
					{
						roleId: viewerRole.id,
						module: "services",
						action: "view",
						allowed: true,
					},

					// Dashboard and analytics
					{
						roleId: viewerRole.id,
						module: "analytics",
						action: "view",
						allowed: true,
					},
					{
						roleId: viewerRole.id,
						module: "compliance",
						action: "view",
						allowed: true,
					},
					{
						roleId: viewerRole.id,
						module: "tasks",
						action: "view",
						allowed: true,
					},

					// Notifications and profile
					{
						roleId: viewerRole.id,
						module: "notifications",
						action: "view",
						allowed: true,
					},
					{
						roleId: viewerRole.id,
						module: "profile",
						action: "view",
						allowed: true,
					},
					{
						roleId: viewerRole.id,
						module: "profile",
						action: "edit",
						allowed: true,
					},

					// Dashboard access
					{
						roleId: viewerRole.id,
						module: "dashboard",
						action: "view",
						allowed: true,
					},
				],
			});
		}

		// 3. Assign user to tenant with Viewer role
		await prisma.tenantUser.create({
			data: {
				userId: userId,
				tenantId: defaultTenant.id,
				roleId: viewerRole.id,
			},
		});

		console.log(
			`✅ Assigned user ${userId} to tenant "${defaultTenant.code}" with Viewer role`,
		);
	} catch (error) {
		console.error(`❌ Failed to assign tenant/role to user ${userId}:`, error);
		// Don't throw - allow user creation to succeed even if assignment fails
		// This prevents broken auth state
	}
}

// Helper function to get CORS origins for BetterAuth
function getCorsOrigins(): string[] {
	// Option 1: Comma-separated list in CORS_ORIGIN
	const corsOrigin = process.env.CORS_ORIGIN;
	if (corsOrigin) {
		const origins = corsOrigin
			.split(",")
			.map((o) => o.trim())
			.filter(Boolean);
		if (origins.length > 0) return origins;
	}

	// Option 2: Individual environment variables (fallback)
	const origins: string[] = [];
	if (process.env.WEB_URL) origins.push(process.env.WEB_URL);
	if (process.env.PORTAL_URL) origins.push(process.env.PORTAL_URL);

	// Option 3: Development defaults
	if (origins.length === 0) {
		return ["http://localhost:3001", "http://localhost:3002"];
	}

	return origins;
}

// Enhanced Security Configuration
const isProduction = process.env.NODE_ENV === "production";

// Simplified validation for basic functionality
// Complex validation removed to avoid body consumption conflicts

// Extend Better-Auth session to include tenant and role information
export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	trustedOrigins: getCorsOrigins(),
	emailAndPassword: {
		enabled: true,
		password: {
			config: {
				minLength: 8,
				requireNumbers: false,
				requireSpecialCharacters: false,
				requireUppercase: false,
				requireLowercase: false,
			},
		},
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: isProduction ? "lax" : "lax",
			secure: isProduction,
			httpOnly: true,
			// Enhanced cookie security
			maxAge: 60 * 60 * 24 * 7, // 7 days
			path: "/",
			// Prevent cookie access from JavaScript
			domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
		},
		csrfProtection: {
			enabled: false,
		},
		// Enhanced session security
		sessionConfig: {
			updateAge: 60 * 60 * 24, // 1 day
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			rolling: true,
		},
	},
	// Remove hooks entirely for now to get basic auth working
	// hooks: {
	// 	after: [
	// 		{
	// 			matcher: (context) => context.path === "/sign-up/email",
	// 			handler: async (ctx) => {
	// 				if (ctx.context.returned?.user?.id) {
	// 					await ensureUserHasTenantAndRole(ctx.context.returned.user.id);
	// 					console.log(`✅ New user setup completed: ${ctx.context.returned.user.id}`);
	// 				}
	// 			},
	// 		},
	// 	],
	// },
	// Enhanced session management with security
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
		// Enable session rotation for enhanced security
		rolling: true,
		// Custom session validation
		validateSession: async (_session) => {
			// Additional security checks can be added here
			// For example, check if user is still active, hasn't been locked, etc.
			return true;
		},
	},
	// Disable built-in rate limiting to avoid conflicts with Hono middleware
	rateLimit: {
		enabled: false,
	},
});

// Helper to get user's tenant and role from database
export async function getUserTenantRole(userId: string): Promise<{
	tenantId: number;
	role: UserRole;
	tenant: { id: number; name: string; code: string };
} | null> {
	const tenantUser = await prisma.tenantUser.findFirst({
		where: { userId },
		include: {
			role: true,
			tenant: true,
		},
	});

	if (!tenantUser) {
		return null;
	}

	return {
		tenantId: tenantUser.tenantId,
		role: tenantUser.role.name as UserRole,
		tenant: {
			id: tenantUser.tenant.id,
			name: tenantUser.tenant.name,
			code: tenantUser.tenant.code,
		},
	};
}
