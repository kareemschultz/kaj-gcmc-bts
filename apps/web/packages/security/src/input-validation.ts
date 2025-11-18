/**
 * Input Validation Security Utilities
 *
 * Provides comprehensive input sanitization and validation
 * to prevent injection attacks and data corruption
 */

import validator from "validator";
import { z } from "zod";

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
	if (typeof input !== "string") {
		return "";
	}

	return validator.escape(input.trim());
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFileName(fileName: string): string {
	if (!fileName || typeof fileName !== "string") {
		return "untitled";
	}

	// Remove dangerous characters and normalize
	const sanitized = fileName
		.replace(/[^a-zA-Z0-9._-]/g, "_")
		.replace(/^\.+/, "")
		.replace(/\.+$/, "")
		.substring(0, 255);

	return sanitized || "untitled";
}

/**
 * Validate email format securely
 */
export function validateEmail(email: string): boolean {
	return validator.isEmail(email) && email.length <= 254;
}

/**
 * Validate URL format securely
 */
export function validateUrl(url: string): boolean {
	return validator.isURL(url, {
		protocols: ["http", "https"],
		require_protocol: true,
		require_valid_protocol: true,
	});
}

/**
 * Sanitize JSON input to prevent prototype pollution
 */
export function sanitizeJson<T>(input: string): T | null {
	try {
		const parsed = JSON.parse(input);

		// Check for prototype pollution attempts
		if (typeof parsed === "object" && parsed !== null) {
			const dangerous = ["__proto__", "constructor", "prototype"];
			for (const key of dangerous) {
				if (key in parsed) {
					throw new Error("Potential prototype pollution detected");
				}
			}
		}

		return parsed;
	} catch {
		return null;
	}
}

/**
 * File upload validation schema
 */
export const fileUploadSchema = z.object({
	fileName: z
		.string()
		.max(255)
		.refine(
			(name) => /^[a-zA-Z0-9._-]+$/.test(name),
			"Invalid filename format",
		),
	mimeType: z.string().max(100),
	fileSize: z
		.number()
		.int()
		.min(1)
		.max(50 * 1024 * 1024), // 50MB max
});

/**
 * Validate file upload parameters
 */
export function validateFileUpload(params: unknown) {
	return fileUploadSchema.safeParse(params);
}

/**
 * Sanitize HTML content while preserving safe tags
 */
export function sanitizeHtmlContent(content: string): string {
	if (!content || typeof content !== "string") {
		return "";
	}

	// Basic HTML sanitization - remove script tags and dangerous attributes
	return content
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/on\w+="[^"]*"/g, "")
		.replace(/javascript:/gi, "")
		.replace(/vbscript:/gi, "");
}
