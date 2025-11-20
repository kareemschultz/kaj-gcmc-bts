import { auth, getUserTenantRole } from "@GCMC-KAJ/auth";
import type { UserRole } from "@GCMC-KAJ/types";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	// Debug logging
	console.log("🔍 Context creation debug:", {
		hasSession: !!session,
		hasUser: !!session?.user,
		userId: session?.user?.id,
		userEmail: session?.user?.email,
	});

	// If user is authenticated, get their tenant and role
	let tenantInfo: {
		tenantId: number;
		role: UserRole;
		tenant: { id: number; name: string; code: string };
	} | null = null;

	if (session?.user?.id) {
		console.log("🔍 Getting tenant role for user:", session.user.id);
		try {
			tenantInfo = await getUserTenantRole(session.user.id);
			console.log("🔍 Tenant info result:", tenantInfo);
		} catch (error) {
			console.error("❌ Error getting tenant role:", error);
			tenantInfo = null;
		}
	}

	return {
		session,
		user: session?.user
			? {
					id: session.user.id,
					email: session.user.email,
					name: session.user.name,
				}
			: null,
		tenantId: tenantInfo?.tenantId,
		role: tenantInfo?.role,
		tenant: tenantInfo?.tenant,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
