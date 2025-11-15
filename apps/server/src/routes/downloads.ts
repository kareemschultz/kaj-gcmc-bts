/**
 * Downloads Route - PDF Report Downloads
 *
 * Handles streaming PDF downloads with proper authentication and authorization
 */

import { auth } from "@GCMC-KAJ/auth";
import prisma from "@GCMC-KAJ/db";
import {
	generateClientFileReport,
	generateComplianceReport,
	generateDocumentsListReport,
	generateFilingsSummaryReport,
	generateServiceHistoryReport,
} from "@GCMC-KAJ/reports";
import { Hono } from "hono";

const app = new Hono();

/**
 * Download PDF report
 * GET /downloads/reports/:reportType/:clientId
 */
app.get("/reports/:reportType/:clientId", async (c) => {
	try {
		// Get session from auth
		const session = await auth.api.getSession({ headers: c.req.raw.headers });

		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const userId = session.user.id;
		const reportType = c.req.param("reportType");
		const clientId = Number.parseInt(c.req.param("clientId"), 10);

		if (Number.isNaN(clientId)) {
			return c.json({ error: "Invalid client ID" }, 400);
		}

		// Get user's tenant and role
		const tenantUser = await prisma.tenantUser.findFirst({
			where: { userId },
			include: {
				tenant: true,
				role: {
					include: {
						permissions: true,
					},
				},
			},
		});

		if (!tenantUser) {
			return c.json({ error: "User not associated with any tenant" }, 403);
		}

		const tenantId = tenantUser.tenantId;

		// Verify client belongs to tenant
		const client = await prisma.client.findFirst({
			where: { id: clientId, tenantId },
		});

		if (!client) {
			return c.json({ error: "Client not found or access denied" }, 404);
		}

		// Check permissions based on report type
		const hasPermission = (module: string, action: string) => {
			return tenantUser.role.permissions.some(
				(p) => p.module === module && p.action === action && p.allowed,
			);
		};

		let pdfBuffer: Buffer;
		let filename: string;

		switch (reportType) {
			case "client-file":
				if (!hasPermission("clients", "view")) {
					return c.json({ error: "Permission denied" }, 403);
				}
				pdfBuffer = await generateClientFileReport(clientId, tenantId);
				filename = `client-file-report-${client.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
				break;

			case "documents-list":
				if (!hasPermission("documents", "view")) {
					return c.json({ error: "Permission denied" }, 403);
				}
				pdfBuffer = await generateDocumentsListReport(clientId, tenantId);
				filename = `documents-list-${client.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
				break;

			case "filings-summary":
				if (!hasPermission("filings", "view")) {
					return c.json({ error: "Permission denied" }, 403);
				}
				pdfBuffer = await generateFilingsSummaryReport(clientId, tenantId);
				filename = `filings-summary-${client.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
				break;

			case "compliance":
				if (!hasPermission("clients", "view")) {
					return c.json({ error: "Permission denied" }, 403);
				}
				pdfBuffer = await generateComplianceReport(clientId, tenantId);
				filename = `compliance-report-${client.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
				break;

			case "service-history":
				if (!hasPermission("services", "view")) {
					return c.json({ error: "Permission denied" }, 403);
				}
				pdfBuffer = await generateServiceHistoryReport(clientId, tenantId);
				filename = `service-history-${client.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
				break;

			default:
				return c.json({ error: "Invalid report type" }, 400);
		}

		// Set response headers for PDF download
		c.header("Content-Type", "application/pdf");
		c.header("Content-Disposition", `attachment; filename="${filename}"`);
		c.header("Content-Length", pdfBuffer.length.toString());
		c.header("Cache-Control", "no-cache, no-store, must-revalidate");
		c.header("Pragma", "no-cache");
		c.header("Expires", "0");

		// Return PDF buffer
		return c.body(pdfBuffer);
	} catch (error) {
		console.error("Error generating PDF report:", error);
		return c.json(
			{
				error: "Failed to generate report",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

export default app;
