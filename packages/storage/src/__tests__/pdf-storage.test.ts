/**
 * PDF Storage Service Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { minioClient } from "../minio-client";
import {
	cleanupExpiredReports,
	generatePdfDownloadUrl,
	listClientPdfReports,
	retrievePdfReport,
	storePdfReport,
} from "../pdf-storage";

// Mock MinIO client
vi.mock("../minio-client", () => ({
	minioClient: {
		bucketExists: vi.fn(),
		putObject: vi.fn(),
		presignedGetObject: vi.fn(),
		statObject: vi.fn(),
		getObject: vi.fn(),
		listObjects: vi.fn(),
		removeObject: vi.fn(),
	},
	getTenantBucketName: vi.fn(
		(tenantId: number) => `tenant-${tenantId}-documents`,
	),
}));

// Mock crypto module
vi.mock("node:crypto", () => ({
	createHash: vi.fn(() => ({
		update: vi.fn(() => ({
			digest: vi.fn(() => "mock-checksum-sha256"),
		})),
	})),
}));

describe("PDF Storage Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("storePdfReport", () => {
		it("should store PDF report successfully", async () => {
			const mockPdfBuffer = Buffer.from("mock-pdf-content");
			const mockDownloadUrl = "https://minio.example.com/presigned-url";

			(minioClient.bucketExists as any).mockResolvedValue(true);
			(minioClient.putObject as any).mockResolvedValue({});
			(minioClient.presignedGetObject as any).mockResolvedValue(
				mockDownloadUrl,
			);

			const result = await storePdfReport(
				1, // tenantId
				123, // clientId
				"compliance",
				mockPdfBuffer,
				"report-123",
				"user-456",
			);

			expect(minioClient.bucketExists).toHaveBeenCalledWith(
				"tenant-1-documents",
			);
			expect(minioClient.putObject).toHaveBeenCalledWith(
				"tenant-1-documents",
				expect.stringMatching(
					/^reports\/compliance\/123\/compliance-123-\d+-report-123\.pdf$/,
				),
				mockPdfBuffer,
				mockPdfBuffer.length,
				expect.objectContaining({
					"Content-Type": "application/pdf",
					"X-Report-Type": "compliance",
					"X-Client-Id": "123",
					"X-Generated-By": "user-456",
					"X-Checksum-SHA256": "mock-checksum-sha256",
				}),
			);

			expect(result).toEqual({
				filePath: expect.stringMatching(
					/^reports\/compliance\/123\/compliance-123-\d+-report-123\.pdf$/,
				),
				fileSize: mockPdfBuffer.length,
				checksum: "mock-checksum-sha256",
				downloadUrl: mockDownloadUrl,
			});
		});

		it("should throw error when bucket does not exist", async () => {
			(minioClient.bucketExists as any).mockResolvedValue(false);

			await expect(
				storePdfReport(
					1,
					123,
					"compliance",
					Buffer.from("test"),
					"report-123",
					"user-456",
				),
			).rejects.toThrow("Bucket does not exist for tenant 1");
		});

		it("should handle storage errors gracefully", async () => {
			(minioClient.bucketExists as any).mockResolvedValue(true);
			(minioClient.putObject as any).mockRejectedValue(
				new Error("Storage error"),
			);

			await expect(
				storePdfReport(
					1,
					123,
					"compliance",
					Buffer.from("test"),
					"report-123",
					"user-456",
				),
			).rejects.toThrow("Failed to store PDF report");
		});
	});

	describe("retrievePdfReport", () => {
		it("should retrieve PDF report successfully", async () => {
			const mockBuffer = Buffer.from("mock-pdf-content");
			const mockMetadata = {
				size: 1024,
				lastModified: new Date(),
				metaData: {},
				etag: "mock-etag",
			};

			const mockStream = async function* () {
				yield mockBuffer;
			};

			(minioClient.statObject as any).mockResolvedValue(mockMetadata);
			(minioClient.getObject as any).mockResolvedValue(mockStream());

			const result = await retrievePdfReport(
				1,
				"reports/compliance/123/test-report.pdf",
			);

			expect(result.buffer).toEqual(mockBuffer);
			expect(result.metadata).toEqual(mockMetadata);
		});

		it("should validate file integrity when checksum provided", async () => {
			const mockBuffer = Buffer.from("mock-pdf-content");
			const mockStream = async function* () {
				yield mockBuffer;
			};

			(minioClient.statObject as any).mockResolvedValue({});
			(minioClient.getObject as any).mockResolvedValue(mockStream());

			// Should succeed with correct checksum
			await expect(
				retrievePdfReport(
					1,
					"reports/compliance/123/test-report.pdf",
					"mock-checksum-sha256",
				),
			).resolves.toBeDefined();

			// Should fail with incorrect checksum
			await expect(
				retrievePdfReport(
					1,
					"reports/compliance/123/test-report.pdf",
					"wrong-checksum",
				),
			).rejects.toThrow("Failed to retrieve PDF report");
		});
	});

	describe("generatePdfDownloadUrl", () => {
		it("should generate download URL successfully", async () => {
			const mockUrl = "https://minio.example.com/presigned-url";
			(minioClient.presignedGetObject as any).mockResolvedValue(mockUrl);

			const result = await generatePdfDownloadUrl(
				1,
				"reports/compliance/123/test-report.pdf",
			);

			expect(result).toBe(mockUrl);
			expect(minioClient.presignedGetObject).toHaveBeenCalledWith(
				"tenant-1-documents",
				"reports/compliance/123/test-report.pdf",
				3600,
			);
		});

		it("should handle custom expiry time", async () => {
			const mockUrl = "https://minio.example.com/presigned-url";
			(minioClient.presignedGetObject as any).mockResolvedValue(mockUrl);

			await generatePdfDownloadUrl(
				1,
				"reports/compliance/123/test-report.pdf",
				7200,
			);

			expect(minioClient.presignedGetObject).toHaveBeenCalledWith(
				"tenant-1-documents",
				"reports/compliance/123/test-report.pdf",
				7200,
			);
		});
	});

	describe("listClientPdfReports", () => {
		it("should list PDF reports for client", async () => {
			const mockObjects = [
				{
					name: "reports/compliance/123/compliance-123-1234567890-report-1.pdf",
					size: 1024,
					lastModified: new Date("2024-01-01"),
				},
				{
					name: "reports/tax_filing/123/tax-123-1234567891-report-2.pdf",
					size: 2048,
					lastModified: new Date("2024-01-02"),
				},
				{
					name: "reports/compliance/456/compliance-456-1234567892-report-3.pdf", // Different client
					size: 512,
					lastModified: new Date("2024-01-03"),
				},
			];

			const mockStream = {
				[Symbol.asyncIterator]: async function* () {
					for (const obj of mockObjects) {
						yield obj;
					}
				},
			};

			(minioClient.listObjects as any).mockReturnValue(mockStream);

			const result = await listClientPdfReports(1, 123);

			expect(result).toHaveLength(2);
			expect(result[0]?.reportType).toBe("tax_filing"); // Sorted by lastModified desc
			expect(result[1]?.reportType).toBe("compliance");
			expect(result.every((r) => r.name.includes("/123/"))).toBe(true);
		});

		it("should filter by report type when provided", async () => {
			const mockObjects = [
				{
					name: "reports/compliance/123/compliance-123-1234567890-report-1.pdf",
					size: 1024,
					lastModified: new Date("2024-01-01"),
				},
			];

			const mockStream = {
				[Symbol.asyncIterator]: async function* () {
					for (const obj of mockObjects) {
						yield obj;
					}
				},
			};

			(minioClient.listObjects as any).mockReturnValue(mockStream);

			await listClientPdfReports(1, 123, "compliance");

			expect(minioClient.listObjects).toHaveBeenCalledWith(
				"tenant-1-documents",
				"reports/compliance/123/",
				true,
			);
		});
	});

	describe("cleanupExpiredReports", () => {
		it("should delete expired reports", async () => {
			const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
			const expiredDate = new Date(cutoffDate.getTime() - 24 * 60 * 60 * 1000);
			const recentDate = new Date();

			const mockObjects = [
				{
					name: "reports/compliance/123/expired-report.pdf",
					size: 1024,
					lastModified: expiredDate,
				},
				{
					name: "reports/compliance/123/recent-report.pdf",
					size: 2048,
					lastModified: recentDate,
				},
			];

			const mockStream = {
				[Symbol.asyncIterator]: async function* () {
					for (const obj of mockObjects) {
						yield obj;
					}
				},
			};

			(minioClient.listObjects as any).mockReturnValue(mockStream);
			(minioClient.removeObject as any).mockResolvedValue({});

			const result = await cleanupExpiredReports(1, 365);

			expect(result.deletedCount).toBe(1);
			expect(result.bytesFreed).toBe(1024);
			expect(minioClient.removeObject).toHaveBeenCalledTimes(1);
			expect(minioClient.removeObject).toHaveBeenCalledWith(
				"tenant-1-documents",
				"reports/compliance/123/expired-report.pdf",
			);
		});

		it("should handle deletion errors gracefully", async () => {
			const expiredDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

			const mockObjects = [
				{
					name: "reports/compliance/123/expired-report-1.pdf",
					size: 1024,
					lastModified: expiredDate,
				},
				{
					name: "reports/compliance/123/expired-report-2.pdf",
					size: 2048,
					lastModified: expiredDate,
				},
			];

			const mockStream = {
				[Symbol.asyncIterator]: async function* () {
					for (const obj of mockObjects) {
						yield obj;
					}
				},
			};

			(minioClient.listObjects as any).mockReturnValue(mockStream);
			(minioClient.removeObject as any)
				.mockResolvedValueOnce({}) // First deletion succeeds
				.mockRejectedValueOnce(new Error("Deletion failed")); // Second fails

			const result = await cleanupExpiredReports(1, 365);

			expect(result.deletedCount).toBe(1); // Only one successful deletion
			expect(result.bytesFreed).toBe(1024);
		});
	});
});
