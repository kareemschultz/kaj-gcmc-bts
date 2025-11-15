import { protectedProcedure, publicProcedure, router } from "../index";
import { clientsRouter } from "./clients";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.user,
			tenant: ctx.tenant,
			role: ctx.role,
		};
	}),
	// Business routers
	clients: clientsRouter,
	// TODO: Add remaining 21 routers:
	// users, documents, filings, services, tasks, roles, tenants,
	// serviceRequests, complianceRules, conversations, documentTypes,
	// filingTypes, requirementBundles, wizards, recurringFilings,
	// clientBusinesses, dashboard, documentUpload, notifications,
	// analytics, portal
});

export type AppRouter = typeof appRouter;
