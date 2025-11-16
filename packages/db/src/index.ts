import { Prisma, PrismaClient } from "../prisma/generated/client";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

// Helper function to get database URL with connection pooling
function getDatabaseUrl(): string {
	const baseUrl = process.env.DATABASE_URL;

	if (!baseUrl) {
		throw new Error("DATABASE_URL is not set");
	}

	// Add connection pooling parameters if not already present and in production
	if (
		process.env.NODE_ENV === "production" &&
		!baseUrl.includes("connection_limit")
	) {
		const url = new URL(baseUrl);
		url.searchParams.set("connection_limit", "20");
		url.searchParams.set("pool_timeout", "20");
		url.searchParams.set("connect_timeout", "10");
		return url.toString();
	}

	return baseUrl;
}

const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
		datasources: {
			db: {
				url: getDatabaseUrl(),
			},
		},
	});

// Prevent hot reload from creating new instances in development
if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

export default prisma;
export { Prisma };
