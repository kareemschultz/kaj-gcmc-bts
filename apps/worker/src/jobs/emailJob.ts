/**
 * Email Job - Process email queue and send emails
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
import { emailService } from "@GCMC-KAJ/email";
import type { Job } from "bullmq";

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

/**
 * Process email job from queue
 */
export async function processEmailJob(job: Job<EmailJobData>) {
	const { type, to, data } = job.data;

	console.log(`[Email Job] Processing ${type} email to ${to}`);

	try {
		let result;

		switch (type) {
			case "welcome":
				result = await emailService.sendWelcome(to, data as WelcomeEmailData);
				break;

			case "document_expiry_warning":
				result = await emailService.sendDocumentExpiryWarning(
					to,
					data as DocumentExpiryWarningData,
				);
				break;

			case "filing_reminder":
				result = await emailService.sendFilingReminder(
					to,
					data as FilingReminderData,
				);
				break;

			case "task_assignment":
				result = await emailService.sendTaskAssignment(
					to,
					data as TaskAssignmentData,
				);
				break;

			case "service_request_update":
				result = await emailService.sendServiceRequestUpdate(
					to,
					data as ServiceRequestUpdateData,
				);
				break;

			case "password_reset":
				result = await emailService.sendPasswordReset(
					to,
					data as PasswordResetData,
				);
				break;

			case "invoice":
				result = await emailService.sendInvoice(to, data as InvoiceData);
				break;

			case "custom":
				result = await emailService.sendCustom(data as any);
				break;

			default:
				throw new Error(`Unknown email type: ${type}`);
		}

		if (!result.success) {
			throw new Error(result.error || "Email send failed");
		}

		console.log(
			`[Email Job] ✅ Successfully sent ${type} email to ${to} (messageId: ${result.messageId})`,
		);

		return {
			success: true,
			messageId: result.messageId,
			type,
			to,
		};
	} catch (error) {
		console.error(`[Email Job] ❌ Failed to send ${type} email:`, error);
		throw error;
	}
}
