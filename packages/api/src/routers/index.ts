import { protectedProcedure, publicProcedure, router } from "../index";

// Import all routers
import { analyticsRouter } from "./analytics";
import { clientBusinessesRouter } from "./clientBusinesses";
import { clientsRouter } from "./clients";
import { complianceRulesRouter } from "./complianceRules";
import { conversationsRouter } from "./conversations";
import { dashboardRouter } from "./dashboard";
import { documentTypesRouter } from "./documentTypes";
import { documentUploadRouter } from "./documentUpload";
import { documentsRouter } from "./documents";
import { filingTypesRouter } from "./filingTypes";
import { filingsRouter } from "./filings";
import { notificationsRouter } from "./notifications";
import { portalRouter } from "./portal";
import { recurringFilingsRouter } from "./recurringFilings";
import { requirementBundlesRouter } from "./requirementBundles";
import { rolesRouter } from "./roles";
import { serviceRequestsRouter } from "./serviceRequests";
import { servicesRouter } from "./services";
import { tasksRouter } from "./tasks";
import { tenantsRouter } from "./tenants";
import { usersRouter } from "./users";
import { wizardsRouter } from "./wizards";

export const appRouter = router({
	// System health check
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

	// Core business routers
	users: usersRouter,
	tenants: tenantsRouter,
	roles: rolesRouter,
	clients: clientsRouter,
	clientBusinesses: clientBusinessesRouter,

	// Document management
	documents: documentsRouter,
	documentTypes: documentTypesRouter,
	documentUpload: documentUploadRouter,

	// Filing management
	filings: filingsRouter,
	filingTypes: filingTypesRouter,
	recurringFilings: recurringFilingsRouter,

	// Service management
	services: servicesRouter,
	serviceRequests: serviceRequestsRouter,

	// Operational workflows
	tasks: tasksRouter,
	conversations: conversationsRouter,
	notifications: notificationsRouter,

	// Compliance & requirements
	complianceRules: complianceRulesRouter,
	requirementBundles: requirementBundlesRouter,

	// Analytics & dashboards
	dashboard: dashboardRouter,
	analytics: analyticsRouter,

	// Client-facing & wizards
	wizards: wizardsRouter,
	portal: portalRouter,
});

export type AppRouter = typeof appRouter;
