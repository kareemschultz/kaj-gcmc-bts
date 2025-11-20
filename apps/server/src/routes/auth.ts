import { auth } from "@GCMC-KAJ/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";

const authApp = new Hono();

// Enhanced CORS configuration for auth routes
const corsConfig = {
	origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
	allowHeaders: [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"Accept",
		"Accept-Language",
		"Accept-Encoding",
		"Origin",
		"DNT",
		"X-Forwarded-For",
		"X-Forwarded-Proto",
		"X-Real-IP",
		"User-Agent",
		"Cache-Control",
		"Pragma",
		"Cookie",
		"Set-Cookie",
		"X-CSRF-Token"
	],
	credentials: true,
	maxAge: 86400, // 24 hours
};

// Apply CORS to all auth routes
authApp.use(cors(corsConfig));

// Better Auth handler for all auth routes
authApp.all("*", async (c) => {
	console.log(`🔐 Auth request: ${c.req.method} ${c.req.url}`);

	try {
		// Simply pass the original request to Better Auth
		// Better Auth will handle the request parsing internally
		const response = await auth.handler(c.req.raw);

		console.log("🔐 Auth response status:", response.status);

		// Log response for debugging
		if (response.status >= 400) {
			try {
				const responseText = await response.clone().text();
				console.log("🔐 Auth response body:", responseText);
			} catch (e) {
				console.log("🔐 Could not read response body for logging");
			}
		}

		// Return the response from Better Auth
		return response;
	} catch (error) {
		console.error("❌ Auth handler error:", error);
		console.error("❌ Error stack:", error instanceof Error ? error.stack : undefined);

		return c.json(
			{
				error: "Authentication error",
				message: error instanceof Error ? error.message : "Unknown error"
			},
			500
		);
	}
});

export default authApp;