/**
 * Security Validation Constants
 *
 * Centralized validation limits to prevent DoS attacks
 * and ensure consistent validation across all routers
 */

export const VALIDATION_LIMITS = {
	// String length limits
	STRING: {
		TINY: 50, // Short codes, statuses
		SMALL: 255, // Names, titles, emails
		MEDIUM: 1000, // Descriptions, short text
		LARGE: 5000, // Long descriptions, notes
		XLARGE: 50000, // Very long text (rare cases)
	},

	// Pagination limits
	PAGINATION: {
		MIN_PAGE_SIZE: 1,
		MAX_PAGE_SIZE: 100,
		DEFAULT_PAGE_SIZE: 20,
		MAX_PAGE: 10000, // Prevent extreme pagination
	},

	// Array limits
	ARRAY: {
		TAGS_MAX: 50, // Maximum number of tags
		TAG_LENGTH_MAX: 50, // Maximum length of each tag
		IDS_MAX: 1000, // Maximum number of IDs in bulk operations
		REQUIRED_DOC_TYPES_MAX: 100, // Maximum required document types
	},

	// File upload limits
	FILE: {
		MAX_SIZE: 100 * 1024 * 1024, // 100MB
		MAX_SIZE_DOCUMENT: 50 * 1024 * 1024, // 50MB for documents
		MAX_SIZE_IMAGE: 10 * 1024 * 1024, // 10MB for images
		ALLOWED_MIME_TYPES: [
			// Documents
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			// Images
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
			// Text
			"text/plain",
			"text/csv",
		],
		FILENAME_MAX_LENGTH: 255,
		// Prevent path traversal
		FILENAME_REGEX: /^[a-zA-Z0-9._-]+$/,
	},

	// Search query limits
	SEARCH: {
		MIN_LENGTH: 1,
		MAX_LENGTH: 200,
	},

	// Metadata and JSON limits
	METADATA: {
		MAX_KEYS: 50,
		MAX_VALUE_SIZE: 10000,
	},
} as const;

/**
 * Allowed MIME types by category
 */
export const MIME_TYPES = {
	DOCUMENT: [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-powerpoint",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	],
	IMAGE: [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/svg+xml",
	],
	TEXT: ["text/plain", "text/csv", "text/html"],
	ALL: [] as string[], // Will be populated below
} as const;

// Populate ALL mime types
MIME_TYPES.ALL = [
	...MIME_TYPES.DOCUMENT,
	...MIME_TYPES.IMAGE,
	...MIME_TYPES.TEXT,
];
