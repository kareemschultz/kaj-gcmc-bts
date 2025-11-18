/**
 * Reports tRPC Router
 *
 * Handles PDF report generation and management
 * Integrates with Phase 4 storage system for automated archival
 * Supports Guyana-specific compliance reports
 */

import prisma from "@GCMC-KAJ/db";
import {
	generatePdfDownloadUrl,
	getPdfStorageStats,
	storePdfReport,
} from "@GCMC-KAJ/storage";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Report type schema
 */
const reportTypeSchema = z.enum([
	"compliance",
	"tax_filing",
	"client_package",
	"audit_trail",
	"penalty_calculation",
]);

/**
 * Report generation parameters schema
 */
const reportGenerationSchema = z.object({
	type: reportTypeSchema,
	clientIds: z.array(z.number()).optional(),
	dateRange: z
		.object({
			from: z.date(),
			to: z.date(),
		})
		.optional(),
	includeAttachments: z.boolean().default(false),
	format: z.enum(["pdf", "excel"]).default("pdf"),
	template: z.string().optional(),
});

/**
 * Reports router
 */
export const reportsRouter = router({
	/**
	 * Get available report types
	 * Requires: reports:view permission
	 */
	availableTypes: rbacProcedure("reports", "view").query(async ({ ctx }) => {
		return [
			{
				id: "compliance",
				name: "Compliance Report",
				description: "Complete compliance status for GRA submission",
				supportsExcel: true,
				requiredPermissions: ["compliance:view"],
			},
			{
				id: "tax_filing",
				name: "Tax Filing Summary",
				description: "Comprehensive tax filing status report",
				supportsExcel: true,
				requiredPermissions: ["filings:view"],
			},
			{
				id: "client_package",
				name: "Client Document Package",
				description: "Complete document package for specific clients",
				supportsExcel: false,
				requiredPermissions: ["clients:view", "documents:view"],
			},
			{
				id: "audit_trail",
				name: "Audit Trail Report",
				description: "Detailed audit trail for compliance verification",
				supportsExcel: true,
				requiredPermissions: ["audit:view"],
			},
			{
				id: "penalty_calculation",
				name: "Penalty Calculation Report",
				description: "Detailed penalty calculations and payment status",
				supportsExcel: true,
				requiredPermissions: ["penalties:view"],
			},
		];
	}),

	/**
	 * Generate a new report
	 * Requires: reports:create permission + specific report permissions
	 */
	generate: rbacProcedure("reports", "create")
		.input(reportGenerationSchema)
		.mutation(async ({ ctx, input }) => {
			const { type, clientIds, dateRange, includeAttachments, format } = input;

			try {
				// Validate client access (tenant isolation)
				if (clientIds && clientIds.length > 0) {
					const clientsInTenant = await prisma.client.count({
						where: {
							id: { in: clientIds },
							tenantId: ctx.tenantId,
						},
					});

					if (clientsInTenant !== clientIds.length) {
						throw new Error("Some clients are not accessible in your tenant");
					}
				}

				// Generate mock report data for now
				const reportData = await generateReportData(type, {
					tenantId: ctx.tenantId,
					clientIds,
					dateRange,
					includeAttachments,
					format,
				});

				// Store report using Phase 4 storage system
				const storageResult = await storePdfReport(
					ctx.tenantId,
					clientIds?.[0] || 0, // Use first client or 0 for tenant-wide reports
					type,
					reportData.buffer,
					`${type}-${Date.now()}`,
					ctx.user.id,
				);

				// Create database record
				const generatedReport = await prisma.generatedReport.create({
					data: {
						tenantId: ctx.tenantId,
						clientId: clientIds?.[0] || 0,
						reportType: type,
						filePath: storageResult.filePath,
						fileName: storageResult.fileName,
						fileSize: reportData.buffer.length,
						checksum: storageResult.checksum,
						generatedBy: ctx.user.id,
						generatedAt: new Date(),
						expiresAt: storageResult.expiresAt,
						downloadCount: 0,
					},
				});

				// Generate download URL
				const downloadUrl = await generatePdfDownloadUrl(
					ctx.tenantId,
					storageResult.filePath,
					storageResult.fileName,
				);

				return {
					success: true,
					reportId: generatedReport.id,
					fileName: storageResult.fileName,
					fileSize: reportData.buffer.length,
					downloadUrl,
					expiresAt: storageResult.expiresAt,
				};
			} catch (error) {
				console.error("Report generation failed:", error);
				throw new Error(
					`Failed to generate ${type} report: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}),

	/**
	 * Get recent reports for current tenant
	 * Requires: reports:view permission
	 */
	recent: rbacProcedure("reports", "view")
		.input(
			z.object({
				limit: z.number().default(10),
				type: reportTypeSchema.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const reports = await prisma.generatedReport.findMany({
				where: {
					tenantId: ctx.tenantId,
					...(input.type && { reportType: input.type }),
				},
				take: input.limit,
				orderBy: { generatedAt: "desc" },
				select: {
					id: true,
					reportType: true,
					fileName: true,
					fileSize: true,
					generatedAt: true,
					expiresAt: true,
					downloadCount: true,
					generatedBy: true,
					client: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			// Format file sizes and add titles
			const formattedReports = reports.map((report) => ({
				...report,
				title: getReportTitle(report.reportType),
				fileSize: formatFileSize(report.fileSize),
				format: "PDF",
			}));

			return {
				reports: formattedReports,
				total: reports.length,
			};
		}),

	/**
	 * Download a specific report
	 * Requires: reports:view permission
	 */
	download: rbacProcedure("reports", "view")
		.input(
			z.object({
				reportId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const report = await prisma.generatedReport.findFirst({
				where: {
					id: Number.parseInt(input.reportId, 10),
					tenantId: ctx.tenantId,
				},
			});

			if (!report) {
				throw new Error("Report not found or access denied");
			}

			// Check if report has expired
			if (report.expiresAt && new Date() > report.expiresAt) {
				throw new Error("Report has expired and is no longer available");
			}

			// Generate download URL
			const downloadUrl = await generatePdfDownloadUrl(
				ctx.tenantId,
				report.filePath,
				report.fileName,
			);

			// Increment download count
			await prisma.generatedReport.update({
				where: { id: report.id },
				data: {
					downloadCount: { increment: 1 },
					downloadedAt: new Date(),
				},
			});

			return {
				downloadUrl,
				fileName: report.fileName,
				fileSize: report.fileSize,
			};
		}),

	/**
	 * Get storage statistics for reports
	 * Requires: reports:view permission
	 */
	storageStats: rbacProcedure("reports", "view").query(async ({ ctx }) => {
		const [dbStats, storageStats] = await Promise.all([
			prisma.generatedReport.aggregate({
				where: { tenantId: ctx.tenantId },
				_count: { id: true },
				_sum: { fileSize: true },
			}),
			getPdfStorageStats(ctx.tenantId),
		]);

		const totalReports = dbStats._count.id || 0;
		const totalSize = dbStats._sum.fileSize || 0;

		return {
			totalReports,
			totalSize: formatFileSize(totalSize),
			totalSizeBytes: totalSize,
			storageUsed: formatFileSize(storageStats.totalSize),
			storageUsedBytes: storageStats.totalSize,
			averageReportSize:
				totalReports > 0
					? formatFileSize(Math.round(totalSize / totalReports))
					: "0 B",
			retentionDays: 365,
		};
	}),
});

/**
 * Generate mock report data (placeholder for actual PDF generation)
 */
async function generateReportData(reportType: string, _options: any) {
	// This is a placeholder - in a real implementation, you'd use a PDF library like puppeteer or pdfkit
	const mockPdfContent = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 53 >>
stream
BT
/F1 12 Tf
72 720 Td
(${getReportTitle(reportType)}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000110 00000 n
0000000205 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
309
%%EOF`;

	return {
		buffer: Buffer.from(mockPdfContent, "utf-8"),
		fileName: `${reportType}-${Date.now()}.pdf`,
	};
}

/**
 * Helper function to get human-readable report titles
 */
function getReportTitle(reportType: string): string {
	const titles = {
		compliance: "Compliance Report",
		tax_filing: "Tax Filing Summary",
		client_package: "Client Document Package",
		audit_trail: "Audit Trail Report",
		penalty_calculation: "Penalty Calculation Report",
	};
	return titles[reportType as keyof typeof titles] || "Unknown Report";
}

/**
 * Helper function to format file sizes
 */
function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";

	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));

	return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}
