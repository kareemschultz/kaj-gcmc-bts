import { z } from "zod";
import { publicProcedure, router } from "../index";

export const authRouter = router({
	// Get current session information
	getSession: publicProcedure.query(async ({ ctx }) => {
		return {
			user: ctx.user,
			session: ctx.session,
			tenant: ctx.tenant,
			role: ctx.role,
			tenantId: ctx.tenantId,
		};
	}),

	// Get current user information
	getUser: publicProcedure.query(async ({ ctx }) => {
		if (!ctx.user) {
			return null;
		}

		return {
			id: ctx.user.id,
			email: ctx.user.email,
			name: ctx.user.name,
			tenant: ctx.tenant,
			role: ctx.role,
			tenantId: ctx.tenantId,
		};
	}),

	// Check if user is authenticated
	isAuthenticated: publicProcedure.query(async ({ ctx }) => {
		return {
			authenticated: !!ctx.user,
			hasSession: !!ctx.session,
		};
	}),
});