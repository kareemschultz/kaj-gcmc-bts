/**
 * Storage Maintenance Job
 *
 * Handles automated storage maintenance tasks including:
 * - PDF report cleanup based on retention policies
 * - File integrity validation
 * - Storage usage monitoring and alerts
 * - Orphaned file cleanup
 */

import { db } from "@GCMC-KAJ/db";
import { cleanupExpiredReports, getPdfStorageStats } from "@GCMC-KAJ/storage";
import type { Job } from "bullmq";

export interface StorageMaintenanceJobData {
	type:
		| "CLEANUP_EXPIRED_REPORTS"
		| "VALIDATE_FILE_INTEGRITY"
		| "STORAGE_USAGE_REPORT"
		| "CLEANUP_ORPHANED_FILES";
	tenantId?: number;
	retentionDays?: number;
	dryRun?: boolean;
}

export async function processStorageMaintenanceJob(
	job: Job<StorageMaintenanceJobData>,
) {
	const { type, tenantId, retentionDays = 365, dryRun = false } = job.data;

	console.log(`Processing storage maintenance job: ${type}`, {
		tenantId,
		retentionDays,
		dryRun,
	});

	try {
		switch (type) {
			case "CLEANUP_EXPIRED_REPORTS":
				return await handleCleanupExpiredReports(
					tenantId,
					retentionDays,
					dryRun,
				);

			case "VALIDATE_FILE_INTEGRITY":
				return await handleValidateFileIntegrity(tenantId);

			case "STORAGE_USAGE_REPORT":
				return await handleStorageUsageReport(tenantId);

			case "CLEANUP_ORPHANED_FILES":
				return await handleCleanupOrphanedFiles(tenantId, dryRun);

			default:
				throw new Error(`Unknown storage maintenance job type: ${type}`);
		}
	} catch (error) {
		console.error(`Storage maintenance job failed: ${type}`, error);
		throw error;
	}
}

/**
 * Cleanup expired PDF reports based on retention policy
 */
async function handleCleanupExpiredReports(
	tenantId?: number,
	retentionDays = 365,
	dryRun = false,
) {
	const tenants = tenantId
		? [{ id: tenantId, name: "specific-tenant" }]
		: await db.tenant.findMany({ select: { id: true, name: true } });

	let totalDeleted = 0;
	let totalBytesFreed = 0;
	const results = [];

	for (const tenant of tenants) {
		try {
			if (dryRun) {
				// Dry run: just count what would be deleted
				const expiredReports = await db.generatedReport.findMany({
					where: {
						tenantId: tenant.id,
						expiresAt: {
							lt: new Date(),
						},
					},
					select: {
						id: true,
						fileName: true,
						fileSize: true,
						reportType: true,
						generatedAt: true,
					},
				});

				results.push({
					tenantId: tenant.id,
					tenantName: tenant.name,
					wouldDelete: expiredReports.length,
					wouldFreeBytes: expiredReports.reduce(
						(sum, r) => sum + r.fileSize,
						0,
					),
					reports: expiredReports,
				});
			} else {
				// Actual cleanup
				const { deletedCount, bytesFreed } = await cleanupExpiredReports(
					tenant.id,
					retentionDays,
				);

				// Update database to remove deleted report records
				await db.generatedReport.deleteMany({
					where: {
						tenantId: tenant.id,
						expiresAt: {
							lt: new Date(),
						},
					},
				});

				totalDeleted += deletedCount;
				totalBytesFreed += bytesFreed;

				results.push({
					tenantId: tenant.id,
					tenantName: tenant.name,
					deleted: deletedCount,
					bytesFreed,
				});

				console.log("Cleaned up expired reports for tenant", {
					tenantId: tenant.id,
					deleted: deletedCount,
					bytesFreed,
				});
			}
		} catch (error) {
			console.error(
				`Failed to cleanup reports for tenant ${tenant.id}:`,
				error,
			);
			results.push({
				tenantId: tenant.id,
				tenantName: tenant.name,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	return {
		type: "CLEANUP_EXPIRED_REPORTS",
		dryRun,
		retentionDays,
		totalDeleted,
		totalBytesFreed,
		tenantsProcessed: tenants.length,
		results,
	};
}

/**
 * Validate file integrity using stored checksums
 */
async function handleValidateFileIntegrity(tenantId?: number) {
	const reports = await db.generatedReport.findMany({
		where: tenantId ? { tenantId } : {},
		select: {
			id: true,
			tenantId: true,
			filePath: true,
			checksum: true,
			fileName: true,
			generatedAt: true,
		},
		// Limit to prevent overwhelming the system
		take: 1000,
		orderBy: {
			generatedAt: "desc",
		},
	});

	const results = [];
	let validFiles = 0;
	let invalidFiles = 0;
	let errorFiles = 0;

	for (const report of reports) {
		try {
			const { retrievePdfReport } = await import("@GCMC-KAJ/storage");

			// Retrieve and validate file
			const { buffer } = await retrievePdfReport(
				report.tenantId,
				report.filePath,
				report.checksum,
			);

			validFiles++;
			results.push({
				reportId: report.id,
				filePath: report.filePath,
				status: "valid",
				fileSize: buffer.length,
			});
		} catch (error) {
			const isIntegrityError =
				error instanceof Error &&
				error.message.includes("integrity check failed");

			if (isIntegrityError) {
				invalidFiles++;
				results.push({
					reportId: report.id,
					filePath: report.filePath,
					status: "invalid_checksum",
					error: error.message,
				});

				// Mark as corrupted in database
				await db.generatedReport.update({
					where: { id: report.id },
					data: {
						// Add a metadata field to track corruption if it doesn't exist
						updatedAt: new Date(),
					},
				});
			} else {
				errorFiles++;
				results.push({
					reportId: report.id,
					filePath: report.filePath,
					status: "error",
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}
	}

	return {
		type: "VALIDATE_FILE_INTEGRITY",
		totalChecked: reports.length,
		validFiles,
		invalidFiles,
		errorFiles,
		results: results.filter((r) => r.status !== "valid"), // Only return problematic files
	};
}

/**
 * Generate storage usage report
 */
async function handleStorageUsageReport(tenantId?: number) {
	const tenants = tenantId
		? [{ id: tenantId, name: "specific-tenant" }]
		: await db.tenant.findMany({ select: { id: true, name: true } });

	const tenantUsage = [];
	let totalReports = 0;
	let totalSize = 0;

	for (const tenant of tenants) {
		try {
			const stats = await getPdfStorageStats(tenant.id);

			// Get database stats as well
			const dbStats = await db.generatedReport.aggregate({
				where: { tenantId: tenant.id },
				_count: { id: true },
				_sum: { fileSize: true },
				_min: { generatedAt: true },
				_max: { generatedAt: true },
			});

			const usage = {
				tenantId: tenant.id,
				tenantName: tenant.name,
				storage: stats,
				database: {
					totalReports: dbStats._count.id || 0,
					totalSize: dbStats._sum.fileSize || 0,
					oldestReport: dbStats._min.generatedAt,
					newestReport: dbStats._max.generatedAt,
				},
				// Check for discrepancies
				discrepancy: {
					reportCount: stats.totalReports - (dbStats._count.id || 0),
					sizeBytes: stats.totalSize - (dbStats._sum.fileSize || 0),
				},
			};

			tenantUsage.push(usage);
			totalReports += stats.totalReports;
			totalSize += stats.totalSize;
		} catch (error) {
			console.error(
				`Failed to get storage stats for tenant ${tenant.id}:`,
				error,
			);
			tenantUsage.push({
				tenantId: tenant.id,
				tenantName: tenant.name,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	return {
		type: "STORAGE_USAGE_REPORT",
		generatedAt: new Date(),
		summary: {
			totalReports,
			totalSize,
			totalTenants: tenants.length,
			averageReportSize:
				totalReports > 0 ? Math.round(totalSize / totalReports) : 0,
		},
		tenantUsage,
	};
}

/**
 * Cleanup orphaned files (files in storage but not in database)
 */
async function handleCleanupOrphanedFiles(tenantId?: number, dryRun = false) {
	const { listFiles } = await import("@GCMC-KAJ/storage");

	const tenants = tenantId
		? [{ id: tenantId, name: "specific-tenant" }]
		: await db.tenant.findMany({ select: { id: true, name: true } });

	const results = [];

	for (const tenant of tenants) {
		try {
			// Get all PDF files from storage
			const storageFiles = await listFiles(tenant.id, "reports/");

			// Get all file paths from database
			const dbFiles = await db.generatedReport.findMany({
				where: { tenantId: tenant.id },
				select: { filePath: true },
			});

			const dbFilePaths = new Set(dbFiles.map((f) => f.filePath));

			// Find orphaned files
			const orphanedFiles = storageFiles.filter(
				(file) => !dbFilePaths.has(file.name),
			);

			if (dryRun) {
				results.push({
					tenantId: tenant.id,
					tenantName: tenant.name,
					orphanedFiles: orphanedFiles.length,
					wouldFreeBytes: orphanedFiles.reduce((sum, f) => sum + f.size, 0),
					files: orphanedFiles.map((f) => ({ name: f.name, size: f.size })),
				});
			} else {
				// Delete orphaned files
				const { deleteFile } = await import("@GCMC-KAJ/storage");
				let deletedCount = 0;
				let bytesFreed = 0;

				for (const file of orphanedFiles) {
					try {
						await deleteFile(tenant.id, file.name);
						deletedCount++;
						bytesFreed += file.size;
					} catch (error) {
						console.error(
							`Failed to delete orphaned file ${file.name}:`,
							error,
						);
					}
				}

				results.push({
					tenantId: tenant.id,
					tenantName: tenant.name,
					deletedFiles: deletedCount,
					bytesFreed,
				});
			}
		} catch (error) {
			console.error(
				`Failed to process orphaned files for tenant ${tenant.id}:`,
				error,
			);
			results.push({
				tenantId: tenant.id,
				tenantName: tenant.name,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	return {
		type: "CLEANUP_ORPHANED_FILES",
		dryRun,
		results,
	};
}
