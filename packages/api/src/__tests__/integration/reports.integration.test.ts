/**
 * Reports API Integration Tests
 */

import { storePdfReport } from "@GCMC-KAJ/storage";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { reportsRouter } from "../../routers/reports";
import type { Context } from "../../trpc";
import { createCallerFactory } from "../../trpc";
import {
	cleanupIntegrationTestContext,
	createIntegrationTestContext,
} from "../helpers/integration-context";

// Mock storage module for integration tests
vi.mock("@GCMC-KAJ/storage", () => ({
	storePdfReport: vi.fn(),
	generatePdfDownloadUrl: vi.fn(),
}));

describe("Reports API Integration Tests", () => {
	let context: Context;
	let caller: ReturnType<typeof createCallerFactory>;

	beforeAll(async () => {
		context = await createIntegrationTestContext();
		caller = createCallerFactory(reportsRouter)(context);
	});

	beforeEach(async () => {
		// Clean up any test data
		await context.db.generatedReport.deleteMany({
			where: { tenantId: context.tenant.id },
		});

		vi.clearAllMocks();
	});

	afterAll(async () => {
		// Clean up test tenant data
		await cleanupIntegrationTestContext(context);
	});

	describe("Generate Report", () => {
		it("should generate compliance report successfully", async () => {
			// Create test client
			const testClient = await context.db.client.create({
				data: {
					tenantId: context.tenant.id,
					name: "Test Client LLC",
					email: "test@client.com",
					businessType: "COMPANY",
					status: "ACTIVE",
					taxId: "TAX123456",
					createdBy: context.user.id,
				},
			});

			// Mock storage response
			(storePdfReport as any).mockResolvedValue({
				filePath: "reports/compliance/1/compliance-report.pdf",
				fileSize: 1024000,
				checksum: "test-checksum",
				downloadUrl: "https://storage.example.com/download-url",
			});

			const result = await caller.generate({
				type: "compliance",
				clientIds: [testClient.id],
				format: "pdf",
				includeAttachments: false,
			});

			expect(result).toEqual({
				reportId: expect.any(String),
				downloadUrl: "https://storage.example.com/download-url",
				expiresAt: expect.any(Date),
			});

			// Verify report was stored in database
			const savedReport = await context.db.generatedReport.findFirst({
				where: {
					tenantId: context.tenant.id,
					reportType: "compliance",
				},
			});

			expect(savedReport).toMatchObject({
				reportType: "compliance",
				fileName: expect.stringContaining("compliance"),
				fileSize: 1024000,
				checksum: "test-checksum",
				generatedBy: context.user.email,
			});

			expect(storePdfReport).toHaveBeenCalledWith(
				context.tenant.id,
				testClient.id,
				"compliance",
				expect.any(Buffer),
				expect.any(String),
				context.user.email,
			);
		});

		it("should generate tax filing report with multiple clients", async () => {
			// Create multiple test clients
			const clients = await Promise.all([
				context.db.client.create({
					data: {
						tenantId: context.tenant.id,
						name: "Client A Ltd",
						email: "clienta@example.com",
						businessType: "COMPANY",
						status: "ACTIVE",
						taxId: "TAX001",
						createdBy: context.user.id,
					},
				}),
				context.db.client.create({
					data: {
						tenantId: context.tenant.id,
						name: "Client B LLC",
						email: "clientb@example.com",
						businessType: "SOLE_TRADER",
						status: "ACTIVE",
						taxId: "TAX002",
						createdBy: context.user.id,
					},
				}),
			]);

			(storePdfReport as any).mockResolvedValue({
				filePath: "reports/tax_filing/multi/tax-filing-report.pdf",
				fileSize: 2048000,
				checksum: "multi-client-checksum",
				downloadUrl: "https://storage.example.com/multi-client-download",
			});

			const result = await caller.generate({
				type: "tax_filing",
				clientIds: clients.map((c) => c.id),
				format: "excel",
				includeAttachments: true,
				dateRange: {
					from: new Date("2024-01-01"),
					to: new Date("2024-12-31"),
				},
			});

			expect(result.reportId).toBeDefined();
			expect(result.downloadUrl).toBe(
				"https://storage.example.com/multi-client-download",
			);

			// Verify report metadata
			const savedReport = await context.db.generatedReport.findFirst({
				where: {
					id: result.reportId,
					tenantId: context.tenant.id,
				},
			});

			expect(savedReport?.reportType).toBe("tax_filing");
			expect(savedReport?.fileSize).toBe(2048000);
		});

		it("should handle storage errors gracefully", async () => {
			const testClient = await context.db.client.create({
				data: {
					tenantId: context.tenant.id,
					name: "Test Client",
					email: "test@example.com",
					businessType: "COMPANY",
					status: "ACTIVE",
					taxId: "TAX999",
					createdBy: context.user.id,
				},
			});

			(storePdfReport as any).mockRejectedValue(
				new Error("Storage service unavailable"),
			);

			await expect(
				caller.generate({
					type: "compliance",
					clientIds: [testClient.id],
					format: "pdf",
					includeAttachments: false,
				}),
			).rejects.toThrow("Storage service unavailable");

			// Ensure no database record was created on storage failure
			const reportCount = await context.db.generatedReport.count({
				where: { tenantId: context.tenant.id },
			});

			expect(reportCount).toBe(0);
		});

		it("should enforce tenant isolation", async () => {
			// Create client in different tenant
			const otherTenant = await context.db.tenant.create({
				data: {
					name: "Other Tenant",
					domain: "other.example.com",
				},
			});

			const otherClient = await context.db.client.create({
				data: {
					tenantId: otherTenant.id,
					name: "Other Client",
					email: "other@example.com",
					businessType: "COMPANY",
					status: "ACTIVE",
					taxId: "TAX_OTHER",
					createdBy: context.user.id,
				},
			});

			// Attempt to generate report for client in different tenant
			await expect(
				caller.generate({
					type: "compliance",
					clientIds: [otherClient.id],
					format: "pdf",
					includeAttachments: false,
				}),
			).rejects.toThrow();

			// Clean up
			await context.db.client.delete({ where: { id: otherClient.id } });
			await context.db.tenant.delete({ where: { id: otherTenant.id } });
		});
	});

	describe("Download Report", () => {
		it("should generate download URL for existing report", async () => {
			// Create test report
			const testReport = await context.db.generatedReport.create({
				data: {
					tenantId: context.tenant.id,
					clientId: 1,
					reportType: "compliance",
					filePath: "reports/compliance/1/test-report.pdf",
					fileName: "test-report.pdf",
					fileSize: 1024,
					checksum: "test-checksum",
					generatedBy: context.user.email,
					generatedAt: new Date(),
					expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
				},
			});

			const { generatePdfDownloadUrl } = await import("@GCMC-KAJ/storage");
			(generatePdfDownloadUrl as any).mockResolvedValue(
				"https://storage.example.com/download-url",
			);

			const result = await caller.download({
				reportId: testReport.id,
			});

			expect(result.downloadUrl).toBe(
				"https://storage.example.com/download-url",
			);
			expect(generatePdfDownloadUrl).toHaveBeenCalledWith(
				context.tenant.id,
				"reports/compliance/1/test-report.pdf",
				3600,
			);
		});

		it("should reject download for non-existent report", async () => {
			await expect(
				caller.download({
					reportId: "99999",
				}),
			).rejects.toThrow("Report not found");
		});

		it("should reject download for expired report", async () => {
			const expiredReport = await context.db.generatedReport.create({
				data: {
					tenantId: context.tenant.id,
					clientId: 1,
					reportType: "compliance",
					filePath: "reports/compliance/1/expired-report.pdf",
					fileName: "expired-report.pdf",
					fileSize: 1024,
					checksum: "expired-checksum",
					generatedBy: context.user.email,
					generatedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
					expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired 1 day ago
				},
			});

			await expect(
				caller.download({
					reportId: expiredReport.id,
				}),
			).rejects.toThrow("Report has expired");
		});
	});

	describe("List Recent Reports", () => {
		it("should return recent reports for tenant", async () => {
			// Create multiple test reports
			const reports = await Promise.all([
				context.db.generatedReport.create({
					data: {
						tenantId: context.tenant.id,
						clientId: 1,
						reportType: "compliance",
						filePath: "reports/compliance/1/report1.pdf",
						fileName: "report1.pdf",
						fileSize: 1024,
						checksum: "checksum1",
						generatedBy: context.user.email,
						generatedAt: new Date("2024-01-15"),
						expiresAt: new Date("2025-01-15"),
					},
				}),
				context.db.generatedReport.create({
					data: {
						tenantId: context.tenant.id,
						clientId: 2,
						reportType: "tax_filing",
						filePath: "reports/tax_filing/2/report2.pdf",
						fileName: "report2.pdf",
						fileSize: 2048,
						checksum: "checksum2",
						generatedBy: context.user.email,
						generatedAt: new Date("2024-01-20"),
						expiresAt: new Date("2025-01-20"),
					},
				}),
			]);

			const result = await caller.recent();

			expect(result.reports).toHaveLength(2);
			expect(result.reports[0].reportType).toBe("tax_filing"); // Most recent first
			expect(result.reports[1].reportType).toBe("compliance");

			expect(result.reports[0]).toMatchObject({
				id: reports[1].id,
				title: expect.stringContaining("tax_filing"),
				fileSize: "2.0 KB",
				format: "PDF",
			});
		});

		it("should limit results to 50 reports", async () => {
			// Create 60 test reports
			const reportData = Array.from({ length: 60 }, (_, i) => ({
				tenantId: context.tenant.id,
				clientId: 1,
				reportType: "compliance",
				filePath: `reports/compliance/1/report${i}.pdf`,
				fileName: `report${i}.pdf`,
				fileSize: 1024,
				checksum: `checksum${i}`,
				generatedBy: context.user.email,
				generatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Spread over 60 days
				expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
			}));

			await context.db.generatedReport.createMany({
				data: reportData,
			});

			const result = await caller.recent();

			expect(result.reports).toHaveLength(50); // Should be limited to 50
			expect(result.total).toBe(60); // Should show total count

			// Should be ordered by most recent first
			expect(
				new Date(result.reports[0].createdAt) >
					new Date(result.reports[1].createdAt),
			).toBe(true);
		});

		it("should enforce tenant isolation in recent reports", async () => {
			// Create report for different tenant
			const otherTenant = await context.db.tenant.create({
				data: {
					name: "Other Tenant",
					domain: "other.example.com",
				},
			});

			await context.db.generatedReport.create({
				data: {
					tenantId: otherTenant.id,
					clientId: 1,
					reportType: "compliance",
					filePath: "reports/compliance/1/other-report.pdf",
					fileName: "other-report.pdf",
					fileSize: 1024,
					checksum: "other-checksum",
					generatedBy: "other@user.com",
					generatedAt: new Date(),
					expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
				},
			});

			const result = await caller.recent();

			// Should not include reports from other tenant
			expect(
				result.reports.every((r) => r.tenantId === context.tenant.id),
			).toBe(true);

			// Clean up
			await context.db.generatedReport.deleteMany({
				where: { tenantId: otherTenant.id },
			});
			await context.db.tenant.delete({ where: { id: otherTenant.id } });
		});
	});

	describe("Available Types", () => {
		it("should return all available report types", async () => {
			const result = await caller.availableTypes();

			expect(result.types).toEqual([
				"compliance",
				"tax_filing",
				"client_package",
				"audit_trail",
				"penalty_calculation",
			]);

			expect(result.metadata.compliance).toMatchObject({
				title: "Compliance Report",
				description: expect.stringContaining("compliance"),
				features: expect.any(Array),
			});
		});
	});
});
