import { performanceMiddleware } from "@GCMC-KAJ/cache";
import { assertPermission, type UserPermissionContext } from "@GCMC-KAJ/rbac";
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure.use(performanceMiddleware());

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure
	.use(performanceMiddleware())
	.use(({ ctx, next }) => {
		if (!ctx.session || !ctx.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
				cause: "No session",
			});
		}

		if (!ctx.tenantId || !ctx.role) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "User not associated with any tenant",
				cause: "No tenant assignment",
			});
		}

		return next({
			ctx: {
				...ctx,
				session: ctx.session,
				user: ctx.user,
				tenantId: ctx.tenantId,
				role: ctx.role,
				tenant: ctx.tenant,
			},
		});
	});

/**
 * Helper to create RBAC-aware procedures
 * Usage: rbacProcedure('clients', 'view')
 */
export function rbacProcedure(module: string, action: string) {
	return protectedProcedure.use(({ ctx, next }) => {
		const userContext: UserPermissionContext = {
			userId: ctx.user.id,
			tenantId: ctx.tenantId,
			role: ctx.role,
		};

		assertPermission(userContext, module, action);

		return next({ ctx });
	});
}
