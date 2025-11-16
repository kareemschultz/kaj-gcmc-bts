import prisma from "@GCMC-KAJ/db";
import type { UserRole } from "@GCMC-KAJ/types";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

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

		// 2. Find or create MEMBER role
		let memberRole = await prisma.role.findFirst({
			where: {
				tenantId: defaultTenant.id,
				name: "MEMBER",
			},
		});

		if (!memberRole) {
			console.log("📝 Creating MEMBER role...");
			memberRole = await prisma.role.create({
				data: {
					tenantId: defaultTenant.id,
					name: "MEMBER",
					description: "Standard platform member with basic access",
				},
			});

			// Create basic permissions for MEMBER role
			await prisma.permission.createMany({
				data: [
					{
						roleId: memberRole.id,
						module: "dashboard",
						action: "view",
						allowed: true,
					},
					{
						roleId: memberRole.id,
						module: "profile",
						action: "view",
						allowed: true,
					},
					{
						roleId: memberRole.id,
						module: "profile",
						action: "edit",
						allowed: true,
					},
				],
			});
		}

		// 3. Assign user to tenant with MEMBER role
		await prisma.tenantUser.create({
			data: {
				userId: userId,
				tenantId: defaultTenant.id,
				roleId: memberRole.id,
			},
		});

		console.log(
			`✅ Assigned user ${userId} to tenant "${defaultTenant.code}" with MEMBER role`,
		);
	} catch (error) {
		console.error(`❌ Failed to assign tenant/role to user ${userId}:`, error);
		// Don't throw - allow user creation to succeed even if assignment fails
		// This prevents broken auth state
	}
}

// Extend Better-Auth session to include tenant and role information
export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	trustedOrigins: [process.env.CORS_ORIGIN || ""],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
	// Add lifecycle hooks for automatic tenant/role assignment
	hooks: {
		after: [
			{
				matcher: () => true,
				handler: async (context) => {
					// Run on user creation (sign-up)
					if (
						context.request?.url?.includes("/sign-up") ||
						context.request?.url?.includes("/signup")
					) {
						const userId = context.user?.id;
						if (userId) {
							await ensureUserHasTenantAndRole(userId);
						}
					}
				},
			},
		],
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
