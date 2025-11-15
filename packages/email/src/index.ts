/**
 * Email Package - React Email Templates + Resend Integration
 */

export { default as DocumentExpiryWarningEmail } from "../templates/document-expiry-warning";
export { default as FilingReminderEmail } from "../templates/filing-reminder";
export { default as InvoiceEmail } from "../templates/invoice";
export { default as PasswordResetEmail } from "../templates/password-reset";
export { default as ServiceRequestUpdateEmail } from "../templates/service-request-update";
export { default as TaskAssignmentEmail } from "../templates/task-assignment";
// Re-export templates for preview/dev purposes
export { default as WelcomeEmail } from "../templates/welcome";
export { createEmailService, EmailService, emailService } from "./service";
export * from "./types";
