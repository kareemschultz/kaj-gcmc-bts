/**
 * Email Service Types
 */

export interface EmailConfig {
	provider: "resend" | "smtp" | "log";
	resendApiKey?: string;
	smtpHost?: string;
	smtpPort?: number;
	smtpUser?: string;
	smtpPassword?: string;
	fromEmail: string;
	fromName: string;
	replyToEmail?: string;
}

export interface EmailJob {
	to: string;
	subject: string;
	html: string;
	text?: string;
	cc?: string[];
	bcc?: string[];
	replyTo?: string;
	attachments?: EmailAttachment[];
	metadata?: Record<string, unknown>;
}

export interface EmailAttachment {
	filename: string;
	content: string | Buffer;
	contentType?: string;
}

export interface SendEmailResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

// Template-specific data types
export interface WelcomeEmailData {
	clientName: string;
	tenantName: string;
	portalUrl: string;
	supportEmail: string;
}

export interface DocumentExpiryWarningData {
	recipientName: string;
	documentTitle: string;
	documentType: string;
	clientName: string;
	expiryDate: Date;
	daysUntilExpiry: number;
	portalUrl: string;
	tenantName: string;
}

export interface FilingReminderData {
	recipientName: string;
	filingType: string;
	clientName: string;
	periodLabel: string;
	dueDate: Date;
	daysUntilDue: number;
	authority: string;
	status: string;
	portalUrl: string;
	tenantName: string;
}

export interface TaskAssignmentData {
	assigneeName: string;
	taskTitle: string;
	taskDescription: string;
	clientName?: string;
	priority: string;
	dueDate?: Date;
	assignedBy: string;
	portalUrl: string;
	tenantName: string;
}

export interface ServiceRequestUpdateData {
	recipientName: string;
	serviceName: string;
	clientName: string;
	previousStatus: string;
	newStatus: string;
	updatedBy: string;
	notes?: string;
	currentStep?: string;
	portalUrl: string;
	tenantName: string;
}

export interface PasswordResetData {
	userName: string;
	resetLink: string;
	expiryMinutes?: number;
	tenantName: string;
	supportEmail: string;
}

export interface InvoiceLineItem {
	description: string;
	quantity: number;
	unitPrice: number;
	total: number;
}

export interface InvoiceData {
	clientName: string;
	invoiceNumber: string;
	invoiceDate: Date;
	dueDate: Date;
	lineItems: InvoiceLineItem[];
	subtotal: number;
	tax?: number;
	total: number;
	paymentInstructions?: string;
	portalUrl: string;
	tenantName: string;
	tenantAddress?: string;
	tenantPhone?: string;
	tenantEmail?: string;
}
