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
 * Enhanced filename sanitization with better security
 */
export function sanitizeFileName(fileName: string): string {
	// Remove path separators and null bytes
	let sanitized = fileName
		.replace(/\0/g, "") // null bytes
		.replace(/[/\\]/g, "") // path separators
		.replace(/\.\./g, "") // parent directory references
		.replace(/^\.+/, ""); // leading dots

	// Whitelist: alphanumeric, dots, dashes, underscores
	sanitized = sanitized.replace(/[^\w.-]/g, "_");

	// Ensure it doesn't exceed filesystem limits
	if (sanitized.length > 255) {
		const extension = sanitized.substring(sanitized.lastIndexOf("."));
		const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf("."));
		sanitized = nameWithoutExt.substring(0, 255 - extension.length) + extension;
	}

	// Reject empty filenames
	if (!sanitized || sanitized === "." || sanitized === "..") {
		throw new Error("Invalid filename after sanitization");
	}

	return sanitized;
}

/**
 * Validate file content against declared MIME type using magic bytes
 */
export async function validateFileContent(
	file: Buffer,
	declaredMimeType: string,
): Promise<boolean> {
	// Check file signatures (magic bytes) for common types
	const signatures: Record<string, number[]> = {
		"application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
		"image/jpeg": [0xff, 0xd8, 0xff],
		"image/png": [0x89, 0x50, 0x4e, 0x47],
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
			0x50, 0x4b,
		], // ZIP-based
		"application/vnd.ms-excel": [0xd0, 0xcf, 0x11, 0xe0], // OLE
		"text/plain": [], // Allow any for text files
		"text/csv": [], // Allow any for CSV files
	};

	const signature = signatures[declaredMimeType];
	if (!signature || signature.length === 0) {
		// For unsupported types or text files, allow
		return true;
	}

	// Check if file starts with expected signature
	if (file.length < signature.length) {
		return false;
	}

	for (let i = 0; i < signature.length; i++) {
		if (file[i] !== signature[i]) {
			return false;
		}
	}

	return true;
}

/**
 * Upload file directly to MinIO (server-side upload) with enhanced validation
 */
export async function uploadFile(
	tenantId: number,
	file: Buffer,
	fileName: string,
	metadata?: Record<string, string>,
): Promise<{ filePath: string; size: number; checksum: string }> {
	const bucketName = getTenantBucketName(tenantId);

	// Ensure bucket exists
	await ensureBucket(tenantId);

	// Enhanced filename sanitization
	const sanitizedFileName = sanitizeFileName(fileName);

	// Generate unique file path with better organization
	const timestamp = Date.now();
	const filePath = `documents/${timestamp}-${sanitizedFileName}`;

	// Calculate file checksum for integrity
	const crypto = await import("crypto");
	const checksum = crypto.createHash("sha256").update(file).digest("hex");

	// Validate file content if MIME type provided
	if (metadata?.contentType) {
		const isValid = await validateFileContent(file, metadata.contentType);
		if (!isValid) {
			throw new Error(
				`File content does not match declared MIME type: ${metadata.contentType}`,
			);
		}
	}

	try {
		const metaData = {
			"Content-Type": metadata?.contentType || "application/octet-stream",
			"X-File-Checksum-SHA256": checksum,
			"X-Original-Filename": fileName,
			"X-Upload-Timestamp": new Date().toISOString(),
			...metadata,
		};

		await minioClient.putObject(
			bucketName,
			filePath,
			file,
			file.length,
			metaData,
		);

		console.log("Uploaded file to storage with integrity check", {
			tenantId,
			fileName: sanitizedFileName,
			filePath,
			size: file.length,
			checksum,
		});

		return { filePath, size: file.length, checksum };
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
