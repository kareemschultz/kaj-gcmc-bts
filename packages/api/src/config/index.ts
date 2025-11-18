/**
 * Application Configuration
 *
 * Centralized configuration management with validation and type safety
 */

import { z } from "zod";

const configSchema = z.object({
	// Database Configuration
	database: z.object({
		url: z.string().url(),
		maxConnections: z.number().min(1).max(100).default(10),
		connectionTimeout: z.number().min(1000).default(10000),
		idleTimeout: z.number().min(1000).default(30000),
		enableLogging: z.boolean().default(false),
		enableMetrics: z.boolean().default(true),
	}),

	// Redis Configuration
	redis: z.object({
		url: z.string().url(),
		maxRetriesPerRequest: z.number().min(1).default(3),
	}),

	// Cache Configuration
	cache: z.object({
		defaultTtl: z.number().min(60).default(3600),
		l1MaxSize: z.number().min(100).default(1000),
	}),

	// Logging Configuration
	logging: z.object({
		level: z.enum(["debug", "info", "warn", "error", "fatal"]).default("info"),
		enableStructured: z.boolean().default(true),
	}),

	// Metrics Configuration
	metrics: z.object({
		enabled: z.boolean().default(true),
		collectInterval: z.number().min(5000).default(30000),
	}),

	// Server Configuration
	server: z.object({
		port: z.number().min(1).max(65535).default(3001),
		host: z.string().default("localhost"),
		cors: z.object({
			origin: z.union([z.string(), z.array(z.string())]).default("*"),
			credentials: z.boolean().default(true),
		}),
	}),

	// Security Configuration
	security: z.object({
		rateLimit: z.object({
			windowMs: z.number().min(1000).default(900000), // 15 minutes
			max: z.number().min(1).default(100),
			message: z.string().default("Too many requests from this IP"),
		}),
		cors: z.object({
			origin: z.union([z.string(), z.array(z.string())]).default("*"),
			credentials: z.boolean().default(true),
		}),
	}),

	// External Services
	external: z.object({
		email: z.object({
			provider: z.enum(["smtp", "sendgrid", "ses"]).default("smtp"),
			apiKey: z.string().optional(),
			fromEmail: z.string().email(),
		}),
		storage: z.object({
			provider: z.enum(["local", "minio", "s3"]).default("minio"),
			endpoint: z.string().optional(),
			accessKey: z.string().optional(),
			secretKey: z.string().optional(),
			bucket: z.string().default("gcmc-documents"),
		}),
	}),

	// Feature Flags
	features: z.object({
		enableAdvancedCaching: z.boolean().default(true),
		enableMetrics: z.boolean().default(true),
		enableEventSourcing: z.boolean().default(false),
		enableDistributedTracing: z.boolean().default(false),
	}),

	// Environment
	environment: z
		.enum(["development", "staging", "production"])
		.default("development"),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
	const rawConfig = {
		database: {
			url: process.env.DATABASE_URL || "postgresql://localhost:5432/gcmc_kaj",
			maxConnections: Number.parseInt(
				process.env.DB_MAX_CONNECTIONS || "10",
				10,
			),
			connectionTimeout: Number.parseInt(
				process.env.DB_CONNECTION_TIMEOUT || "10000",
				10,
			),
			idleTimeout: Number.parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
			enableLogging: process.env.DB_ENABLE_LOGGING === "true",
			enableMetrics: process.env.DB_ENABLE_METRICS !== "false",
		},
		redis: {
			url: process.env.REDIS_URL || "redis://localhost:6379",
			maxRetriesPerRequest: Number.parseInt(
				process.env.REDIS_MAX_RETRIES || "3",
				10,
			),
		},
		cache: {
			defaultTtl: Number.parseInt(process.env.CACHE_DEFAULT_TTL || "3600", 10),
			l1MaxSize: Number.parseInt(process.env.CACHE_L1_MAX_SIZE || "1000", 10),
		},
		logging: {
			level: (process.env.LOG_LEVEL as any) || "info",
			enableStructured: process.env.LOG_STRUCTURED !== "false",
		},
		metrics: {
			enabled: process.env.METRICS_ENABLED !== "false",
			collectInterval: Number.parseInt(
				process.env.METRICS_COLLECT_INTERVAL || "30000",
				10,
			),
		},
		server: {
			port: Number.parseInt(process.env.PORT || "3001", 10),
			host: process.env.HOST || "localhost",
			cors: {
				origin: process.env.CORS_ORIGIN
					? process.env.CORS_ORIGIN.includes(",")
						? process.env.CORS_ORIGIN.split(",")
						: process.env.CORS_ORIGIN
					: "*",
				credentials: process.env.CORS_CREDENTIALS !== "false",
			},
		},
		security: {
			rateLimit: {
				windowMs: Number.parseInt(
					process.env.RATE_LIMIT_WINDOW_MS || "900000",
					10,
				),
				max: Number.parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
				message:
					process.env.RATE_LIMIT_MESSAGE || "Too many requests from this IP",
			},
			cors: {
				origin: process.env.CORS_ORIGIN
					? process.env.CORS_ORIGIN.includes(",")
						? process.env.CORS_ORIGIN.split(",")
						: process.env.CORS_ORIGIN
					: "*",
				credentials: process.env.CORS_CREDENTIALS !== "false",
			},
		},
		external: {
			email: {
				provider: (process.env.EMAIL_PROVIDER as any) || "smtp",
				apiKey: process.env.EMAIL_API_KEY,
				fromEmail: process.env.EMAIL_FROM || "noreply@gcmc-kaj.com",
			},
			storage: {
				provider: (process.env.STORAGE_PROVIDER as any) || "minio",
				endpoint: process.env.STORAGE_ENDPOINT,
				accessKey: process.env.STORAGE_ACCESS_KEY,
				secretKey: process.env.STORAGE_SECRET_KEY,
				bucket: process.env.STORAGE_BUCKET || "gcmc-documents",
			},
		},
		features: {
			enableAdvancedCaching: process.env.FEATURE_ADVANCED_CACHING !== "false",
			enableMetrics: process.env.FEATURE_METRICS !== "false",
			enableEventSourcing: process.env.FEATURE_EVENT_SOURCING === "true",
			enableDistributedTracing:
				process.env.FEATURE_DISTRIBUTED_TRACING === "true",
		},
		environment: (process.env.NODE_ENV as any) || "development",
	};

	try {
		return configSchema.parse(rawConfig);
	} catch (error) {
		console.error("❌ Configuration validation failed:", error);
		process.exit(1);
	}
}

export const config = loadConfig();

// Configuration validation helpers
export function validateConfig(): boolean {
	try {
		configSchema.parse(config);
		return true;
	} catch (error) {
		console.error("Configuration validation failed:", error);
		return false;
	}
}

export function getConfigSummary(): Record<string, any> {
	return {
		environment: config.environment,
		database: {
			connected: !!config.database.url,
			maxConnections: config.database.maxConnections,
		},
		redis: {
			connected: !!config.redis.url,
		},
		server: {
			port: config.server.port,
			host: config.server.host,
		},
		features: config.features,
	};
}
