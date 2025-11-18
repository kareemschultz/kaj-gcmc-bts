/**
 * PDF Storage Service
 *
 * Handles storage and retrieval of generated PDF reports
 * Implements archival system for compliance and audit requirements
 */

import type { BucketItemStat } from "minio";
import { getTenantBucketName, minioClient } from "./minio-client";

export interface StoredPdfReport {
	id: string;
	tenantId: number;
	clientId: number;
	reportType: string;
	filePath: string;
	fileName: string;
	fileSize: number;
	checksum: string;
	generatedBy: string;
	generatedAt: Date;
	expiresAt: Date;
}

export interface PdfStorageResult {
	filePath: string;
	fileSize: number;
	checksum: string;
	downloadUrl: string;
}

/**
 * Store PDF report in MinIO with proper organization
 * Structure: tenant-{tenantId}-documents/reports/{reportType}/{clientId}/{timestamp}-{reportId}.pdf
 */
export async function storePdfReport(
	tenantId: number,
	clientId: number,
	reportType: string,
	pdfBuffer: Buffer,
	reportId: string,
	generatedBy: string,
): Promise<PdfStorageResult> {
	const bucketName = getTenantBucketName(tenantId);

	// Ensure bucket exists
	const exists = await minioClient.bucketExists(bucketName);
	if (!exists) {
		throw new Error(`Bucket does not exist for tenant ${tenantId}`);
	}

	// Generate organized file path
	const timestamp = Date.now();
	const fileName = `${reportType}-${clientId}-${timestamp}-${reportId}.pdf`;
	const filePath = `reports/${reportType}/${clientId}/${fileName}`;

	// Calculate file checksum for integrity
	const crypto = await import("node:crypto");
	const checksum = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

	try {
		// Store PDF in MinIO with metadata
		const metaData = {
			"Content-Type": "application/pdf",
			"X-Report-Type": reportType,
			"X-Client-Id": clientId.toString(),
			"X-Generated-By": generatedBy,
			"X-Generated-At": new Date().toISOString(),
			"X-Checksum-SHA256": checksum,
		};

		await minioClient.putObject(
			bucketName,
			filePath,
			pdfBuffer,
			pdfBuffer.length,
			metaData,
		);

		// Generate download URL (1 hour expiry)
		const downloadUrl = await minioClient.presignedGetObject(
			bucketName,
			filePath,
			3600, // 1 hour
		);

		console.log("PDF report stored successfully", {
			tenantId,
			clientId,
			reportType,
			filePath,
			fileSize: pdfBuffer.length,
			checksum,
		});

		return {
			filePath,
			fileSize: pdfBuffer.length,
			checksum,
			downloadUrl,
		};
	} catch (error) {
		console.error("Failed to store PDF report", error, {
			tenantId,
			clientId,
			reportType,
			filePath,
		});
		throw new Error("Failed to store PDF report");
	}
}

/**
 * Retrieve PDF report with integrity validation
 */
export async function retrievePdfReport(
	tenantId: number,
	filePath: string,
	expectedChecksum?: string,
): Promise<{ buffer: Buffer; metadata: BucketItemStat }> {
	const bucketName = getTenantBucketName(tenantId);

	try {
		// Get file metadata
		const metadata = await minioClient.statObject(bucketName, filePath);

		// Stream file content
		const stream = await minioClient.getObject(bucketName, filePath);

		// Convert stream to buffer
		const chunks: Buffer[] = [];
		for await (const chunk of stream) {
			chunks.push(chunk);
		}
		const buffer = Buffer.concat(chunks);

		// Validate integrity if checksum provided
		if (expectedChecksum) {
			const crypto = await import("node:crypto");
			const actualChecksum = crypto
				.createHash("sha256")
				.update(buffer)
				.digest("hex");

			if (actualChecksum !== expectedChecksum) {
				throw new Error(
					`File integrity check failed: expected ${expectedChecksum}, got ${actualChecksum}`,
				);
			}
		}

		console.log("PDF report retrieved successfully", {
			tenantId,
			filePath,
			fileSize: buffer.length,
			integrityVerified: !!expectedChecksum,
		});

		return { buffer, metadata };
	} catch (error) {
		console.error("Failed to retrieve PDF report", error, {
			tenantId,
			filePath,
		});
		throw new Error("Failed to retrieve PDF report");
	}
}

/**
 * Generate download URL for stored PDF report
 */
export async function generatePdfDownloadUrl(
	tenantId: number,
	filePath: string,
	expirySeconds = 3600, // 1 hour default
): Promise<string> {
	const bucketName = getTenantBucketName(tenantId);

	try {
		const downloadUrl = await minioClient.presignedGetObject(
			bucketName,
			filePath,
			expirySeconds,
		);

		console.log("Generated PDF download URL", {
			tenantId,
			filePath,
			expiresIn: expirySeconds,
		});

		return downloadUrl;
	} catch (error) {
		console.error("Failed to generate PDF download URL", error, {
			tenantId,
			filePath,
		});
		throw new Error("Failed to generate download URL");
	}
}

/**
 * List stored PDF reports for a client
 */
export async function listClientPdfReports(
	tenantId: number,
	clientId: number,
	reportType?: string,
): Promise<
	Array<{ name: string; size: number; lastModified: Date; reportType: string }>
> {
	const bucketName = getTenantBucketName(tenantId);

	// Build prefix for client reports
	const basePrefix = "reports/";
	const prefix = reportType
		? `${basePrefix}${reportType}/${clientId}/`
		: `${basePrefix}`;

	try {
		const objectsStream = minioClient.listObjects(bucketName, prefix, true);
		const reports: Array<{
			name: string;
			size: number;
			lastModified: Date;
			reportType: string;
		}> = [];

		for await (const obj of objectsStream) {
			if (obj.name?.includes(`/${clientId}/`) && obj.name.endsWith(".pdf")) {
				// Extract report type from path: reports/{reportType}/{clientId}/{filename}
				const pathParts = obj.name.split("/");
				const extractedReportType = pathParts[1] || "unknown";

				reports.push({
					name: obj.name,
					size: obj.size,
					lastModified: obj.lastModified,
					reportType: extractedReportType,
				});
			}
		}

		console.log("Listed PDF reports for client", {
			tenantId,
			clientId,
			reportType,
			count: reports.length,
		});

		return reports.sort(
			(a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
		);
	} catch (error) {
		console.error("Failed to list PDF reports", error, {
			tenantId,
			clientId,
			reportType,
		});
		throw new Error("Failed to list PDF reports");
	}
}

/**
 * Delete expired PDF reports based on retention policy
 */
export async function cleanupExpiredReports(
	tenantId: number,
	retentionDays = 365, // Default 1 year retention
): Promise<{ deletedCount: number; bytesFreed: number }> {
	const bucketName = getTenantBucketName(tenantId);
	const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

	try {
		const objectsStream = minioClient.listObjects(bucketName, "reports/", true);
		const toDelete: { name: string; size: number }[] = [];

		for await (const obj of objectsStream) {
			if (obj.name && obj.lastModified < cutoffDate) {
				toDelete.push({ name: obj.name, size: obj.size });
			}
		}

		// Delete expired reports
		let deletedCount = 0;
		let bytesFreed = 0;

		for (const obj of toDelete) {
			try {
				await minioClient.removeObject(bucketName, obj.name);
				deletedCount++;
				bytesFreed += obj.size;
			} catch (error) {
				console.error(`Failed to delete expired report: ${obj.name}`, error);
			}
		}

		console.log("Cleaned up expired PDF reports", {
			tenantId,
			retentionDays,
			deletedCount,
			bytesFreed,
		});

		return { deletedCount, bytesFreed };
	} catch (error) {
		console.error("Failed to cleanup expired reports", error, {
			tenantId,
			retentionDays,
		});
		throw new Error("Failed to cleanup expired reports");
	}
}

/**
 * Get storage statistics for PDF reports
 */
export async function getPdfStorageStats(tenantId: number): Promise<{
	totalReports: number;
	totalSize: number;
	reportsByType: Record<string, number>;
	oldestReport: Date | null;
	newestReport: Date | null;
}> {
	const bucketName = getTenantBucketName(tenantId);

	try {
		const objectsStream = minioClient.listObjects(bucketName, "reports/", true);

		let totalReports = 0;
		let totalSize = 0;
		const reportsByType: Record<string, number> = {};
		let oldestReport: Date | null = null;
		let newestReport: Date | null = null;

		for await (const obj of objectsStream) {
			if (obj.name?.endsWith(".pdf")) {
				totalReports++;
				totalSize += obj.size;

				// Extract report type
				const pathParts = obj.name.split("/");
				const reportType = pathParts[1] || "unknown";
				reportsByType[reportType] = (reportsByType[reportType] || 0) + 1;

				// Track oldest and newest
				if (!oldestReport || obj.lastModified < oldestReport) {
					oldestReport = obj.lastModified;
				}
				if (!newestReport || obj.lastModified > newestReport) {
					newestReport = obj.lastModified;
				}
			}
		}

		return {
			totalReports,
			totalSize,
			reportsByType,
			oldestReport,
			newestReport,
		};
	} catch (error) {
		console.error("Failed to get PDF storage stats", error, { tenantId });
		throw new Error("Failed to get storage statistics");
	}
}
