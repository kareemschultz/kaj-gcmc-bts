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

	// If user is authenticated, get their tenant and role
	let tenantInfo: {
		tenantId: number;
		role: UserRole;
		tenant: { id: number; name: string; code: string };
	} | null = null;

	if (session?.user?.id) {
		tenantInfo = await getUserTenantRole(session.user.id);
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
