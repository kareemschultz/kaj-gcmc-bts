import prisma from "@GCMC-KAJ/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint for the web application
 *
 * This endpoint is used by:
 * - Load balancers and orchestrators (K8s, Docker Compose)
 * - E2E test infrastructure (Playwright global setup)
 * - Monitoring and alerting systems
 *
 * Returns 200 if healthy, 503 if unhealthy
 */
export async function GET() {
	try {
		// Check database connection
		await prisma.$queryRaw`SELECT 1`;

		return NextResponse.json({
			status: "healthy",
			timestamp: new Date().toISOString(),
			service: "web",
			checks: {
				database: "connected",
			},
		});
	} catch (error) {
		// Return 503 Service Unavailable if health check fails
		return NextResponse.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				service: "web",
				checks: {
					database: "disconnected",
				},
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 503 },
		);
	}
}
