/**
 * Scheduled Email Job - Daily checks for expiring documents and upcoming filings
 * Queues email jobs for notifications
 */

import prisma from "@GCMC-KAJ/db";
import type { Job, Queue } from "bullmq";
import type { EmailJobData } from "./emailJob";

interface ScheduledEmailJobData {
	type: "daily_document_expiry" | "daily_filing_reminders";
}

/**
 * Process scheduled email checks
 */
export async function processScheduledEmailJob(
	job: Job<ScheduledEmailJobData>,
	emailQueue: Queue<EmailJobData>,
) {
	const { type } = job.data;

	console.log(`[Scheduled Email] Processing ${type}`);

	try {
		if (type === "daily_document_expiry") {
			return await processDailyDocumentExpiry(emailQueue);
		}

		if (type === "daily_filing_reminders") {
			return await processDailyFilingReminders(emailQueue);
		}

		throw new Error(`Unknown scheduled email type: ${type}`);
	} catch (error) {
		console.error("[Scheduled Email] ❌ Failed:", error);
		throw error;
	}
}

/**
 * Check for expiring documents and queue email notifications
 * Sends warnings at 30 days, 14 days, 7 days, 3 days, and 1 day before expiry
 */
async function processDailyDocumentExpiry(emailQueue: Queue<EmailJobData>) {
	const now = new Date();
	const warningPeriods = [30, 14, 7, 3, 1]; // days before expiry

	let totalQueued = 0;

	for (const days of warningPeriods) {
		const targetDate = new Date(now);
		targetDate.setDate(targetDate.getDate() + days);

		// Find documents expiring on this target date
		const expiringDocuments = await prisma.document.findMany({
			where: {
				status: "valid",
				latestVersion: {
					expiryDate: {
						gte: new Date(targetDate.setHours(0, 0, 0, 0)),
						lte: new Date(targetDate.setHours(23, 59, 59, 999)),
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

		console.log(
			`[Document Expiry] Found ${expiringDocuments.length} documents expiring in ${days} days`,
		);

		for (const doc of expiringDocuments) {
			if (!doc.latestVersion?.expiryDate) continue;

			// Get tenant users to notify
			const tenantUsers = await prisma.tenantUser.findMany({
				where: { tenantId: doc.tenantId },
				include: { user: true },
			});

			for (const tu of tenantUsers) {
				if (!tu.user.email) continue;

				// Queue email job
				await emailQueue.add(`document-expiry-${doc.id}-${tu.userId}`, {
					type: "document_expiry_warning",
					to: tu.user.email,
					data: {
						recipientName: tu.user.name,
						documentTitle: doc.title,
						documentType: doc.documentType.name,
						clientName: doc.client.name,
						expiryDate: doc.latestVersion.expiryDate,
						daysUntilExpiry: days,
						portalUrl: process.env.PORTAL_URL || "https://portal.gcmc.com",
						tenantName: doc.tenant.name,
					},
				});

				totalQueued++;
			}
		}
	}

	console.log(
		`[Document Expiry] ✅ Queued ${totalQueued} expiry warning emails`,
	);

	return {
		success: true,
		emailsQueued: totalQueued,
		warningPeriods,
	};
}

/**
 * Check for upcoming filing deadlines and queue reminders
 * Sends reminders at 14 days, 7 days, 3 days, and for overdue filings
 */
async function processDailyFilingReminders(emailQueue: Queue<EmailJobData>) {
	const now = new Date();
	const warningPeriods = [14, 7, 3, 0]; // days before due (0 = due today)
	const overdueCheck = -7; // Check up to 7 days overdue

	let totalQueued = 0;

	// Check upcoming deadlines
	for (const days of warningPeriods) {
		const targetDate = new Date(now);
		targetDate.setDate(targetDate.getDate() + days);

		const filings = await prisma.filing.findMany({
			where: {
				status: { in: ["draft", "prepared"] },
				periodEnd: {
					gte: new Date(targetDate.setHours(0, 0, 0, 0)),
					lte: new Date(targetDate.setHours(23, 59, 59, 999)),
				},
			},
			include: {
				client: true,
				filingType: true,
				tenant: true,
			},
		});

		console.log(
			`[Filing Reminders] Found ${filings.length} filings due in ${days} days`,
		);

		for (const filing of filings) {
			if (!filing.periodEnd) continue;

			const tenantUsers = await prisma.tenantUser.findMany({
				where: { tenantId: filing.tenantId },
				include: { user: true },
			});

			for (const tu of tenantUsers) {
				if (!tu.user.email) continue;

				await emailQueue.add(`filing-reminder-${filing.id}-${tu.userId}`, {
					type: "filing_reminder",
					to: tu.user.email,
					data: {
						recipientName: tu.user.name,
						filingType: filing.filingType.name,
						clientName: filing.client.name,
						periodLabel:
							filing.periodLabel ||
							`${filing.periodStart?.toLocaleDateString()} - ${filing.periodEnd?.toLocaleDateString()}`,
						dueDate: filing.periodEnd,
						daysUntilDue: days,
						authority: filing.filingType.authority,
						status: filing.status,
						portalUrl: process.env.PORTAL_URL || "https://portal.gcmc.com",
						tenantName: filing.tenant.name,
					},
				});

				totalQueued++;
			}
		}
	}

	// Check overdue filings (up to 7 days overdue)
	const overdueDate = new Date(now);
	overdueDate.setDate(overdueDate.getDate() + overdueCheck);

	const overdueFilings = await prisma.filing.findMany({
		where: {
			status: { in: ["draft", "prepared"] },
			periodEnd: {
				gte: overdueDate,
				lt: now,
			},
		},
		include: {
			client: true,
			filingType: true,
			tenant: true,
		},
	});

	console.log(
		`[Filing Reminders] Found ${overdueFilings.length} overdue filings`,
	);

	for (const filing of overdueFilings) {
		if (!filing.periodEnd) continue;

		const daysOverdue = Math.ceil(
			(now.getTime() - filing.periodEnd.getTime()) / (1000 * 60 * 60 * 24),
		);

		const tenantUsers = await prisma.tenantUser.findMany({
			where: { tenantId: filing.tenantId },
			include: { user: true },
		});

		for (const tu of tenantUsers) {
			if (!tu.user.email) continue;

			await emailQueue.add(`filing-overdue-${filing.id}-${tu.userId}`, {
				type: "filing_reminder",
				to: tu.user.email,
				data: {
					recipientName: tu.user.name,
					filingType: filing.filingType.name,
					clientName: filing.client.name,
					periodLabel:
						filing.periodLabel ||
						`${filing.periodStart?.toLocaleDateString()} - ${filing.periodEnd?.toLocaleDateString()}`,
					dueDate: filing.periodEnd,
					daysUntilDue: -daysOverdue,
					authority: filing.filingType.authority,
					status: filing.status,
					portalUrl: process.env.PORTAL_URL || "https://portal.gcmc.com",
					tenantName: filing.tenant.name,
				},
			});

			totalQueued++;
		}
	}

	console.log(
		`[Filing Reminders] ✅ Queued ${totalQueued} filing reminder emails`,
	);

	return {
		success: true,
		emailsQueued: totalQueued,
		warningPeriods,
	};
}
