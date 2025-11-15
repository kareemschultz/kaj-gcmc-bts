/**
 * Reports tRPC Router
 *
 * Handles PDF report generation operations
 * Enforces tenant isolation and RBAC permissions
 */

import {
	generateClientFileReport,
	generateComplianceReport,
	generateDocumentsListReport,
	generateFilingsSummaryReport,
	generateServiceHistoryReport,
} from '@GCMC-KAJ/reports';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { rbacProcedure, router } from '../index';

/**
 * Report type enum for validation
 */
const reportTypeSchema = z.enum([
	'client_file',
	'documents_list',
	'filings_summary',
	'compliance',
	'service_history',
]);

/**
 * Reports router
 */
export const reportsRouter = router({
	/**
	 * Generate Client File Report
	 * Requires: clients:view permission
	 */
	generateClientFile: rbacProcedure('clients', 'view')
		.input(
			z.object({
				clientId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const pdfBuffer = await generateClientFileReport(input.clientId, ctx.tenantId);

				// Return base64 encoded PDF for client download
				return {
					success: true,
					data: pdfBuffer.toString('base64'),
					filename: `client-file-report-${input.clientId}-${Date.now()}.pdf`,
					contentType: 'application/pdf',
				};
			} catch (error) {
				console.error('Error generating client file report:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate client file report',
					cause: error,
				});
			}
		}),

	/**
	 * Generate Documents List Report
	 * Requires: documents:view permission
	 */
	generateDocumentsList: rbacProcedure('documents', 'view')
		.input(
			z.object({
				clientId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const pdfBuffer = await generateDocumentsListReport(input.clientId, ctx.tenantId);

				return {
					success: true,
					data: pdfBuffer.toString('base64'),
					filename: `documents-list-report-${input.clientId}-${Date.now()}.pdf`,
					contentType: 'application/pdf',
				};
			} catch (error) {
				console.error('Error generating documents list report:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate documents list report',
					cause: error,
				});
			}
		}),

	/**
	 * Generate Filings Summary Report
	 * Requires: filings:view permission
	 */
	generateFilingsSummary: rbacProcedure('filings', 'view')
		.input(
			z.object({
				clientId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const pdfBuffer = await generateFilingsSummaryReport(input.clientId, ctx.tenantId);

				return {
					success: true,
					data: pdfBuffer.toString('base64'),
					filename: `filings-summary-report-${input.clientId}-${Date.now()}.pdf`,
					contentType: 'application/pdf',
				};
			} catch (error) {
				console.error('Error generating filings summary report:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate filings summary report',
					cause: error,
				});
			}
		}),

	/**
	 * Generate Compliance Report
	 * Requires: clients:view permission
	 */
	generateComplianceReport: rbacProcedure('clients', 'view')
		.input(
			z.object({
				clientId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const pdfBuffer = await generateComplianceReport(input.clientId, ctx.tenantId);

				return {
					success: true,
					data: pdfBuffer.toString('base64'),
					filename: `compliance-report-${input.clientId}-${Date.now()}.pdf`,
					contentType: 'application/pdf',
				};
			} catch (error) {
				console.error('Error generating compliance report:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate compliance report',
					cause: error,
				});
			}
		}),

	/**
	 * Generate Service History Report
	 * Requires: service_requests:view permission
	 */
	generateServiceHistory: rbacProcedure('service_requests', 'view')
		.input(
			z.object({
				clientId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const pdfBuffer = await generateServiceHistoryReport(input.clientId, ctx.tenantId);

				return {
					success: true,
					data: pdfBuffer.toString('base64'),
					filename: `service-history-report-${input.clientId}-${Date.now()}.pdf`,
					contentType: 'application/pdf',
				};
			} catch (error) {
				console.error('Error generating service history report:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate service history report',
					cause: error,
				});
			}
		}),

	/**
	 * Generate report (generic endpoint)
	 * Requires appropriate permission based on report type
	 */
	generate: rbacProcedure('clients', 'view')
		.input(
			z.object({
				clientId: z.number(),
				reportType: reportTypeSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				let pdfBuffer: Buffer;

				switch (input.reportType) {
					case 'client_file':
						pdfBuffer = await generateClientFileReport(input.clientId, ctx.tenantId);
						break;
					case 'documents_list':
						pdfBuffer = await generateDocumentsListReport(input.clientId, ctx.tenantId);
						break;
					case 'filings_summary':
						pdfBuffer = await generateFilingsSummaryReport(input.clientId, ctx.tenantId);
						break;
					case 'compliance':
						pdfBuffer = await generateComplianceReport(input.clientId, ctx.tenantId);
						break;
					case 'service_history':
						pdfBuffer = await generateServiceHistoryReport(input.clientId, ctx.tenantId);
						break;
					default:
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: 'Invalid report type',
						});
				}

				return {
					success: true,
					data: pdfBuffer.toString('base64'),
					filename: `${input.reportType}-${input.clientId}-${Date.now()}.pdf`,
					contentType: 'application/pdf',
				};
			} catch (error) {
				console.error('Error generating report:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate report',
					cause: error,
				});
			}
		}),
});
