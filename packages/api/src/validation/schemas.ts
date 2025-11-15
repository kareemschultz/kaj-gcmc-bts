/**
 * Common Validation Schemas
 *
 * Reusable Zod schemas with proper security constraints
 */

import { z } from "zod";
import { MIME_TYPES, VALIDATION_LIMITS } from "./constants";

/**
 * Pagination schema with security limits
 */
export const paginationSchema = z.object({
	page: z
		.number()
		.int()
		.min(1)
		.max(VALIDATION_LIMITS.PAGINATION.MAX_PAGE)
		.default(1),
	pageSize: z
		.number()
		.int()
		.min(VALIDATION_LIMITS.PAGINATION.MIN_PAGE_SIZE)
		.max(VALIDATION_LIMITS.PAGINATION.MAX_PAGE_SIZE)
		.default(VALIDATION_LIMITS.PAGINATION.DEFAULT_PAGE_SIZE),
});

/**
 * Search query schema with length limits
 */
export const searchSchema = z
	.string()
	.min(VALIDATION_LIMITS.SEARCH.MIN_LENGTH)
	.max(VALIDATION_LIMITS.SEARCH.MAX_LENGTH)
	.optional();

/**
 * Email validation schema
 */
export const emailSchema = z
	.string()
	.email("Invalid email format")
	.max(VALIDATION_LIMITS.STRING.SMALL);

/**
 * URL validation schema
 */
export const urlSchema = z
	.string()
	.url("Invalid URL format")
	.max(VALIDATION_LIMITS.STRING.MEDIUM);

/**
 * Phone number schema (basic validation)
 */
export const phoneSchema = z
	.string()
	.regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
	.max(20)
	.optional();

/**
 * File upload validation schemas
 */
export const fileUploadSchema = z.object({
	fileName: z
		.string()
		.min(1)
		.max(VALIDATION_LIMITS.FILE.FILENAME_MAX_LENGTH)
		.regex(
			VALIDATION_LIMITS.FILE.FILENAME_REGEX,
			"Filename contains invalid characters",
		),
	fileType: z.enum(MIME_TYPES.ALL as unknown as [string, ...string[]], {
		errorMap: () => ({ message: "Invalid file type" }),
	}),
	fileSize: z
		.number()
		.int()
		.min(1)
		.max(VALIDATION_LIMITS.FILE.MAX_SIZE_DOCUMENT, "File too large (max 50MB)"),
});

export const documentFileSchema = z.object({
	fileName: z
		.string()
		.min(1)
		.max(VALIDATION_LIMITS.FILE.FILENAME_MAX_LENGTH)
		.regex(
			VALIDATION_LIMITS.FILE.FILENAME_REGEX,
			"Filename contains invalid characters",
		),
	fileType: z.enum(MIME_TYPES.DOCUMENT as unknown as [string, ...string[]], {
		errorMap: () => ({ message: "Invalid document type" }),
	}),
	fileSize: z
		.number()
		.int()
		.min(1)
		.max(
			VALIDATION_LIMITS.FILE.MAX_SIZE_DOCUMENT,
			"Document too large (max 50MB)",
		),
});

/**
 * Tags array schema with size limits
 */
export const tagsSchema = z
	.array(z.string().min(1).max(VALIDATION_LIMITS.ARRAY.TAG_LENGTH_MAX))
	.max(VALIDATION_LIMITS.ARRAY.TAGS_MAX, "Too many tags (max 50)")
	.default([]);

/**
 * Metadata schema with size limits
 */
export const metadataSchema = z
	.record(z.string(), z.any())
	.refine(
		(data) => Object.keys(data).length <= VALIDATION_LIMITS.METADATA.MAX_KEYS,
		{
			message: `Too many metadata keys (max ${VALIDATION_LIMITS.METADATA.MAX_KEYS})`,
		},
	)
	.optional();

/**
 * Array of IDs schema (for bulk operations)
 */
export const idsArraySchema = z
	.array(z.number().int())
	.min(1)
	.max(VALIDATION_LIMITS.ARRAY.IDS_MAX, "Too many IDs (max 1000)");
