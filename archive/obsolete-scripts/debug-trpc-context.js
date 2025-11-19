#!/usr/bin/env bun

import { auth, getUserTenantRole } from "@GCMC-KAJ/auth";

async function testTrpcContext() {
	try {
		console.log("🔍 Testing tRPC context creation for admin user...\n");

		// Simulate what happens in the tRPC context
		const testHeaders = new Headers({
			cookie: "better-auth.session_token=your_session_token_here",
		});

		console.log("1. Testing auth.api.getSession...");

		// Create a mock request object
		const _mockRequest = {
			headers: testHeaders,
			url: "http://localhost:3000/test",
		};

		try {
			const session = await auth.api.getSession({ headers: testHeaders });

			if (session) {
				console.log(
					`✅ Session found for user: ${session.user?.email} (ID: ${session.user?.id})`,
				);

				// Test getUserTenantRole
				console.log("2. Testing getUserTenantRole...");
				const tenantInfo = await getUserTenantRole(session.user.id);

				if (tenantInfo) {
					console.log("✅ Tenant info found:");
					console.log(
						`   - Tenant: ${tenantInfo.tenant.name} (${tenantInfo.tenant.code})`,
					);
					console.log(`   - Role: ${tenantInfo.role}`);
					console.log(`   - Tenant ID: ${tenantInfo.tenantId}`);

					// Test RBAC permission check
					console.log("3. Testing RBAC permission check...");

					const { hasPermission } = await import("@GCMC-KAJ/rbac");

					const userContext = {
						userId: session.user.id,
						tenantId: tenantInfo.tenantId,
						role: tenantInfo.role,
					};

					const hasAnalyticsView = hasPermission(
						userContext,
						"analytics",
						"view",
					);
					console.log(`✅ Analytics view permission: ${hasAnalyticsView}`);

					if (!hasAnalyticsView) {
						console.log("❌ Permission check failed - this is the root cause!");
						console.log("Role definition check:");

						const { ROLE_DEFINITIONS } = await import(
							"@GCMC-KAJ/rbac/src/roles"
						);
						const roleDefinition = ROLE_DEFINITIONS.find(
							(r) => r.name === tenantInfo.role,
						);

						if (roleDefinition) {
							console.log(
								`   - Role found in definitions: ${roleDefinition.name}`,
							);
							console.log("   - Permissions:", roleDefinition.permissions);

							const analyticsPermission = roleDefinition.permissions.find(
								(p) => p.module === "analytics",
							);
							if (analyticsPermission) {
								console.log(
									"   - Analytics module permission:",
									analyticsPermission,
								);
							} else {
								console.log(
									"   - ❌ No analytics permission found in role definition",
								);
							}
						} else {
							console.log(
								`   - ❌ Role ${tenantInfo.role} not found in ROLE_DEFINITIONS`,
							);
						}
					}
				} else {
					console.log("❌ No tenant info found - user not assigned to tenant");
				}
			} else {
				console.log("❌ No session found - user not authenticated");
				console.log(
					"This might be because we're using a mock cookie. Let's test with a real session...",
				);

				// Test by creating a new session via email/password
				console.log("4. Testing sign-in to get real session...");

				const signInResult = await auth.api.signInEmail({
					body: {
						email: "admin@gcmc-kaj.com",
						password: "SuperAdminPassword123!",
					},
					headers: new Headers(),
					asResponse: false,
				});

				console.log("Sign-in result:", signInResult);
			}
		} catch (authError) {
			console.error("❌ Auth error:", authError);
		}
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

testTrpcContext();
