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

// Extend Better-Auth session to include tenant and role information
export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	trustedOrigins: getCorsOrigins(),
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			// Use "lax" for better CSRF protection unless in production cross-origin setup
			sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
		},
	},
	// Add lifecycle hooks for automatic tenant/role assignment
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			// Run on user creation (sign-up)
			if (ctx.path.startsWith("/sign-up") || ctx.path.startsWith("/signup")) {
				// Access the newly created session from context
				const newSession = ctx.context.newSession;
				if (newSession?.session) {
					await ensureUserHasTenantAndRole(newSession.session.userId);
				}
			}
		}),
	},
	// Add session callback to include tenant and role
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
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
