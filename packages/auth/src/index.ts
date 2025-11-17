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

// Password strength validation
function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (password.length < 12) {
		errors.push("Password must be at least 12 characters long");
	}
	if (!/[A-Z]/.test(password)) {
		errors.push("Password must contain at least one uppercase letter");
	}
	if (!/[a-z]/.test(password)) {
		errors.push("Password must contain at least one lowercase letter");
	}
	if (!/\d/.test(password)) {
		errors.push("Password must contain at least one number");
	}
	if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
		errors.push("Password must contain at least one special character");
	}
	// Check for common weak passwords
	const commonPasswords = [
		"password123", "admin123", "qwerty123", "123456789", "password1234"
	];
	if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
		errors.push("Password contains common patterns that are not allowed");
	}

	return { isValid: errors.length === 0, errors };
}

// Rate limiting for failed authentication attempts
let failedAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();

// Clean up old failed attempts every 30 minutes
setInterval(() => {
	const now = Date.now();
	failedAttempts.forEach((value, key) => {
		if (value.lockedUntil && now > value.lockedUntil) {
			failedAttempts.delete(key);
		} else if (now - value.lastAttempt > 30 * 60 * 1000) { // 30 minutes
			failedAttempts.delete(key);
		}
	});
}, 30 * 60 * 1000);

function checkAccountLockout(identifier: string): { isLocked: boolean; lockedUntil?: number } {
	const attempt = failedAttempts.get(identifier);
	if (!attempt) return { isLocked: false };

	if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
		return { isLocked: true, lockedUntil: attempt.lockedUntil };
	}

	return { isLocked: false };
}

function recordFailedAttempt(identifier: string): void {
	const now = Date.now();
	const attempt = failedAttempts.get(identifier) || { count: 0, lastAttempt: now };

	attempt.count++;
	attempt.lastAttempt = now;

	// Progressive lockout: 5 attempts = 5 minutes, 10 attempts = 30 minutes, 15+ = 24 hours
	if (attempt.count >= 15) {
		attempt.lockedUntil = now + 24 * 60 * 60 * 1000; // 24 hours
	} else if (attempt.count >= 10) {
		attempt.lockedUntil = now + 30 * 60 * 1000; // 30 minutes
	} else if (attempt.count >= 5) {
		attempt.lockedUntil = now + 5 * 60 * 1000; // 5 minutes
	}

	failedAttempts.set(identifier, attempt);
}

function clearFailedAttempts(identifier: string): void {
	failedAttempts.delete(identifier);
}

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
				minLength: 12,
				requireNumbers: true,
				requireSpecialCharacters: true,
				requireUppercase: true,
				requireLowercase: true,
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
			enabled: true,
			csrfTokenHeader: "X-CSRF-Token",
			skipVerification: (context) => {
				// Skip CSRF for API routes that use proper authentication
				const url = new URL(context.request.url);
				return url.pathname.startsWith("/api/health") || url.pathname.startsWith("/api/ready");
			},
		},
		// Enhanced session security
		sessionConfig: {
			updateAge: 60 * 60 * 24, // 1 day
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			rolling: true,
		},
	},
	// Enhanced lifecycle hooks with security measures
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			const url = new URL(ctx.request.url);
			const isSignIn = ctx.path.startsWith("/sign-in") || ctx.path.startsWith("/signin");
			const isSignUp = ctx.path.startsWith("/sign-up") || ctx.path.startsWith("/signup");

			// Account lockout protection for sign-in attempts
			if (isSignIn) {
				const email = ctx.body?.email;
				if (email) {
					const lockoutCheck = checkAccountLockout(email);
					if (lockoutCheck.isLocked) {
						const remainingTime = lockoutCheck.lockedUntil ? Math.ceil((lockoutCheck.lockedUntil - Date.now()) / 60000) : 0;
						throw new Error(`Account is temporarily locked. Please try again in ${remainingTime} minutes.`);
					}
				}
			}

			// Password strength validation for sign-up
			if (isSignUp) {
				const password = ctx.body?.password;
				if (password) {
					const validation = validatePasswordStrength(password);
					if (!validation.isValid) {
						throw new Error(`Password does not meet security requirements: ${validation.errors.join(", ")}`);
					}
				}
			}
		}),
		after: createAuthMiddleware(async (ctx) => {
			const isSignIn = ctx.path.startsWith("/sign-in") || ctx.path.startsWith("/signin");
			const isSignUp = ctx.path.startsWith("/sign-up") || ctx.path.startsWith("/signup");

			// Handle successful sign-in
			if (isSignIn && ctx.context.session) {
				const email = ctx.body?.email;
				if (email) {
					clearFailedAttempts(email);
					// Log successful authentication for audit trail
					console.log(`✅ Successful authentication for ${email} at ${new Date().toISOString()}`);
				}
			} else if (isSignIn && !ctx.context.session) {
				// Handle failed sign-in
				const email = ctx.body?.email;
				if (email) {
					recordFailedAttempt(email);
					// Log failed authentication for audit trail
					console.warn(`⚠️  Failed authentication attempt for ${email} at ${new Date().toISOString()}`);
				}
			}

			// Run on user creation (sign-up)
			if (isSignUp) {
				// Access the newly created session from context
				const newSession = ctx.context.newSession;
				if (newSession?.session) {
					await ensureUserHasTenantAndRole(newSession.session.userId);
					// Log new user registration for audit trail
					console.log(`📝 New user registration: ${newSession.session.userId} at ${new Date().toISOString()}`);
				}
			}
		}),
	},
	// Enhanced session management with security
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
		// Enable session rotation for enhanced security
		rolling: true,
		// Custom session validation
		validateSession: async (session) => {
			// Additional security checks can be added here
			// For example, check if user is still active, hasn't been locked, etc.
			return true;
		},
	},
	// Rate limiting configuration
	rateLimit: {
		window: 15 * 60 * 1000, // 15 minutes
		max: 5, // 5 attempts per window
		skip: (request) => {
			// Skip rate limiting for health checks
			const url = new URL(request.url);
			return url.pathname.includes("/health") || url.pathname.includes("/ready");
		},
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
