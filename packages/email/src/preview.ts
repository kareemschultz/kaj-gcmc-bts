/**
 * Email Preview Development Server
 * Run this to preview all email templates in the browser
 */

import { render } from "@react-email/render";
import { Hono } from "hono";
import DocumentExpiryWarningEmail from "../templates/document-expiry-warning";
import FilingReminderEmail from "../templates/filing-reminder";
import InvoiceEmail from "../templates/invoice";
import PasswordResetEmail from "../templates/password-reset";
import ServiceRequestUpdateEmail from "../templates/service-request-update";
import TaskAssignmentEmail from "../templates/task-assignment";
import WelcomeEmail from "../templates/welcome";

const app = new Hono();

// Sample data for previews
const sampleData = {
	welcome: {
		clientName: "John Doe",
		tenantName: "GCMC Professional Services",
		portalUrl: "https://portal.gcmc.com",
		supportEmail: "support@gcmc.com",
	},
	documentExpiry: {
		recipientName: "Jane Smith",
		documentTitle: "Business Registration Certificate",
		documentType: "Registration",
		clientName: "ABC Corporation Ltd",
		expiryDate: new Date("2025-12-31"),
		daysUntilExpiry: 7,
		portalUrl: "https://portal.gcmc.com",
		tenantName: "GCMC Professional Services",
	},
	filingReminder: {
		recipientName: "Team Member",
		filingType: "VAT Return - Monthly",
		clientName: "XYZ Trading Company",
		periodLabel: "November 2025",
		dueDate: new Date("2025-12-15"),
		daysUntilDue: 3,
		authority: "GRA",
		status: "prepared",
		portalUrl: "https://portal.gcmc.com",
		tenantName: "GCMC Professional Services",
	},
	taskAssignment: {
		assigneeName: "Alex Johnson",
		taskTitle: "Review and approve financial statements",
		taskDescription:
			"Please review the Q4 financial statements for ABC Corporation and ensure all documents are complete before the filing deadline.",
		clientName: "ABC Corporation Ltd",
		priority: "high",
		dueDate: new Date("2025-12-20"),
		assignedBy: "Manager Name",
		portalUrl: "https://portal.gcmc.com",
		tenantName: "GCMC Professional Services",
	},
	serviceRequestUpdate: {
		recipientName: "Client Representative",
		serviceName: "Company Incorporation",
		clientName: "New Ventures Ltd",
		previousStatus: "new",
		newStatus: "in_progress",
		updatedBy: "Account Manager",
		notes:
			"We have begun processing your incorporation documents. Please provide the missing shareholder information at your earliest convenience.",
		currentStep: "Document Collection",
		portalUrl: "https://portal.gcmc.com",
		tenantName: "GCMC Professional Services",
	},
	passwordReset: {
		userName: "John Doe",
		resetLink: "https://portal.gcmc.com/reset-password?token=abc123xyz789",
		expiryMinutes: 60,
		tenantName: "GCMC Professional Services",
		supportEmail: "support@gcmc.com",
	},
	invoice: {
		clientName: "ABC Corporation Ltd",
		invoiceNumber: "INV-2025-001",
		invoiceDate: new Date("2025-11-15"),
		dueDate: new Date("2025-12-15"),
		lineItems: [
			{
				description: "Monthly Compliance & Advisory Services",
				quantity: 1,
				unitPrice: 1500.0,
				total: 1500.0,
			},
			{
				description: "VAT Return Filing - November 2025",
				quantity: 1,
				unitPrice: 300.0,
				total: 300.0,
			},
			{
				description: "Document Processing & Review",
				quantity: 5,
				unitPrice: 50.0,
				total: 250.0,
			},
		],
		subtotal: 2050.0,
		tax: 0,
		total: 2050.0,
		paymentInstructions:
			"Please make payment to: GCMC Professional Services, Account #123456789, Republic Bank Ltd. Include invoice number in payment reference.",
		portalUrl: "https://portal.gcmc.com",
		tenantName: "GCMC Professional Services",
		tenantAddress: "123 Main Street, Georgetown, Guyana",
		tenantPhone: "+592-123-4567",
		tenantEmail: "billing@gcmc.com",
	},
};

// Preview routes
app.get("/", (c) => {
	return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Email Templates Preview</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f6f9fc;
          }
          h1 {
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          p {
            color: #6b7280;
            margin-bottom: 32px;
          }
          .templates {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
          }
          .template-card {
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .template-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .template-card h2 {
            margin: 0 0 8px 0;
            color: #1a1a1a;
            font-size: 18px;
          }
          .template-card p {
            margin: 0 0 16px 0;
            font-size: 14px;
            color: #6b7280;
          }
          .template-card a {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
          }
          .template-card a:hover {
            background: #1d4ed8;
          }
        </style>
      </head>
      <body>
        <h1>📧 Email Templates Preview</h1>
        <p>Preview all available email templates with sample data</p>

        <div class="templates">
          <div class="template-card">
            <h2>Welcome Email</h2>
            <p>Sent when a new client is created</p>
            <a href="/preview/welcome">Preview</a>
          </div>

          <div class="template-card">
            <h2>Document Expiry Warning</h2>
            <p>Alerts when documents are expiring soon</p>
            <a href="/preview/document-expiry">Preview</a>
          </div>

          <div class="template-card">
            <h2>Filing Reminder</h2>
            <p>Reminds about upcoming filing deadlines</p>
            <a href="/preview/filing-reminder">Preview</a>
          </div>

          <div class="template-card">
            <h2>Task Assignment</h2>
            <p>Notifies when a task is assigned</p>
            <a href="/preview/task-assignment">Preview</a>
          </div>

          <div class="template-card">
            <h2>Service Request Update</h2>
            <p>Updates on service request status changes</p>
            <a href="/preview/service-request-update">Preview</a>
          </div>

          <div class="template-card">
            <h2>Password Reset</h2>
            <p>Password reset link and instructions</p>
            <a href="/preview/password-reset">Preview</a>
          </div>

          <div class="template-card">
            <h2>Invoice</h2>
            <p>Billing and invoice notifications</p>
            <a href="/preview/invoice">Preview</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.get("/preview/welcome", async (c) => {
	const html = await render(WelcomeEmail(sampleData.welcome));
	return c.html(html);
});

app.get("/preview/document-expiry", async (c) => {
	const html = await render(
		DocumentExpiryWarningEmail(sampleData.documentExpiry),
	);
	return c.html(html);
});

app.get("/preview/filing-reminder", async (c) => {
	const html = await render(FilingReminderEmail(sampleData.filingReminder));
	return c.html(html);
});

app.get("/preview/task-assignment", async (c) => {
	const html = await render(TaskAssignmentEmail(sampleData.taskAssignment));
	return c.html(html);
});

app.get("/preview/service-request-update", async (c) => {
	const html = await render(
		ServiceRequestUpdateEmail(sampleData.serviceRequestUpdate),
	);
	return c.html(html);
});

app.get("/preview/password-reset", async (c) => {
	const html = await render(PasswordResetEmail(sampleData.passwordReset));
	return c.html(html);
});

app.get("/preview/invoice", async (c) => {
	const html = await render(InvoiceEmail(sampleData.invoice));
	return c.html(html);
});

// Start preview server
const port = process.env.EMAIL_PREVIEW_PORT
	? Number.parseInt(process.env.EMAIL_PREVIEW_PORT, 10)
	: 3003;

console.log("\n📧 Email Preview Server");
console.log(`🌐 Open http://localhost:${port} to preview templates\n`);

export default {
	port,
	fetch: app.fetch,
};
