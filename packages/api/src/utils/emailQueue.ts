/**
 * Email Queue Helper - Queue emails from API routers
 */

import type {
	DocumentExpiryWarningData,
	FilingReminderData,
	InvoiceData,
	PasswordResetData,
	ServiceRequestUpdateData,
	TaskAssignmentData,
	WelcomeEmailData,
} from "@GCMC-KAJ/email";
import type { Queue } from "bullmq";
import { Queue as BullQueue } from "bullmq";
import Redis from "ioredis";

export interface EmailJobData {
	type:
		| "welcome"
		| "document_expiry_warning"
		| "filing_reminder"
		| "task_assignment"
		| "service_request_update"
		| "password_reset"
		| "invoice"
		| "custom";
	to: string;
	data: unknown;
}

// Singleton email queue
let emailQueue: Queue<EmailJobData> | null = null;

/**
 * Get or create email queue
 */
export function getEmailQueue(): Queue<EmailJobData> {
	if (!emailQueue) {
		const connection = new Redis(
			process.env.REDIS_URL || "redis://localhost:6379",
			{
				maxRetriesPerRequest: null,
			},
		);

		emailQueue = new BullQueue<EmailJobData>("email", { connection });
	}

	return emailQueue;
}

/**
 * Queue welcome email
 */
export async function queueWelcomeEmail(
	to: string,
	data: WelcomeEmailData,
): Promise<void> {
	const queue = getEmailQueue();
	await queue.add(`welcome-${to}-${Date.now()}`, {
		type: "welcome",
		to,
		data,
	});
}

/**
 * Queue document expiry warning email
 */
export async function queueDocumentExpiryWarning(
	to: string,
	data: DocumentExpiryWarningData,
): Promise<void> {
	const queue = getEmailQueue();
	await queue.add(`document-expiry-${to}-${Date.now()}`, {
		type: "document_expiry_warning",
		to,
		data,
	});
}

/**
 * Queue filing reminder email
 */
export async function queueFilingReminder(
	to: string,
	data: FilingReminderData,
): Promise<void> {
	const queue = getEmailQueue();
	await queue.add(`filing-reminder-${to}-${Date.now()}`, {
		type: "filing_reminder",
		to,
		data,
	});
}

/**
 * Queue task assignment email
 */
export async function queueTaskAssignmentEmail(
	to: string,
	data: TaskAssignmentData,
): Promise<void> {
	const queue = getEmailQueue();
	await queue.add(`task-assignment-${to}-${Date.now()}`, {
		type: "task_assignment",
		to,
		data,
	});
}

/**
 * Queue service request update email
 */
export async function queueServiceRequestUpdateEmail(
	to: string,
	data: ServiceRequestUpdateData,
): Promise<void> {
	const queue = getEmailQueue();
	await queue.add(`service-request-update-${to}-${Date.now()}`, {
		type: "service_request_update",
		to,
		data,
	});
}

/**
 * Queue password reset email
 */
export async function queuePasswordResetEmail(
	to: string,
	data: PasswordResetData,
): Promise<void> {
	const queue = getEmailQueue();
	await queue.add(`password-reset-${to}-${Date.now()}`, {
		type: "password_reset",
		to,
		data,
	});
}

/**
 * Queue invoice email
 */
export async function queueInvoiceEmail(
	to: string,
	data: InvoiceData,
): Promise<void> {
	const queue = getEmailQueue();
	await queue.add(`invoice-${to}-${Date.now()}`, {
		type: "invoice",
		to,
		data,
	});
}
