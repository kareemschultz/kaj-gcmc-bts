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

// Security headers middleware (applied to all routes)
app.use("*", securityHeaders());

// Request logging
app.use(logger());

// CORS configuration with validated environment
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
		maxAge: 86400, // 24 hours
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
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
		isReady = true;
	} catch (error) {
		console.error("❌ Database connection failed:", error);
		isReady = false;
		// Retry after 5 seconds
		setTimeout(checkReadiness, 5000);
	}
}

// Start readiness check
checkReadiness();

// Global error handlers for production stability
process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
	console.error("🚨 Unhandled Promise Rejection:", {
		timestamp: new Date().toISOString(),
		reason: reason instanceof Error ? reason.message : String(reason),
		stack: reason instanceof Error ? reason.stack : undefined,
		promise: String(promise),
	});
	// In production, you might want to send this to a monitoring service (Sentry, DataDog, etc.)
	// For now, we log but don't exit - let the health check handle service degradation
});

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

export default app;
