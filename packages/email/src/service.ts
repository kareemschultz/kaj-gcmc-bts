/**
 * Email Service - Handles sending emails using Resend or SMTP
 */

import { render } from "@react-email/render";
import { Resend } from "resend";
// Import templates
import DocumentExpiryWarningEmail from "../templates/document-expiry-warning";
import FilingReminderEmail from "../templates/filing-reminder";
import InvoiceEmail from "../templates/invoice";
import PasswordResetEmail from "../templates/password-reset";
import ServiceRequestUpdateEmail from "../templates/service-request-update";
import TaskAssignmentEmail from "../templates/task-assignment";
import WelcomeEmail from "../templates/welcome";
import type {
	DocumentExpiryWarningData,
	EmailConfig,
	EmailJob,
	FilingReminderData,
	InvoiceData,
	PasswordResetData,
	SendEmailResult,
	ServiceRequestUpdateData,
	TaskAssignmentData,
	WelcomeEmailData,
} from "./types";

export class EmailService {
	private config: EmailConfig;
	private resend?: Resend;

	constructor(config: EmailConfig) {
		this.config = config;

		// Initialize Resend if using that provider
		if (config.provider === "resend" && config.resendApiKey) {
			this.resend = new Resend(config.resendApiKey);
		}
	}

	/**
	 * Send an email using the configured provider
	 */
	private async sendEmail(job: EmailJob): Promise<SendEmailResult> {
		try {
			// Development mode - just log the email
			if (
				this.config.provider === "log" ||
				process.env.NODE_ENV === "development"
			) {
				console.log("📧 [EMAIL SERVICE] Email would be sent:");
				console.log(`   To: ${job.to}`);
				console.log(`   Subject: ${job.subject}`);
				console.log(
					`   From: ${this.config.fromName} <${this.config.fromEmail}>`,
				);
				if (job.cc?.length) console.log(`   CC: ${job.cc.join(", ")}`);
				if (job.bcc?.length) console.log(`   BCC: ${job.bcc.join(", ")}`);
				console.log("   Metadata:", job.metadata);
				console.log("   --- Email Content Preview (first 500 chars) ---");
				console.log(job.html.substring(0, 500));
				console.log("   --- End Preview ---\n");

				return {
					success: true,
					messageId: `dev-${Date.now()}`,
				};
			}

			// Production mode - send via Resend
			if (this.config.provider === "resend") {
				if (!this.resend) {
					throw new Error("Resend client not initialized");
				}

				const result = await this.resend.emails.send({
					from: `${this.config.fromName} <${this.config.fromEmail}>`,
					to: job.to,
					subject: job.subject,
					html: job.html,
					text: job.text,
					cc: job.cc,
					bcc: job.bcc,
					reply_to: job.replyTo || this.config.replyToEmail,
					// Resend doesn't support attachments in the same way, would need to be base64 encoded
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				return {
					success: true,
					messageId: result.data?.id,
				};
			}

			// SMTP provider would be implemented here
			if (this.config.provider === "smtp") {
				throw new Error("SMTP provider not yet implemented");
			}

			throw new Error(`Unknown email provider: ${this.config.provider}`);
		} catch (error) {
			console.error("❌ [EMAIL SERVICE] Failed to send email:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Send welcome email to new client
	 */
	async sendWelcome(
		to: string,
		data: WelcomeEmailData,
	): Promise<SendEmailResult> {
		const html = await render(WelcomeEmail(data));
		const text = `Welcome to ${data.tenantName}!\n\nHello ${data.clientName},\n\nThank you for choosing ${data.tenantName}. Your account has been created and you can now access your client portal at: ${data.portalUrl}\n\nIf you need help, contact us at: ${data.supportEmail}`;

		return this.sendEmail({
			to,
			subject: `Welcome to ${data.tenantName}`,
			html,
			text,
			metadata: { type: "welcome", clientName: data.clientName },
		});
	}

	/**
	 * Send document expiry warning
	 */
	async sendDocumentExpiryWarning(
		to: string,
		data: DocumentExpiryWarningData,
	): Promise<SendEmailResult> {
		const html = await render(DocumentExpiryWarningEmail(data));
		const urgencyLabel =
			data.daysUntilExpiry <= 3
				? "URGENT"
				: data.daysUntilExpiry <= 7
					? "Important"
					: "Reminder";
		const text = `${urgencyLabel}: ${data.documentTitle} expires in ${data.daysUntilExpiry} days\n\nDocument: ${data.documentTitle}\nClient: ${data.clientName}\nExpiry Date: ${data.expiryDate.toLocaleDateString()}\n\nView document: ${data.portalUrl}`;

		return this.sendEmail({
			to,
			subject: `${urgencyLabel}: Document Expiring Soon - ${data.documentTitle}`,
			html,
			text,
			metadata: {
				type: "document_expiry_warning",
				documentTitle: data.documentTitle,
				clientName: data.clientName,
				daysUntilExpiry: data.daysUntilExpiry,
			},
		});
	}

	/**
	 * Send filing deadline reminder
	 */
	async sendFilingReminder(
		to: string,
		data: FilingReminderData,
	): Promise<SendEmailResult> {
		const html = await render(FilingReminderEmail(data));
		const isOverdue = data.daysUntilDue < 0;
		const urgencyLabel = isOverdue
			? "OVERDUE"
			: data.daysUntilDue <= 3
				? "URGENT"
				: "Reminder";
		const text = `${urgencyLabel}: ${data.filingType} for ${data.clientName}\n\nPeriod: ${data.periodLabel}\nDue Date: ${data.dueDate.toLocaleDateString()}\nStatus: ${data.status}\n${isOverdue ? `Days Overdue: ${Math.abs(data.daysUntilDue)}` : `Days Remaining: ${data.daysUntilDue}`}\n\nView filing: ${data.portalUrl}`;

		return this.sendEmail({
			to,
			subject: `${urgencyLabel}: ${data.filingType} - ${data.clientName}`,
			html,
			text,
			metadata: {
				type: "filing_reminder",
				filingType: data.filingType,
				clientName: data.clientName,
				daysUntilDue: data.daysUntilDue,
			},
		});
	}

	/**
	 * Send task assignment notification
	 */
	async sendTaskAssignment(
		to: string,
		data: TaskAssignmentData,
	): Promise<SendEmailResult> {
		const html = await render(TaskAssignmentEmail(data));
		const text = `New Task Assigned: ${data.taskTitle}\n\n${data.taskDescription}\n${data.clientName ? `\nClient: ${data.clientName}` : ""}\nPriority: ${data.priority}\n${data.dueDate ? `Due Date: ${data.dueDate.toLocaleDateString()}` : ""}\nAssigned By: ${data.assignedBy}\n\nView task: ${data.portalUrl}`;

		return this.sendEmail({
			to,
			subject: `New Task Assigned: ${data.taskTitle}${data.clientName ? ` - ${data.clientName}` : ""}`,
			html,
			text,
			metadata: {
				type: "task_assignment",
				taskTitle: data.taskTitle,
				priority: data.priority,
			},
		});
	}

	/**
	 * Send service request status update
	 */
	async sendServiceRequestUpdate(
		to: string,
		data: ServiceRequestUpdateData,
	): Promise<SendEmailResult> {
		const html = await render(ServiceRequestUpdateEmail(data));
		const text = `Service Request Update: ${data.serviceName}\n\nClient: ${data.clientName}\nStatus: ${data.previousStatus} → ${data.newStatus}\n${data.currentStep ? `Current Step: ${data.currentStep}` : ""}\n${data.notes ? `\nNotes: ${data.notes}` : ""}\n\nView service request: ${data.portalUrl}`;

		return this.sendEmail({
			to,
			subject: `Service Request Update: ${data.serviceName} - ${data.clientName}`,
			html,
			text,
			metadata: {
				type: "service_request_update",
				serviceName: data.serviceName,
				newStatus: data.newStatus,
			},
		});
	}

	/**
	 * Send password reset email
	 */
	async sendPasswordReset(
		to: string,
		data: PasswordResetData,
	): Promise<SendEmailResult> {
		const html = await render(PasswordResetEmail(data));
		const text = `Password Reset Request\n\nHello ${data.userName},\n\nWe received a request to reset your password. Click the link below to reset it:\n\n${data.resetLink}\n\nThis link expires in ${data.expiryMinutes || 60} minutes.\n\nIf you didn't request this, please ignore this email.`;

		return this.sendEmail({
			to,
			subject: `Password Reset Request - ${data.tenantName}`,
			html,
			text,
			metadata: { type: "password_reset", userName: data.userName },
		});
	}

	/**
	 * Send invoice/billing notification
	 */
	async sendInvoice(to: string, data: InvoiceData): Promise<SendEmailResult> {
		const html = await render(InvoiceEmail(data));
		const text = `Invoice ${data.invoiceNumber}\n\nBill To: ${data.clientName}\nInvoice Date: ${data.invoiceDate.toLocaleDateString()}\nDue Date: ${data.dueDate.toLocaleDateString()}\n\nTotal Due: $${data.total.toFixed(2)}\n\n${data.paymentInstructions || ""}\n\nView invoice: ${data.portalUrl}`;

		return this.sendEmail({
			to,
			subject: `Invoice ${data.invoiceNumber} from ${data.tenantName}`,
			html,
			text,
			metadata: {
				type: "invoice",
				invoiceNumber: data.invoiceNumber,
				total: data.total,
			},
		});
	}

	/**
	 * Send a custom email with HTML content
	 */
	async sendCustom(job: EmailJob): Promise<SendEmailResult> {
		return this.sendEmail(job);
	}
}

/**
 * Create an EmailService instance from environment variables
 */
export function createEmailService(): EmailService {
	const config: EmailConfig = {
		provider:
			(process.env.EMAIL_PROVIDER as "resend" | "smtp" | "log") || "log",
		resendApiKey: process.env.RESEND_API_KEY,
		smtpHost: process.env.SMTP_HOST,
		smtpPort: process.env.SMTP_PORT
			? Number.parseInt(process.env.SMTP_PORT, 10)
			: 587,
		smtpUser: process.env.SMTP_USER,
		smtpPassword: process.env.SMTP_PASSWORD,
		fromEmail: process.env.EMAIL_FROM || "noreply@gcmc.com",
		fromName: process.env.EMAIL_FROM_NAME || "GCMC Services",
		replyToEmail: process.env.EMAIL_REPLY_TO,
	};

	return new EmailService(config);
}

// Export singleton instance
export const emailService = createEmailService();
