// Storage Service - MinIO operations with tenant isolation
// All operations enforce tenant isolation via bucket naming: tenant-{tenantId}-documents

import type { BucketItemStat } from "minio";
import {
	DOWNLOAD_URL_EXPIRY,
	getTenantBucketName,
	minioClient,
	UPLOAD_URL_EXPIRY,
} from "./minio-client";

/**
 * Ensure bucket exists for a tenant
 * Creates bucket if it doesn't exist and sets private policy
 */
export async function ensureBucket(tenantId: number): Promise<void> {
	const bucketName = getTenantBucketName(tenantId);

	try {
		const exists = await minioClient.bucketExists(bucketName);

		if (!exists) {
			await minioClient.makeBucket(bucketName, "us-east-1");
			console.log(`Created bucket for tenant: ${bucketName}`);

			// Set bucket to private (default - no public access)
			const policy = {
				Version: "2012-10-17",
				Statement: [
					{
						Effect: "Deny",
						Principal: { AWS: ["*"] },
						Action: ["s3:GetObject"],
						Resource: [`arn:aws:s3:::${bucketName}/*`],
					},
				],
			};

			await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
			console.log(`Set private policy for bucket: ${bucketName}`);
		}
	} catch (error) {
		console.error(`Failed to ensure bucket exists: ${bucketName}`, error);
		throw new Error(`Failed to create or access bucket for tenant ${tenantId}`);
	}
}

/**
 * Generate presigned URL for uploading a file
 * URL expires in 15 minutes
 */
export async function generatePresignedUploadUrl(
	tenantId: number,
	fileName: string,
	_contentType?: string,
): Promise<{ uploadUrl: string; filePath: string }> {
	const bucketName = getTenantBucketName(tenantId);

	// Ensure bucket exists
	await ensureBucket(tenantId);

	// Generate unique file path with timestamp
	const timestamp = Date.now();
	const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
	const filePath = `documents/${timestamp}-${sanitizedFileName}`;

	try {
		// Generate presigned PUT URL
		const uploadUrl = await minioClient.presignedPutObject(
			bucketName,
			filePath,
			UPLOAD_URL_EXPIRY,
		);

		console.log("Generated presigned upload URL", {
			tenantId,
			fileName,
			filePath,
			expiresIn: UPLOAD_URL_EXPIRY,
		});

		return { uploadUrl, filePath };
	} catch (error) {
		console.error("Failed to generate presigned upload URL", error, {
			tenantId,
			fileName,
		});
		throw new Error("Failed to generate upload URL");
	}
}

/**
 * Generate presigned URL for downloading a file
 * URL expires in 1 hour
 */
export async function generatePresignedDownloadUrl(
	tenantId: number,
	filePath: string,
): Promise<string> {
	const bucketName = getTenantBucketName(tenantId);

	try {
		const downloadUrl = await minioClient.presignedGetObject(
			bucketName,
			filePath,
			DOWNLOAD_URL_EXPIRY,
		);

		console.log("Generated presigned download URL", {
			tenantId,
			filePath,
			expiresIn: DOWNLOAD_URL_EXPIRY,
		});

		return downloadUrl;
	} catch (error) {
		console.error("Failed to generate presigned download URL", error, {
			tenantId,
			filePath,
		});
		throw new Error("Failed to generate download URL");
	}
}

/**
 * Upload file directly to MinIO (server-side upload)
 */
export async function uploadFile(
	tenantId: number,
	file: Buffer,
	fileName: string,
	metadata?: Record<string, string>,
): Promise<{ filePath: string; size: number }> {
	const bucketName = getTenantBucketName(tenantId);

	// Ensure bucket exists
	await ensureBucket(tenantId);

	// Generate unique file path
	const timestamp = Date.now();
	const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
	const filePath = `documents/${timestamp}-${sanitizedFileName}`;

	try {
		const metaData = {
			"Content-Type": metadata?.contentType || "application/octet-stream",
			...metadata,
		};

		await minioClient.putObject(
			bucketName,
			filePath,
			file,
			file.length,
			metaData,
		);

		console.log("Uploaded file to storage", {
			tenantId,
			fileName,
			filePath,
			size: file.length,
		});

		return { filePath, size: file.length };
	} catch (error) {
		console.error("Failed to upload file", error, {
			tenantId,
			fileName,
		});
		throw new Error("Failed to upload file");
	}
}

/**
 * Delete file from storage
 */
export async function deleteFile(
	tenantId: number,
	filePath: string,
): Promise<void> {
	const bucketName = getTenantBucketName(tenantId);

	try {
		await minioClient.removeObject(bucketName, filePath);
		console.log("Deleted file from storage", { tenantId, filePath });
	} catch (error) {
		console.error("Failed to delete file", error, { tenantId, filePath });
		throw new Error("Failed to delete file");
	}
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
	tenantId: number,
	filePath: string,
): Promise<BucketItemStat> {
	const bucketName = getTenantBucketName(tenantId);

	try {
		const stat = await minioClient.statObject(bucketName, filePath);
		console.log("Retrieved file metadata", { tenantId, filePath });
		return stat;
	} catch (error) {
		console.error("Failed to get file metadata", error, {
			tenantId,
			filePath,
		});
		throw new Error("File not found or inaccessible");
	}
}

/**
 * List files in bucket (with optional prefix filter)
 */
export async function listFiles(
	tenantId: number,
	prefix?: string,
): Promise<Array<{ name: string; size: number; lastModified: Date }>> {
	const bucketName = getTenantBucketName(tenantId);

	try {
		const objectsStream = minioClient.listObjects(
			bucketName,
			prefix || "",
			true, // recursive
		);

		const files: Array<{ name: string; size: number; lastModified: Date }> = [];

		for await (const obj of objectsStream) {
			if (obj.name) {
				files.push({
					name: obj.name,
					size: obj.size,
					lastModified: obj.lastModified,
				});
			}
		}

		console.log("Listed files in bucket", {
			tenantId,
			prefix,
			count: files.length,
		});

		return files;
	} catch (error) {
		console.error("Failed to list files", error, { tenantId, prefix });
		throw new Error("Failed to list files");
	}
}

/**
 * Check if file exists
 */
export async function fileExists(
	tenantId: number,
	filePath: string,
): Promise<boolean> {
	try {
		await getFileMetadata(tenantId, filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get bucket statistics
 */
export async function getBucketStats(tenantId: number): Promise<{
	totalFiles: number;
	totalSize: number;
}> {
	const files = await listFiles(tenantId);

	const totalSize = files.reduce((sum, file) => sum + file.size, 0);

	return {
		totalFiles: files.length,
		totalSize,
	};
}
