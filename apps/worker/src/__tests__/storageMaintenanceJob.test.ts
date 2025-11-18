/**
 * Storage Maintenance Job Tests
 */

import type { Job } from "bullmq";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	processStorageMaintenanceJob,
	type StorageMaintenanceJobData,
} from "../jobs/storageMaintenanceJob";

// Mock dependencies
vi.mock("@GCMC-KAJ/db", () => ({
	db: {
		tenant: {
			findMany: vi.fn(),
		},
		generatedReport: {
			findMany: vi.fn(),
			deleteMany: vi.fn(),
			update: vi.fn(),
			aggregate: vi.fn(),
		},
	},
}));

vi.mock("@GCMC-KAJ/storage", () => ({
	cleanupExpiredReports: vi.fn(),
	getPdfStorageStats: vi.fn(),
	retrievePdfReport: vi.fn(),
	listFiles: vi.fn(),
	deleteFile: vi.fn(),
}));

import { db } from "@GCMC-KAJ/db";
import {
	cleanupExpiredReports,
	deleteFile,
	getPdfStorageStats,
	listFiles,
	retrievePdfReport,
} from "@GCMC-KAJ/storage";

describe("Storage Maintenance Job", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("CLEANUP_EXPIRED_REPORTS", () => {
		it("should cleanup expired reports for all tenants", async () => {
			const mockTenants = [
				{ id: 1, name: "Tenant 1" },
				{ id: 2, name: "Tenant 2" },
			];

			const mockJob = {
				data: {
					type: "CLEANUP_EXPIRED_REPORTS",
					retentionDays: 365,
					dryRun: false,
				},
			} as Job<StorageMaintenanceJobData>;

			(db.tenant.findMany as any).mockResolvedValue(mockTenants);
			(cleanupExpiredReports as any)
				.mockResolvedValueOnce({ deletedCount: 5, bytesFreed: 10240 })
				.mockResolvedValueOnce({ deletedCount: 3, bytesFreed: 6144 });
			(db.generatedReport.deleteMany as any).mockResolvedValue({});

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result).toEqual({
				type: "CLEANUP_EXPIRED_REPORTS",
				dryRun: false,
				retentionDays: 365,
				totalDeleted: 8,
				totalBytesFreed: 16384,
				tenantsProcessed: 2,
				results: [
					{
						tenantId: 1,
						tenantName: "Tenant 1",
						deleted: 5,
						bytesFreed: 10240,
					},
					{
						tenantId: 2,
						tenantName: "Tenant 2",
						deleted: 3,
						bytesFreed: 6144,
					},
				],
			});

			expect(cleanupExpiredReports).toHaveBeenCalledTimes(2);
			expect(db.generatedReport.deleteMany).toHaveBeenCalledTimes(2);
		});

		it("should perform dry run without actual deletion", async () => {
			const mockTenants = [{ id: 1, name: "Tenant 1" }];
			const mockExpiredReports = [
				{
					id: 1,
					fileName: "report1.pdf",
					fileSize: 1024,
					reportType: "compliance",
					generatedAt: new Date(),
				},
				{
					id: 2,
					fileName: "report2.pdf",
					fileSize: 2048,
					reportType: "tax_filing",
					generatedAt: new Date(),
				},
			];

			const mockJob = {
				data: {
					type: "CLEANUP_EXPIRED_REPORTS",
					retentionDays: 365,
					dryRun: true,
				},
			} as Job<StorageMaintenanceJobData>;

			(db.tenant.findMany as any).mockResolvedValue(mockTenants);
			(db.generatedReport.findMany as any).mockResolvedValue(
				mockExpiredReports,
			);

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result.dryRun).toBe(true);
			expect(result.results[0]).toEqual({
				tenantId: 1,
				tenantName: "Tenant 1",
				wouldDelete: 2,
				wouldFreeBytes: 3072,
				reports: mockExpiredReports,
			});

			expect(cleanupExpiredReports).not.toHaveBeenCalled();
			expect(db.generatedReport.deleteMany).not.toHaveBeenCalled();
		});

		it("should handle cleanup errors gracefully", async () => {
			const mockTenants = [
				{ id: 1, name: "Tenant 1" },
				{ id: 2, name: "Tenant 2" },
			];

			const mockJob = {
				data: {
					type: "CLEANUP_EXPIRED_REPORTS",
					retentionDays: 365,
					dryRun: false,
				},
			} as Job<StorageMaintenanceJobData>;

			(db.tenant.findMany as any).mockResolvedValue(mockTenants);
			(cleanupExpiredReports as any)
				.mockResolvedValueOnce({ deletedCount: 5, bytesFreed: 10240 })
				.mockRejectedValueOnce(new Error("Storage cleanup failed"));

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result.results).toHaveLength(2);
			expect(result.results[0].deleted).toBe(5);
			expect(result.results[1].error).toBe("Storage cleanup failed");
		});

		it("should process specific tenant when tenantId provided", async () => {
			const mockJob = {
				data: {
					type: "CLEANUP_EXPIRED_REPORTS",
					tenantId: 1,
					retentionDays: 365,
					dryRun: false,
				},
			} as Job<StorageMaintenanceJobData>;

			(cleanupExpiredReports as any).mockResolvedValue({
				deletedCount: 5,
				bytesFreed: 10240,
			});
			(db.generatedReport.deleteMany as any).mockResolvedValue({});

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result.tenantsProcessed).toBe(1);
			expect(result.results[0].tenantId).toBe(1);
			expect(db.tenant.findMany).not.toHaveBeenCalled();
		});
	});

	describe("VALIDATE_FILE_INTEGRITY", () => {
		it("should validate file integrity successfully", async () => {
			const mockReports = [
				{
					id: 1,
					tenantId: 1,
					filePath: "reports/compliance/123/report1.pdf",
					checksum: "checksum1",
					fileName: "report1.pdf",
					generatedAt: new Date(),
				},
				{
					id: 2,
					tenantId: 1,
					filePath: "reports/compliance/123/report2.pdf",
					checksum: "checksum2",
					fileName: "report2.pdf",
					generatedAt: new Date(),
				},
			];

			const mockJob = {
				data: {
					type: "VALIDATE_FILE_INTEGRITY",
					tenantId: 1,
				},
			} as Job<StorageMaintenanceJobData>;

			(db.generatedReport.findMany as any).mockResolvedValue(mockReports);
			(retrievePdfReport as any)
				.mockResolvedValueOnce({ buffer: Buffer.from("content1") })
				.mockResolvedValueOnce({ buffer: Buffer.from("content2") });

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result).toEqual({
				type: "VALIDATE_FILE_INTEGRITY",
				totalChecked: 2,
				validFiles: 2,
				invalidFiles: 0,
				errorFiles: 0,
				results: [], // Only returns problematic files
			});
		});

		it("should detect corrupted files", async () => {
			const mockReports = [
				{
					id: 1,
					tenantId: 1,
					filePath: "reports/compliance/123/corrupted.pdf",
					checksum: "wrong-checksum",
					fileName: "corrupted.pdf",
					generatedAt: new Date(),
				},
			];

			const mockJob = {
				data: {
					type: "VALIDATE_FILE_INTEGRITY",
				},
			} as Job<StorageMaintenanceJobData>;

			(db.generatedReport.findMany as any).mockResolvedValue(mockReports);
			(retrievePdfReport as any).mockRejectedValue(
				new Error("File integrity check failed: checksum mismatch"),
			);
			(db.generatedReport.update as any).mockResolvedValue({});

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result.validFiles).toBe(0);
			expect(result.invalidFiles).toBe(1);
			expect(result.results[0].status).toBe("invalid_checksum");
			expect(db.generatedReport.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { updatedAt: expect.any(Date) },
			});
		});

		it("should handle file access errors", async () => {
			const mockReports = [
				{
					id: 1,
					tenantId: 1,
					filePath: "reports/compliance/123/missing.pdf",
					checksum: "checksum",
					fileName: "missing.pdf",
					generatedAt: new Date(),
				},
			];

			const mockJob = {
				data: {
					type: "VALIDATE_FILE_INTEGRITY",
				},
			} as Job<StorageMaintenanceJobData>;

			(db.generatedReport.findMany as any).mockResolvedValue(mockReports);
			(retrievePdfReport as any).mockRejectedValue(new Error("File not found"));

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result.errorFiles).toBe(1);
			expect(result.results[0].status).toBe("error");
			expect(result.results[0].error).toBe("File not found");
		});

		it("should limit validation to 1000 reports", async () => {
			const mockJob = {
				data: {
					type: "VALIDATE_FILE_INTEGRITY",
				},
			} as Job<StorageMaintenanceJobData>;

			(db.generatedReport.findMany as any).mockResolvedValue([]);

			await processStorageMaintenanceJob(mockJob);

			expect(db.generatedReport.findMany).toHaveBeenCalledWith({
				where: {},
				select: {
					id: true,
					tenantId: true,
					filePath: true,
					checksum: true,
					fileName: true,
					generatedAt: true,
				},
				take: 1000,
				orderBy: {
					generatedAt: "desc",
				},
			});
		});
	});

	describe("STORAGE_USAGE_REPORT", () => {
		it("should generate storage usage report", async () => {
			const mockTenants = [
				{ id: 1, name: "Tenant 1" },
				{ id: 2, name: "Tenant 2" },
			];

			const mockJob = {
				data: {
					type: "STORAGE_USAGE_REPORT",
				},
			} as Job<StorageMaintenanceJobData>;

			(db.tenant.findMany as any).mockResolvedValue(mockTenants);
			(getPdfStorageStats as any)
				.mockResolvedValueOnce({
					totalReports: 100,
					totalSize: 1048576,
					reportsByType: { compliance: 60, tax_filing: 40 },
					oldestReport: new Date("2023-01-01"),
					newestReport: new Date("2024-01-01"),
				})
				.mockResolvedValueOnce({
					totalReports: 50,
					totalSize: 524288,
					reportsByType: { compliance: 30, tax_filing: 20 },
					oldestReport: new Date("2023-06-01"),
					newestReport: new Date("2024-01-01"),
				});

			(db.generatedReport.aggregate as any)
				.mockResolvedValueOnce({
					_count: { id: 98 },
					_sum: { fileSize: 1024000 },
					_min: { generatedAt: new Date("2023-01-01") },
					_max: { generatedAt: new Date("2024-01-01") },
				})
				.mockResolvedValueOnce({
					_count: { id: 48 },
					_sum: { fileSize: 512000 },
					_min: { generatedAt: new Date("2023-06-01") },
					_max: { generatedAt: new Date("2024-01-01") },
				});

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result.type).toBe("STORAGE_USAGE_REPORT");
			expect(result.summary).toEqual({
				totalReports: 150,
				totalSize: 1572864,
				totalTenants: 2,
				averageReportSize: 10486,
			});

			expect(result.tenantUsage).toHaveLength(2);
			expect(result.tenantUsage[0].discrepancy).toEqual({
				reportCount: 2, // 100 - 98
				sizeBytes: 24576, // 1048576 - 1024000
			});
		});

		it("should handle storage stats errors gracefully", async () => {
			const mockTenants = [
				{ id: 1, name: "Tenant 1" },
				{ id: 2, name: "Tenant 2" },
			];

			const mockJob = {
				data: {
					type: "STORAGE_USAGE_REPORT",
				},
			} as Job<StorageMaintenanceJobData>;

			(db.tenant.findMany as any).mockResolvedValue(mockTenants);
			(getPdfStorageStats as any)
				.mockResolvedValueOnce({
					totalReports: 100,
					totalSize: 1048576,
					reportsByType: {},
					oldestReport: null,
					newestReport: null,
				})
				.mockRejectedValueOnce(new Error("Storage access failed"));

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result.tenantUsage).toHaveLength(2);
			expect(result.tenantUsage[1].error).toBe("Storage access failed");
		});
	});

	describe("CLEANUP_ORPHANED_FILES", () => {
		it("should cleanup orphaned files", async () => {
			const mockTenants = [{ id: 1, name: "Tenant 1" }];
			const mockStorageFiles = [
				{ name: "reports/compliance/123/report1.pdf", size: 1024 },
				{ name: "reports/compliance/123/report2.pdf", size: 2048 },
				{ name: "reports/compliance/123/orphaned.pdf", size: 512 },
			];
			const mockDbFiles = [
				{ filePath: "reports/compliance/123/report1.pdf" },
				{ filePath: "reports/compliance/123/report2.pdf" },
			];

			const mockJob = {
				data: {
					type: "CLEANUP_ORPHANED_FILES",
					dryRun: false,
				},
			} as Job<StorageMaintenanceJobData>;

			(db.tenant.findMany as any).mockResolvedValue(mockTenants);
			(listFiles as any).mockResolvedValue(mockStorageFiles);
			(db.generatedReport.findMany as any).mockResolvedValue(mockDbFiles);
			(deleteFile as any).mockResolvedValue({});

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result.results[0]).toEqual({
				tenantId: 1,
				tenantName: "Tenant 1",
				deletedFiles: 1,
				bytesFreed: 512,
			});

			expect(deleteFile).toHaveBeenCalledWith(
				1,
				"reports/compliance/123/orphaned.pdf",
			);
		});

		it("should perform dry run for orphaned files", async () => {
			const mockTenants = [{ id: 1, name: "Tenant 1" }];
			const mockStorageFiles = [
				{ name: "reports/compliance/123/orphaned1.pdf", size: 1024 },
				{ name: "reports/compliance/123/orphaned2.pdf", size: 2048 },
			];

			const mockJob = {
				data: {
					type: "CLEANUP_ORPHANED_FILES",
					dryRun: true,
				},
			} as Job<StorageMaintenanceJobData>;

			(db.tenant.findMany as any).mockResolvedValue(mockTenants);
			(listFiles as any).mockResolvedValue(mockStorageFiles);
			(db.generatedReport.findMany as any).mockResolvedValue([]);

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result.dryRun).toBe(true);
			expect(result.results[0]).toEqual({
				tenantId: 1,
				tenantName: "Tenant 1",
				orphanedFiles: 2,
				wouldFreeBytes: 3072,
				files: [
					{ name: "reports/compliance/123/orphaned1.pdf", size: 1024 },
					{ name: "reports/compliance/123/orphaned2.pdf", size: 2048 },
				],
			});

			expect(deleteFile).not.toHaveBeenCalled();
		});

		it("should handle file deletion errors gracefully", async () => {
			const mockTenants = [{ id: 1, name: "Tenant 1" }];
			const mockStorageFiles = [
				{ name: "reports/compliance/123/orphaned1.pdf", size: 1024 },
				{ name: "reports/compliance/123/orphaned2.pdf", size: 2048 },
			];

			const mockJob = {
				data: {
					type: "CLEANUP_ORPHANED_FILES",
					dryRun: false,
				},
			} as Job<StorageMaintenanceJobData>;

			(db.tenant.findMany as any).mockResolvedValue(mockTenants);
			(listFiles as any).mockResolvedValue(mockStorageFiles);
			(db.generatedReport.findMany as any).mockResolvedValue([]);
			(deleteFile as any)
				.mockResolvedValueOnce({})
				.mockRejectedValueOnce(new Error("Delete failed"));

			const result = await processStorageMaintenanceJob(mockJob);

			expect(result.results[0].deletedFiles).toBe(1);
			expect(result.results[0].bytesFreed).toBe(1024);
		});
	});

	describe("Error Handling", () => {
		it("should throw error for unknown job type", async () => {
			const mockJob = {
				data: {
					type: "UNKNOWN_TYPE" as any,
				},
			} as Job<StorageMaintenanceJobData>;

			await expect(processStorageMaintenanceJob(mockJob)).rejects.toThrow(
				"Unknown storage maintenance job type: UNKNOWN_TYPE",
			);
		});

		it("should re-throw errors from job handlers", async () => {
			const mockJob = {
				data: {
					type: "CLEANUP_EXPIRED_REPORTS",
				},
			} as Job<StorageMaintenanceJobData>;

			(db.tenant.findMany as any).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(processStorageMaintenanceJob(mockJob)).rejects.toThrow(
				"Database error",
			);
		});
	});
});
