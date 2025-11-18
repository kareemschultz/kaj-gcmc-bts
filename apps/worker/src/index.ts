import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const moduleDir = dirname(fileURLToPath(import.meta.url));

// Load environment variables from the worker directory first, then fall back to repo root
loadEnv();
if (!process.env.DATABASE_URL) {
	loadEnv({ path: resolve(moduleDir, "../../../.env") });
}

/**
 * Worker Application - BullMQ Background Jobs
 *
 * Handles automated tasks:
 * - Compliance scoring refresh
 * - Document expiry notifications
 * - Filing deadline reminders
 * - Email dispatching
 */

import prisma from "@GCMC-KAJ/db";
import { Queue, Worker } from "bullmq";
import { Hono } from "hono";
import Redis from "ioredis";
import {
	type ComplianceJobData,
	processComplianceJob,
} from "./jobs/complianceJob";
import type { EmailJobData } from "./jobs/emailJob";
import { processEmailJob } from "./jobs/emailJob";
import { processScheduledEmailJob } from "./jobs/scheduledEmailJob";
import {
	processStorageMaintenanceJob,
	type StorageMaintenanceJobData,
} from "./jobs/storageMaintenanceJob";

// Redis connection
const connection = new Redis(
	process.env.REDIS_URL || "redis://localhost:6379",
	{
		maxRetriesPerRequest: null,
	},
);

console.log("🚀 Worker starting...");
console.log(`📡 Redis: ${process.env.REDIS_URL || "redis://localhost:6379"}`);

// Health check server
const healthApp = new Hono();
let isHealthy = false;

healthApp.get("/health", (c) => {
	if (!isHealthy) {
		return c.json({ status: "starting" }, 503);
	}
	return c.json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		workers: {
			compliance: "active",
			guyanaCompliance: "active",
			storageMaintenance: "active",
			notifications: "active",
			filings: "active",
			email: "active",
			scheduledEmail: "active",
		},
	});
});

// ============================================================================
// QUEUE DEFINITIONS
// ============================================================================

export const complianceQueue = new Queue<ComplianceJobData>(
	"compliance-refresh",
	{ connection },
);
export const guyanaComplianceQueue = new Queue<ComplianceJobData>(
	"guyana-compliance",
	{ connection },
);
export const storageMaintenanceQueue = new Queue<StorageMaintenanceJobData>(
	"storage-maintenance",
	{ connection },
);
export const notificationQueue = new Queue("notifications", { connection });
export const filingQueue = new Queue("filing-reminders", { connection });
export const emailQueue = new Queue<EmailJobData>("email", { connection });
export const scheduledEmailQueue = new Queue("scheduled-email", { connection });

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
					const totalIssues =
						missingCount + expiringCount + overdueFilingsCount;
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
 * Guyana Compliance Engine Worker
 * Processes Guyana-specific compliance jobs using the compliance engine
 */
const guyanaComplianceWorker = new Worker<ComplianceJobData>(
	"guyana-compliance",
	async (job) => {
		return processComplianceJob(job);
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

			console.log(
				`[Notifications] Sent ${expiringDocuments.length} expiry notifications`,
			);

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

			console.log(
				`[Filings] Sent ${overdueFilings.length} overdue filing notifications`,
			);

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

guyanaComplianceWorker.on("completed", (job) => {
	console.log(`✅ [Guyana Compliance] Job ${job.id} completed`);
});

guyanaComplianceWorker.on("failed", (job, err) => {
	console.error(`❌ [Guyana Compliance] Job ${job?.id} failed:`, err);
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

/**
 * Email Worker
 * Processes email queue and sends emails
 */
const emailWorker = new Worker(
	"email",
	async (job) => {
		return processEmailJob(job);
	},
	{ connection },
);

/**
 * Scheduled Email Worker
 * Daily checks for expiring documents and upcoming filings
 */
const scheduledEmailWorker = new Worker(
	"scheduled-email",
	async (job) => {
		return processScheduledEmailJob(job, emailQueue);
	},
	{ connection },
);

/**
 * Storage Maintenance Worker
 * Handles automated storage maintenance tasks
 */
const storageMaintenanceWorker = new Worker<StorageMaintenanceJobData>(
	"storage-maintenance",
	async (job) => {
		return processStorageMaintenanceJob(job);
	},
	{ connection },
);

emailWorker.on("completed", (job) => {
	console.log(`✅ [Email] Job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
	console.error(`❌ [Email] Job ${job?.id} failed:`, err);
});

scheduledEmailWorker.on("completed", (job) => {
	console.log(`✅ [Scheduled Email] Job ${job.id} completed`);
});

scheduledEmailWorker.on("failed", (job, err) => {
	console.error(`❌ [Scheduled Email] Job ${job?.id} failed:`, err);
});

storageMaintenanceWorker.on("completed", (job) => {
	console.log(`✅ [Storage Maintenance] Job ${job.id} completed`);
});

storageMaintenanceWorker.on("failed", (job, err) => {
	console.error(`❌ [Storage Maintenance] Job ${job?.id} failed:`, err);
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
 * Schedule Guyana compliance jobs
 */
async function scheduleGuyanaCompliance() {
	// Schedule score refresh every 6 hours
	await guyanaComplianceQueue.add(
		"guyana-score-refresh",
		{ type: "score_refresh" },
		{
			repeat: {
				pattern: "0 */6 * * *", // Every 6 hours
			},
		},
	);

	// Schedule deadline checks daily at 7 AM
	await guyanaComplianceQueue.add(
		"guyana-deadline-check",
		{ type: "deadline_check", notificationThreshold: 14 }, // 14 days notice
		{
			repeat: {
				pattern: "0 7 * * *", // 7 AM daily
			},
		},
	);

	// Schedule penalty calculations daily at 1 AM
	await guyanaComplianceQueue.add(
		"guyana-penalty-calculation",
		{ type: "penalty_calculation" },
		{
			repeat: {
				pattern: "0 1 * * *", // 1 AM daily
			},
		},
	);

	// Schedule weekly compliance reports on Mondays at 6 AM
	await guyanaComplianceQueue.add(
		"guyana-weekly-reports",
		{ type: "compliance_report" },
		{
			repeat: {
				pattern: "0 6 * * 1", // Mondays at 6 AM
			},
		},
	);

	console.log(
		"📅 Scheduled: Guyana compliance jobs - score refresh (6h), deadlines (7 AM), penalties (1 AM), reports (Mon 6 AM)",
	);
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

/**
 * Schedule email document expiry checks daily at 7 AM
 */
async function scheduleDocumentExpiryEmails() {
	await scheduledEmailQueue.add(
		"daily-document-expiry",
		{ type: "daily_document_expiry" },
		{
			repeat: {
				pattern: "0 7 * * *", // 7 AM daily
			},
		},
	);
	console.log("📅 Scheduled: Daily document expiry emails at 7 AM");
}

/**
 * Schedule email filing reminders daily at 8 AM
 */
async function scheduleFilingReminderEmails() {
	await scheduledEmailQueue.add(
		"daily-filing-reminders",
		{ type: "daily_filing_reminders" },
		{
			repeat: {
				pattern: "0 8 * * *", // 8 AM daily
			},
		},
	);
	console.log("📅 Scheduled: Daily filing reminder emails at 8 AM");
}

/**
 * Schedule storage maintenance jobs
 */
async function scheduleStorageMaintenance() {
	// Daily cleanup of expired reports at 3 AM
	await storageMaintenanceQueue.add(
		"daily-cleanup-expired-reports",
		{
			type: "CLEANUP_EXPIRED_REPORTS",
			retentionDays: 365,
			dryRun: false,
		},
		{
			repeat: {
				pattern: "0 3 * * *", // 3 AM daily
			},
		},
	);

	// Weekly file integrity check on Sundays at 2 AM
	await storageMaintenanceQueue.add(
		"weekly-file-integrity-check",
		{ type: "VALIDATE_FILE_INTEGRITY" },
		{
			repeat: {
				pattern: "0 2 * * 0", // Sundays at 2 AM
			},
		},
	);

	// Monthly storage usage report on 1st at 4 AM
	await storageMaintenanceQueue.add(
		"monthly-storage-report",
		{ type: "STORAGE_USAGE_REPORT" },
		{
			repeat: {
				pattern: "0 4 1 * *", // 1st of month at 4 AM
			},
		},
	);

	// Weekly orphaned file cleanup on Saturdays at 3 AM
	await storageMaintenanceQueue.add(
		"weekly-orphaned-cleanup",
		{
			type: "CLEANUP_ORPHANED_FILES",
			dryRun: false,
		},
		{
			repeat: {
				pattern: "0 3 * * 6", // Saturdays at 3 AM
			},
		},
	);

	console.log(
		"📅 Scheduled: Storage maintenance - daily cleanup (3 AM), weekly integrity checks (Sun 2 AM), monthly reports (1st 4 AM), orphaned cleanup (Sat 3 AM)",
	);
}

// ============================================================================
// STARTUP
// ============================================================================

async function start() {
	try {
		// Start health check server
		const healthPort = process.env.HEALTH_PORT
			? Number.parseInt(process.env.HEALTH_PORT, 10)
			: 3002;
		Bun.serve({
			port: healthPort,
			fetch: healthApp.fetch,
		});
		console.log(`🏥 Health check server running on port ${healthPort}`);

		// Test database connection
		await prisma.$connect();
		console.log("✅ Database connected");

		// Schedule recurring jobs
		await scheduleComplianceRefresh();
		await scheduleGuyanaCompliance();
		await scheduleExpiryNotifications();
		await scheduleFilingReminders();
		await scheduleDocumentExpiryEmails();
		await scheduleFilingReminderEmails();
		await scheduleStorageMaintenance();

		isHealthy = true;
		console.log("✅ Worker ready and listening for jobs");
	} catch (error) {
		console.error("❌ Worker startup failed:", error);
		process.exit(1);
	}
}

// Global error handlers for production stability
process.on(
	"unhandledRejection",
	(reason: unknown, promise: Promise<unknown>) => {
		console.error("🚨 [Worker] Unhandled Promise Rejection:", {
			timestamp: new Date().toISOString(),
			reason: reason instanceof Error ? reason.message : String(reason),
			stack: reason instanceof Error ? reason.stack : undefined,
			promise: String(promise),
		});
		// Mark as unhealthy but don't exit - let the health check detect issues
		isHealthy = false;
	},
);

process.on("uncaughtException", (error: Error) => {
	console.error("🚨 [Worker] Uncaught Exception:", {
		timestamp: new Date().toISOString(),
		message: error.message,
		stack: error.stack,
	});
	// Uncaught exceptions are serious - gracefully shutdown
	console.error("💥 Worker is shutting down due to uncaught exception");

	// Attempt graceful shutdown
	Promise.all([
		complianceWorker.close(),
		guyanaComplianceWorker.close(),
		storageMaintenanceWorker.close(),
		notificationWorker.close(),
		filingWorker.close(),
		emailWorker.close(),
		scheduledEmailWorker.close(),
		prisma.$disconnect(),
	])
		.then(() => {
			console.log("✅ Graceful shutdown completed");
			process.exit(1);
		})
		.catch((shutdownError) => {
			console.error("❌ Error during shutdown:", shutdownError);
			process.exit(1);
		});
});

// Graceful shutdown
process.on("SIGTERM", async () => {
	console.log("⚠️  SIGTERM received, shutting down gracefully");
	await complianceWorker.close();
	await guyanaComplianceWorker.close();
	await storageMaintenanceWorker.close();
	await notificationWorker.close();
	await filingWorker.close();
	await emailWorker.close();
	await scheduledEmailWorker.close();
	await prisma.$disconnect();
	process.exit(0);
});

// Start the worker
start();
