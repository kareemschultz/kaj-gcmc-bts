/**
 * Document Upload tRPC Router
 *
 * Handles document file upload operations via MinIO
 * Provides presigned URLs for secure uploads and downloads
 *
 * SECURITY: Implements file size limits, MIME type validation,
 * filename sanitization, and rate limiting to prevent abuse
 */

import prisma from "@GCMC-KAJ/db";
import {
	deleteFile,
	generatePresignedDownloadUrl,
	generatePresignedUploadUrl,
} from "@GCMC-KAJ/storage";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";
import { rateLimiters } from "../middleware/rateLimit";
import { VALIDATION_LIMITS } from "../validation/constants";
import { documentFileSchema, metadataSchema } from "../validation/schemas";

/**
 * Document Upload router
 */
export const documentUploadRouter = router({
	/**
	 * Request a presigned upload URL
	 * Requires: documents:create permission
	 * Rate limited: 20 uploads per minute
	 */
	requestUploadUrl: rbacProcedure("documents", "create")
		.use(rateLimiters.upload("requestUploadUrl"))
		.input(
			z.object({
				documentId: z.number(),
				...documentFileSchema.shape, // Validates fileName, fileType, fileSize with security limits
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify document belongs to tenant
			const document = await prisma.document.findUnique({
				where: {
					id: input.documentId,
					tenantId: ctx.tenantId,
				},
			});

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found",
				});
			}

			// Generate unique file key
			const timestamp = Date.now();
			const _fileKey = `documents/${document.clientId}/${input.documentId}/${timestamp}-${input.fileName}`;

			try {
				// Generate presigned upload URL
				const result = await generatePresignedUploadUrl(
					ctx.tenantId,
					input.fileName,
					input.fileType,
				);

				return {
					uploadUrl: result.uploadUrl,
					fileKey: result.filePath,
					expiresIn: 3600, // 1 hour
				};
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to generate upload URL",
					cause: error,
				});
			}
		}),

	/**
	 * Complete upload and create document version
	 * Requires: documents:create permission
	 * Rate limited: 20 uploads per minute
	 */
	completeUpload: rbacProcedure("documents", "create")
		.use(rateLimiters.upload("completeUpload"))
		.input(
			z.object({
				documentId: z.number(),
				fileKey: z.string().max(VALIDATION_LIMITS.STRING.MEDIUM),
				fileSize: z
					.number()
					.int()
					.min(1)
					.max(VALIDATION_LIMITS.FILE.MAX_SIZE_DOCUMENT),
				mimeType: z.string().max(100),
				issueDate: z.string().datetime().optional(),
				expiryDate: z.string().datetime().optional(),
				issuingAuthority: z
					.string()
					.max(VALIDATION_LIMITS.STRING.SMALL)
					.optional(),
				ocrText: z.string().max(VALIDATION_LIMITS.STRING.XLARGE).optional(),
				aiSummary: z.string().max(VALIDATION_LIMITS.STRING.LARGE).optional(),
				metadata: metadataSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify document belongs to tenant
			const document = await prisma.document.findUnique({
				where: {
					id: input.documentId,
					tenantId: ctx.tenantId,
				},
			});

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found",
				});
			}

			// Mark all existing versions as not latest
			await prisma.documentVersion.updateMany({
				where: {
					documentId: input.documentId,
					isLatest: true,
				},
				data: {
					isLatest: false,
				},
			});

			// Create new document version
			const version = await prisma.documentVersion.create({
				data: {
					documentId: input.documentId,
					fileUrl: input.fileKey,
					storageProvider: "minio",
					fileSize: input.fileSize,
					mimeType: input.mimeType,
					issueDate: input.issueDate ? new Date(input.issueDate) : null,
					expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
					issuingAuthority: input.issuingAuthority,
					ocrText: input.ocrText,
					aiSummary: input.aiSummary,
					metadata: input.metadata,
					uploadedById: ctx.user.id,
					isLatest: true,
				},
			});

			// Update document's latestVersionId
			await prisma.document.update({
				where: { id: input.documentId },
				data: {
					latestVersionId: version.id,
					// Update status based on expiry
					status: input.expiryDate
						? new Date(input.expiryDate) < new Date()
							? "expired"
							: "valid"
						: "valid",
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: document.clientId,
					entityType: "document_version",
					entityId: version.id,
					action: "create",
					changes: { created: { ...input, versionId: version.id } },
				},
			});

			return version;
		}),

	/**
	 * Get presigned download URL for a document version
	 * Requires: documents:view permission
	 */
	getDownloadUrl: rbacProcedure("documents", "view")
		.input(
			z.object({
				versionId: z.number(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Get version with document
			const version = await prisma.documentVersion.findUnique({
				where: { id: input.versionId },
				include: {
					document: true,
				},
			});

			if (!version) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document version not found",
				});
			}

			// Verify document belongs to tenant
			if (version.document.tenantId !== ctx.tenantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			try {
				// Generate presigned download URL
				const downloadUrl = await generatePresignedDownloadUrl(
					ctx.tenantId,
					version.fileUrl,
				);

				return {
					downloadUrl,
					fileName: version.fileUrl.split("/").pop() || "download",
					expiresIn: 3600, // 1 hour
				};
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to generate download URL",
					cause: error,
				});
			}
		}),

	/**
	 * Delete a document version file from storage
	 * Requires: documents:delete permission
	 */
	deleteVersion: rbacProcedure("documents", "delete")
		.input(
			z.object({
				versionId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Get version with document
			const version = await prisma.documentVersion.findUnique({
				where: { id: input.versionId },
				include: {
					document: true,
				},
			});

			if (!version) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document version not found",
				});
			}

			// Verify document belongs to tenant
			if (version.document.tenantId !== ctx.tenantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			// Cannot delete the latest version if it's the only version
			const versionCount = await prisma.documentVersion.count({
				where: { documentId: version.documentId },
			});

			if (version.isLatest && versionCount === 1) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Cannot delete the only version of a document",
				});
			}

			// Delete file from storage
			try {
				await deleteFile(ctx.tenantId, version.fileUrl);
			} catch (error) {
				// Log error but continue with database deletion
				console.error("Failed to delete file from storage:", error);
			}

			// If this was the latest version, mark the next most recent as latest
			if (version.isLatest) {
				const nextLatest = await prisma.documentVersion.findFirst({
					where: {
						documentId: version.documentId,
						id: { not: version.id },
					},
					orderBy: { uploadedAt: "desc" },
				});

				if (nextLatest) {
					await prisma.documentVersion.update({
						where: { id: nextLatest.id },
						data: { isLatest: true },
					});

					await prisma.document.update({
						where: { id: version.documentId },
						data: { latestVersionId: nextLatest.id },
					});
				}
			}

			// Delete version from database
			await prisma.documentVersion.delete({
				where: { id: input.versionId },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: version.document.clientId,
					entityType: "document_version",
					entityId: input.versionId,
					action: "delete",
					changes: { deleted: version },
				},
			});

			return { success: true };
		}),
});
