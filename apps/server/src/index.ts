import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const moduleDir = dirname(fileURLToPath(import.meta.url));
loadEnv();
if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET) {
	loadEnv({ path: resolve(moduleDir, "../../../.env") });
}

import { createContext } from "@GCMC-KAJ/api/context";
import { appRouter } from "@GCMC-KAJ/api/routers/index";
import { auth } from "@GCMC-KAJ/auth";
import { createCache } from "@GCMC-KAJ/cache";
import { validateEnv } from "@GCMC-KAJ/config";
import prisma from "@GCMC-KAJ/db";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { securityHeaders } from "./middleware/security";
import downloadsRoute from "./routes/downloads";

// Validate environment variables at startup (fail-fast approach)
const env = validateEnv();

const app = new Hono();

// Track readiness state
let isReady = false;

// Create a clean auth app with no middleware
const authApp = new Hono();

// Mount Better Auth handler directly (no middleware interference)
authApp.all("/*", async (c) => {
	console.log("🔐 Auth request:", c.req.method, c.req.url);

	// Handle CORS manually for auth routes
	const origin = c.req.header("origin");
	const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

	if (origin && allowedOrigins.includes(origin)) {
		c.header("Access-Control-Allow-Origin", origin);
	}
	c.header("Access-Control-Allow-Credentials", "true");
	c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	c.header(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, X-Requested-With",
	);

	// Handle preflight
	if (c.req.method === "OPTIONS") {
		const headers = new Headers();
		if (origin && allowedOrigins.includes(origin)) {
			headers.set("Access-Control-Allow-Origin", origin);
		}
		headers.set("Access-Control-Allow-Credentials", "true");
		headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

		return new Response(null, { status: 200, headers });
	}

	try {
		const res = await auth.handler(c.req.raw);
		console.log("🔐 Auth response status:", res.status);

		// Clone the response to add CORS headers
		const clonedRes = new Response(res.body, {
			status: res.status,
			statusText: res.statusText,
			headers: res.headers
		});

		// Add CORS headers to the cloned response
		if (origin && allowedOrigins.includes(origin)) {
			clonedRes.headers.set("Access-Control-Allow-Origin", origin);
		}
		clonedRes.headers.set("Access-Control-Allow-Credentials", "true");
		clonedRes.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		clonedRes.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

		return clonedRes;
	} catch (error) {
		console.error("❌ Auth handler error:", error);
		console.error(
			"❌ Error stack:",
			error instanceof Error ? error.stack : "No stack",
		);
		return c.json(
			{
				error: "Authentication failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// Mount the auth app FIRST before any other middleware
app.route("/api/auth", authApp);

// CORS configuration for other routes
app.use(
	cors({
		origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
		credentials: true,
		maxAge: 86400, // 24 hours
	}),
);

// Security headers middleware (applied to non-auth routes only)
app.use((c, next) => {
	// Skip security headers for auth routes
	if (c.req.url.includes("/api/auth/")) {
		return next();
	}
	return securityHeaders()(c, next);
});

// Request logging (applied to non-auth routes only)
app.use((c, next) => {
	// Skip logger for auth routes to prevent body consumption
	if (c.req.url.includes("/api/auth/")) {
		return next();
	}
	return logger()(c, next);
});

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: async (_opts, context) => {
			try {
				const ctx = await createContext({ context });
				console.log("🔍 tRPC Context created:", {
					hasSession: !!ctx.session,
					hasUser: !!ctx.user,
					userEmail: ctx.user?.email,
					tenantId: ctx.tenantId,
					role: ctx.role,
					tenant: ctx.tenant?.code,
				});
				return ctx;
			} catch (error) {
				console.error("❌ tRPC Context creation failed:", error);
				throw error;
			}
		},
		onError: ({ path, error, input }) => {
			console.error("🚨 tRPC Error:", {
				path,
				error: {
					code: error.code,
					message: error.message,
					stack: error.stack,
					cause: error.cause,
				},
				input,
			});
		},
	}),
);

app.route("/downloads", downloadsRoute);

// Health check endpoint - basic liveness check
app.get("/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
	});
});

// Readiness check endpoint - checks dependencies
app.get("/ready", async (c) => {
	try {
		// Check database connection
		await prisma.$queryRaw`SELECT 1`;

		if (!isReady) {
			isReady = true;
			console.log("✅ Service is ready");
		}

		return c.json({
			status: "ready",
			timestamp: new Date().toISOString(),
			checks: {
				database: "connected",
			},
		});
	} catch (error) {
		console.error("❌ Readiness check failed:", error);
		return c.json(
			{
				status: "not_ready",
				timestamp: new Date().toISOString(),
				checks: {
					database: "disconnected",
				},
				error: error instanceof Error ? error.message : "Unknown error",
			},
			503,
		);
	}
});

app.get("/", (c) => {
	return c.text("OK");
});

// Initialize readiness check on startup
async function checkReadiness() {
	try {
		await prisma.$connect();
		console.log("✅ Database connected");

		// Initialize cache
		await createCache({
			host: "localhost",
			port: 6379,
		});
		console.log("✅ Cache initialized");

		isReady = true;
	} catch (error) {
		console.error("❌ Startup failed:", error);
		isReady = false;
		// Retry after 5 seconds
		setTimeout(checkReadiness, 5000);
	}
}

// Start readiness check
checkReadiness();

// Global error handlers for production stability
process.on(
	"unhandledRejection",
	(reason: unknown, promise: Promise<unknown>) => {
		console.error("🚨 Unhandled Promise Rejection:", {
			timestamp: new Date().toISOString(),
			reason: reason instanceof Error ? reason.message : String(reason),
			stack: reason instanceof Error ? reason.stack : undefined,
			promise: String(promise),
		});
		// In production, you might want to send this to a monitoring service (Sentry, DataDog, etc.)
		// For now, we log but don't exit - let the health check handle service degradation
	},
);

process.on("uncaughtException", (error: Error) => {
	console.error("🚨 Uncaught Exception:", {
		timestamp: new Date().toISOString(),
		message: error.message,
		stack: error.stack,
	});
	// Uncaught exceptions are serious - gracefully shutdown
	console.error("💥 Server is shutting down due to uncaught exception");

	// Give time for logs to flush
	setTimeout(() => {
		process.exit(1);
	}, 1000);
});

// Graceful shutdown handler
process.on("SIGTERM", async () => {
	console.log("📥 SIGTERM received. Starting graceful shutdown...");

	try {
		await prisma.$disconnect();
		console.log("✅ Database connections closed");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error during shutdown:", error);
		process.exit(1);
	}
});

// Start the server
const port = process.env.PORT || process.env.HEALTH_PORT || 3003;

Bun.serve({
	fetch: app.fetch,
	port: Number(port),
});

console.log(`🚀 Server running on port ${port}`);
console.log(`🔐 Auth URL: http://localhost:${port}/api/auth/`);
console.log(`📊 Health check: http://localhost:${port}/health`);

export default app;
