/**
 * Worker Application - BullMQ Background Jobs
 *
 * Handles automated tasks:
 * - Compliance scoring refresh
 * - Document expiry notifications
 * - Filing deadline reminders
 * - Email dispatching
 */

import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";
import prisma from "@GCMC-KAJ/db";

// Redis connection
const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
	maxRetriesPerRequest: null,
});

console.log("🚀 Worker starting...");
console.log(`📡 Redis: ${process.env.REDIS_URL || "redis://localhost:6379"}`);

// ============================================================================
// QUEUE DEFINITIONS
// ============================================================================

export const complianceQueue = new Queue("compliance-refresh", { connection });
export const notificationQueue = new Queue("notifications", { connection });
export const filingQueue = new Queue("filing-reminders", { connection });

// ============================================================================
// WORKERS
// ============================================================================

/**
 * Compliance Refresh Worker
 * Recalculates compliance scores for all clients
 */
const complianceWorker = new Worker(
	"compliance-refresh",
	async (job) => {
		console.log(`[Compliance] Processing job ${job.id}`);

		try {
			// Get all tenants
			const tenants = await prisma.tenant.findMany({
				select: { id: true, name: true },
			});

			for (const tenant of tenants) {
				// Get all clients for this tenant
				const clients = await prisma.client.findMany({
					where: { tenantId: tenant.id },
					select: { id: true, name: true },
				});

				for (const client of clients) {
					// Calculate compliance score
					const [missingCount, expiringCount, overdueFilingsCount] =
						await Promise.all([
							prisma.document.count({
								where: {
									clientId: client.id,
									status: { in: ["pending_review", "rejected"] },
								},
							}),
							prisma.document.count({
								where: {
									clientId: client.id,
									latestVersion: {
										expiryDate: {
											lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
											gte: new Date(),
										},
									},
								},
							}),
							prisma.filing.count({
								where: {
									clientId: client.id,
									status: { in: ["draft", "prepared"] },
									periodEnd: { lt: new Date() },
								},
							}),
						]);

					// Simple scoring logic
					const totalIssues = missingCount + expiringCount + overdueFilingsCount;
					const scoreValue = Math.max(0, 100 - totalIssues * 5);
					const level =
						scoreValue >= 80 ? "low" : scoreValue >= 50 ? "medium" : "high";

					// Upsert score
					await prisma.complianceScore.upsert({
						where: {
							tenantId_clientId: {
								tenantId: tenant.id,
								clientId: client.id,
							},
						},
						update: {
							scoreValue,
							level,
							missingCount,
							expiringCount,
							overdueFilingsCount,
							lastCalculatedAt: new Date(),
							breakdown: {
								missing: missingCount,
								expiring: expiringCount,
								overdue: overdueFilingsCount,
							},
						},
						create: {
							tenantId: tenant.id,
							clientId: client.id,
							scoreValue,
							level,
							missingCount,
							expiringCount,
							overdueFilingsCount,
							lastCalculatedAt: new Date(),
							breakdown: {
								missing: missingCount,
								expiring: expiringCount,
								overdue: overdueFilingsCount,
							},
						},
					});
				}

				console.log(
					`[Compliance] Updated ${clients.length} clients for tenant ${tenant.name}`,
				);
			}

			return { success: true, tenantsProcessed: tenants.length };
		} catch (error) {
			console.error("[Compliance] Error:", error);
			throw error;
		}
	},
	{ connection },
);

/**
 * Notification Worker
 * Sends expiry and deadline notifications
 */
const notificationWorker = new Worker(
	"notifications",
	async (job) => {
		console.log(`[Notifications] Processing job ${job.id}`);

		try {
			// Find expiring documents (next 7 days)
			const expiringDocuments = await prisma.document.findMany({
				where: {
					latestVersion: {
						expiryDate: {
							lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
							gte: new Date(),
						},
					},
				},
				include: {
					client: true,
					documentType: true,
					latestVersion: true,
					tenant: true,
				},
			});

			for (const doc of expiringDocuments) {
				// Get tenant users
				const tenantUsers = await prisma.tenantUser.findMany({
					where: { tenantId: doc.tenantId },
					include: { user: true },
				});

				for (const tu of tenantUsers) {
					// Create notification
					await prisma.notification.create({
						data: {
							tenantId: doc.tenantId,
							recipientUserId: tu.userId,
							type: "in_app",
							channelStatus: "sent",
							message: `Document "${doc.title}" for client ${doc.client.name} expires on ${doc.latestVersion?.expiryDate?.toLocaleDateString()}`,
							metadata: {
								documentId: doc.id,
								clientId: doc.clientId,
								expiryDate: doc.latestVersion?.expiryDate,
							},
						},
					});
				}
			}

			console.log(`[Notifications] Sent ${expiringDocuments.length} expiry notifications`);

			return { success: true, notificationsSent: expiringDocuments.length };
		} catch (error) {
			console.error("[Notifications] Error:", error);
			throw error;
		}
	},
	{ connection },
);

/**
 * Filing Reminders Worker
 * Sends reminders for upcoming filing deadlines
 */
const filingWorker = new Worker(
	"filing-reminders",
	async (job) => {
		console.log(`[Filings] Processing job ${job.id}`);

		try {
			// Find overdue filings
			const overdueFilings = await prisma.filing.findMany({
				where: {
					status: { in: ["draft", "prepared"] },
					periodEnd: { lt: new Date() },
				},
				include: {
					client: true,
					filingType: true,
					tenant: true,
				},
			});

			for (const filing of overdueFilings) {
				// Get tenant users
				const tenantUsers = await prisma.tenantUser.findMany({
					where: { tenantId: filing.tenantId },
					include: { user: true },
				});

				for (const tu of tenantUsers) {
					await prisma.notification.create({
						data: {
							tenantId: filing.tenantId,
							recipientUserId: tu.userId,
							type: "in_app",
							channelStatus: "sent",
							message: `Filing "${filing.filingType.name}" for client ${filing.client.name} is overdue (period ended ${filing.periodEnd?.toLocaleDateString()})`,
							metadata: {
								filingId: filing.id,
								clientId: filing.clientId,
								periodEnd: filing.periodEnd,
							},
						},
					});
				}
			}

			console.log(`[Filings] Sent ${overdueFilings.length} overdue filing notifications`);

			return { success: true, notificationsSent: overdueFilings.length };
		} catch (error) {
			console.error("[Filings] Error:", error);
			throw error;
		}
	},
	{ connection },
);

// ============================================================================
// EVENT HANDLERS
// ============================================================================

complianceWorker.on("completed", (job) => {
	console.log(`✅ [Compliance] Job ${job.id} completed`);
});

complianceWorker.on("failed", (job, err) => {
	console.error(`❌ [Compliance] Job ${job?.id} failed:`, err);
});

notificationWorker.on("completed", (job) => {
	console.log(`✅ [Notifications] Job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
	console.error(`❌ [Notifications] Job ${job?.id} failed:`, err);
});

filingWorker.on("completed", (job) => {
	console.log(`✅ [Filings] Job ${job.id} completed`);
});

filingWorker.on("failed", (job, err) => {
	console.error(`❌ [Filings] Job ${job?.id} failed:`, err);
});

// ============================================================================
// SCHEDULED JOBS
// ============================================================================

/**
 * Schedule compliance refresh daily at 2 AM
 */
async function scheduleComplianceRefresh() {
	await complianceQueue.add(
		"daily-compliance-refresh",
		{},
		{
			repeat: {
				pattern: "0 2 * * *", // 2 AM daily
			},
		},
	);
	console.log("📅 Scheduled: Daily compliance refresh at 2 AM");
}

/**
 * Schedule expiry notifications daily at 8 AM
 */
async function scheduleExpiryNotifications() {
	await notificationQueue.add(
		"daily-expiry-check",
		{},
		{
			repeat: {
				pattern: "0 8 * * *", // 8 AM daily
			},
		},
	);
	console.log("📅 Scheduled: Daily expiry notifications at 8 AM");
}

/**
 * Schedule filing reminders daily at 9 AM
 */
async function scheduleFilingReminders() {
	await filingQueue.add(
		"daily-filing-check",
		{},
		{
			repeat: {
				pattern: "0 9 * * *", // 9 AM daily
			},
		},
	);
	console.log("📅 Scheduled: Daily filing reminders at 9 AM");
}

// ============================================================================
// STARTUP
// ============================================================================

async function start() {
	try {
		// Test database connection
		await prisma.$connect();
		console.log("✅ Database connected");

		// Schedule recurring jobs
		await scheduleComplianceRefresh();
		await scheduleExpiryNotifications();
		await scheduleFilingReminders();

		console.log("✅ Worker ready and listening for jobs");
	} catch (error) {
		console.error("❌ Worker startup failed:", error);
		process.exit(1);
	}
}

// Graceful shutdown
process.on("SIGTERM", async () => {
	console.log("⚠️  SIGTERM received, shutting down gracefully");
	await complianceWorker.close();
	await notificationWorker.close();
	await filingWorker.close();
	await prisma.$disconnect();
	process.exit(0);
});

// Start the worker
start();
