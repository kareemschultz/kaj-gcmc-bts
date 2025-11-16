/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup
 * Uses Zod for type-safe validation with clear error messages
 *
 * SECURITY: Fail-fast approach - if critical env vars are missing or invalid,
 * the application will not start, preventing runtime errors and misconfigurations
 */

import { z } from "zod";

/**
 * Environment schema definition
 */
const envSchema = z.object({
	// Node Environment
	NODE_ENV: z
		.enum(["development", "production", "test"], {
			errorMap: () => ({
				message: "NODE_ENV must be one of: development, production, test",
			}),
		})
		.default("development"),

	// Database
	DATABASE_URL: z
		.string()
		.url("DATABASE_URL must be a valid PostgreSQL connection string")
		.startsWith("postgresql://", "DATABASE_URL must be a PostgreSQL URL"),

	// Authentication
	BETTER_AUTH_SECRET: z
		.string()
		.min(32, "BETTER_AUTH_SECRET must be at least 32 characters for security"),
	BETTER_AUTH_URL: z
		.string()
		.url("BETTER_AUTH_URL must be a valid URL")
		.default("http://localhost:3000"),

	// CORS Configuration
	CORS_ORIGIN: z
		.union([z.string().url("CORS_ORIGIN must be a valid URL"), z.literal("*")])
		.default("http://localhost:3001"),

	// Redis Configuration (for BullMQ job queues)
	REDIS_URL: z
		.string()
		.url("REDIS_URL must be a valid Redis connection string")
		.startsWith("redis://", "REDIS_URL must be a Redis URL"),

	// MinIO/S3 Configuration
	MINIO_ENDPOINT: z
		.string()
		.min(1, "MINIO_ENDPOINT is required")
		.refine((val) => !val.startsWith("http"), {
			message: "MINIO_ENDPOINT should not include protocol (http/https)",
		}),
	MINIO_PORT: z
		.string()
		.regex(/^\d+$/, "MINIO_PORT must be a number")
		.transform((val) => Number.parseInt(val, 10))
		.refine((port) => port > 0 && port <= 65535, {
			message: "MINIO_PORT must be between 1 and 65535",
		})
		.default("9000"),
	MINIO_USE_SSL: z
		.string()
		.regex(/^(true|false)$/, "MINIO_USE_SSL must be 'true' or 'false'")
		.transform((val) => val === "true")
		.default("false"),
	MINIO_ACCESS_KEY: z
		.string()
		.min(3, "MINIO_ACCESS_KEY must be at least 3 characters"),
	MINIO_SECRET_KEY: z
		.string()
		.min(8, "MINIO_SECRET_KEY must be at least 8 characters"),
	MINIO_REGION: z.string().default("us-east-1"),

	// Application URLs
	NEXT_PUBLIC_APP_URL: z
		.string()
		.url("NEXT_PUBLIC_APP_URL must be a valid URL")
		.default("http://localhost:3001"),
	NEXT_PUBLIC_API_URL: z
		.string()
		.url("NEXT_PUBLIC_API_URL must be a valid URL")
		.default("http://localhost:3000"),
	NEXT_PUBLIC_SERVER_URL: z
		.string()
		.url("NEXT_PUBLIC_SERVER_URL must be a valid URL")
		.default("http://localhost:3000"),
	PORTAL_URL: z
		.string()
		.url("PORTAL_URL must be a valid URL")
		.default("http://localhost:3002"),
	SUPPORT_EMAIL: z
		.string()
		.email("SUPPORT_EMAIL must be a valid email address")
		.default("support@example.com"),

	// Optional: Email Configuration
	EMAIL_PROVIDER: z.enum(["log", "resend", "smtp"]).default("log"),
	EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email").optional(),
	EMAIL_FROM_NAME: z.string().optional(),
	EMAIL_REPLY_TO: z.string().email("EMAIL_REPLY_TO must be a valid email").optional(),

	// Resend Configuration
	RESEND_API_KEY: z.string().optional(),

	// SMTP Configuration
	SMTP_HOST: z.string().optional(),
	SMTP_PORT: z
		.string()
		.regex(/^\d+$/)
		.transform((val) => Number.parseInt(val, 10))
		.optional(),
	SMTP_USER: z.string().email("SMTP_USER must be a valid email").optional(),
	SMTP_PASS: z.string().optional(),
	SMTP_PASSWORD: z.string().optional(), // Alternative to SMTP_PASS
	SMTP_FROM: z.string().email("SMTP_FROM must be a valid email").optional(),

	// Optional: Upstash Redis (for rate limiting)
	UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL").optional(),
	UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

	// Optional: Logging
	LOG_LEVEL: z
		.enum(["debug", "info", "warn", "error"], {
			errorMap: () => ({
				message: "LOG_LEVEL must be one of: debug, info, warn, error",
			}),
		})
		.default("info"),

	// Optional: Feature Flags
	ENABLE_EMAIL_NOTIFICATIONS: z
		.string()
		.regex(/^(true|false)$/)
		.transform((val) => val === "true")
		.default("false"),
	ENABLE_SMS_NOTIFICATIONS: z
		.string()
		.regex(/^(true|false)$/)
		.transform((val) => val === "true")
		.default("false"),
	ENABLE_COMPLIANCE_ENGINE: z
		.string()
		.regex(/^(true|false)$/)
		.transform((val) => val === "true")
		.default("true"),
	ENABLE_ANALYTICS: z
		.string()
		.regex(/^(true|false)$/)
		.transform((val) => val === "true")
		.default("true"),
});

/**
 * Validated environment variables
 * Exported as a type-safe object
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 *
 * Call this at application startup to ensure all required
 * environment variables are present and valid
 *
 * @throws {Error} If validation fails
 */
export function validateEnv(): Env {
	try {
		const validated = envSchema.parse(process.env);

		// Additional production checks
		if (validated.NODE_ENV === "production") {
			// Ensure critical secrets are not default values
			if (
				validated.BETTER_AUTH_SECRET ===
				"your-secret-key-here-change-in-production"
			) {
				throw new Error(
					"CRITICAL: BETTER_AUTH_SECRET must be changed from default in production",
				);
			}

			// Warn about insecure configurations
			if (validated.CORS_ORIGIN === "*") {
				console.warn(
					"WARNING: CORS_ORIGIN is set to '*' in production. This is insecure!",
				);
			}

			if (!validated.MINIO_USE_SSL) {
				console.warn(
					"WARNING: MINIO_USE_SSL is disabled in production. Consider enabling SSL.",
				);
			}
		}

		return validated;
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("❌ Environment validation failed:");
			console.error("");

			for (const issue of error.issues) {
				console.error(`  • ${issue.path.join(".")}: ${issue.message}`);
			}

			console.error("");
			console.error(
				"Please check your .env file and ensure all required environment variables are set correctly.",
			);
			console.error("");

			// Exit the process - fail fast
			process.exit(1);
		}

		// Re-throw other errors
		throw error;
	}
}

/**
 * Lazy-loaded validated environment
 * Call validateEnv() first at application startup
 */
let _env: Env | null = null;

export function getEnv(): Env {
	if (!_env) {
		_env = validateEnv();
	}
	return _env;
}

/**
 * Export for use in other packages
 */
export { envSchema };
