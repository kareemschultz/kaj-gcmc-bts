/**
 * Input Validation and Sanitization
 *
 * Comprehensive input validation to prevent injection attacks and data corruption
 * Follows OWASP Input Validation guidelines
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureSchemas = exports.ValidationPatterns = void 0;
exports.sanitizeHtml = sanitizeHtml;
exports.sanitizeText = sanitizeText;
exports.sanitizeFileName = sanitizeFileName;
exports.validateJsonInput = validateJsonInput;
exports.escapeSqlIdentifier = escapeSqlIdentifier;
exports.escapeLdapFilter = escapeLdapFilter;
exports.validateCommandArgument = validateCommandArgument;
exports.generateCsrfToken = generateCsrfToken;
exports.validateCsrfToken = validateCsrfToken;
var validator_1 = require("validator");
var xss_1 = require("xss");
var zod_1 = require("zod");
// Common validation patterns
exports.ValidationPatterns = {
	// Alphanumeric with basic punctuation
	SAFE_TEXT: /^[a-zA-Z0-9\s\-_.,:;!?()]+$/,
	// Business names (more permissive)
	BUSINESS_NAME: /^[a-zA-Z0-9\s\-_.,'&()]+$/,
	// File names (no path traversal)
	SAFE_FILENAME: /^[a-zA-Z0-9\-_. ]+\.[a-zA-Z0-9]+$/,
	// SQL-safe identifiers
	SQL_IDENTIFIER: /^[a-zA-Z][a-zA-Z0-9_]*$/,
	// Phone numbers (international format)
	PHONE: /^\+?[1-9]\d{1,14}$/,
	// Postal codes (US and international)
	POSTAL_CODE: /^[A-Z0-9\s-]{3,10}$/i,
};
/**
 * Sanitize HTML content to prevent XSS attacks
 */
function sanitizeHtml(input) {
	return (0, xss_1.default)(input, {
		whiteList: {
			// Allow only safe HTML tags
			p: [],
			br: [],
			b: [],
			i: [],
			em: [],
			strong: [],
			ul: [],
			ol: [],
			li: [],
			h1: [],
			h2: [],
			h3: [],
			h4: [],
			h5: [],
			h6: [],
		},
		stripIgnoreTag: true,
		stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
	});
}
/**
 * Sanitize plain text input
 */
function sanitizeText(input) {
	return validator_1.default.escape(input.trim());
}
/**
 * Validate and sanitize file name to prevent path traversal
 */
function sanitizeFileName(fileName) {
	var errors = [];
	// Check for null bytes
	if (fileName.includes("\0")) {
		errors.push("File name contains null bytes");
	}
	// Check for path traversal patterns
	if (
		fileName.includes("..") ||
		fileName.includes("/") ||
		fileName.includes("\\")
	) {
		errors.push("File name contains path traversal patterns");
	}
	// Check for dangerous characters
	if (/[<>:"|?*]/.test(fileName)) {
		errors.push("File name contains dangerous characters");
	}
	// Check length
	if (fileName.length > 255) {
		errors.push("File name is too long (max 255 characters)");
	}
	// Check if file has extension
	if (!fileName.includes(".") || fileName.endsWith(".")) {
		errors.push("File name must have a valid extension");
	}
	if (errors.length > 0) {
		return { isValid: false, errors: errors };
	}
	// Sanitize the file name
	var sanitized = fileName
		.replace(/[^\w\-_. ]/g, "") // Remove special characters
		.replace(/\s+/g, "_") // Replace spaces with underscores
		.replace(/_{2,}/g, "_") // Replace multiple underscores with single
		.toLowerCase();
	return { isValid: true, sanitized: sanitized };
}
/**
 * Enhanced Zod schemas for common validation patterns
 */
exports.SecureSchemas = {
	email: zod_1.z
		.string()
		.email()
		.transform((email) => email.toLowerCase().trim()),
	password: zod_1.z
		.string()
		.min(12, "Password must be at least 12 characters")
		.regex(/[A-Z]/, "Password must contain uppercase letter")
		.regex(/[a-z]/, "Password must contain lowercase letter")
		.regex(/\d/, "Password must contain number")
		.regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain special character"),
	safeText: zod_1.z
		.string()
		.max(1000, "Text too long")
		.regex(
			exports.ValidationPatterns.SAFE_TEXT,
			"Text contains invalid characters",
		)
		.transform(sanitizeText),
	businessName: zod_1.z
		.string()
		.min(1, "Business name required")
		.max(100, "Business name too long")
		.regex(
			exports.ValidationPatterns.BUSINESS_NAME,
			"Business name contains invalid characters",
		)
		.transform(sanitizeText),
	fileName: zod_1.z
		.string()
		.refine((name) => sanitizeFileName(name).isValid, {
			message: "Invalid file name",
		})
		.transform((name) => sanitizeFileName(name).sanitized),
	phoneNumber: zod_1.z
		.string()
		.regex(exports.ValidationPatterns.PHONE, "Invalid phone number format")
		.transform((phone) => phone.replace(/\D/g, "")), // Remove non-digits
	postalCode: zod_1.z
		.string()
		.regex(exports.ValidationPatterns.POSTAL_CODE, "Invalid postal code format")
		.transform((code) => code.toUpperCase().trim()),
	htmlContent: zod_1.z
		.string()
		.max(10000, "Content too long")
		.transform(sanitizeHtml),
	sqlIdentifier: zod_1.z
		.string()
		.regex(
			exports.ValidationPatterns.SQL_IDENTIFIER,
			"Invalid identifier format",
		),
	tenantCode: zod_1.z
		.string()
		.min(3, "Tenant code must be at least 3 characters")
		.max(50, "Tenant code too long")
		.regex(
			/^[a-z0-9-]+$/,
			"Tenant code can only contain lowercase letters, numbers, and hyphens",
		)
		.transform((code) => code.toLowerCase().trim()),
	ipAddress: zod_1.z
		.string()
		.refine(validator_1.default.isIP, "Invalid IP address"),
	url: zod_1.z
		.string()
		.url("Invalid URL format")
		.refine((url) => {
			var parsed = new URL(url);
			return ["http:", "https:"].includes(parsed.protocol);
		}, "URL must use HTTP or HTTPS protocol"),
};
/**
 * Validate JSON input to prevent JSON injection
 */
function validateJsonInput(input) {
	try {
		// Check for suspicious patterns
		if (
			input.includes("__proto__") ||
			input.includes("constructor") ||
			input.includes("prototype")
		) {
			return {
				isValid: false,
				error: "JSON contains potentially dangerous properties",
			};
		}
		var parsed = JSON.parse(input);
		// Additional checks for prototype pollution
		if (typeof parsed === "object" && parsed !== null) {
			if (
				"__proto__" in parsed ||
				"constructor" in parsed ||
				"prototype" in parsed
			) {
				return {
					isValid: false,
					error: "JSON contains prototype pollution attempt",
				};
			}
		}
		return { isValid: true, parsed: parsed };
	} catch (_error) {
		return { isValid: false, error: "Invalid JSON format" };
	}
}
/**
 * SQL injection prevention for dynamic queries
 */
function escapeSqlIdentifier(identifier) {
	// Only allow alphanumeric characters and underscores for SQL identifiers
	if (!exports.ValidationPatterns.SQL_IDENTIFIER.test(identifier)) {
		throw new Error("Invalid SQL identifier");
	}
	// Escape with double quotes for PostgreSQL
	return '"'.concat(identifier.replace(/"/g, '""'), '"');
}
/**
 * LDAP injection prevention
 */
function escapeLdapFilter(input) {
	return input
		.replace(/\\/g, "\\5c")
		.replace(/\*/g, "\\2a")
		.replace(/\(/g, "\\28")
		.replace(/\)/g, "\\29")
		.replace(/\0/g, "\\00");
}
/**
 * Command injection prevention
 */
function validateCommandArgument(arg) {
	// Disallow dangerous characters
	var dangerousChars = /[;&|`$(){}[\]<>]/;
	if (dangerousChars.test(arg)) {
		return { isValid: false, error: "Argument contains dangerous characters" };
	}
	// Disallow null bytes
	if (arg.includes("\0")) {
		return { isValid: false, error: "Argument contains null bytes" };
	}
	// Check for command substitution patterns
	if (arg.includes("$(") || arg.includes("`")) {
		return { isValid: false, error: "Argument contains command substitution" };
	}
	return { isValid: true };
}
/**
 * Cross-Site Request Forgery (CSRF) token validation
 */
function generateCsrfToken() {
	var crypto = require("node:crypto");
	return crypto.randomBytes(32).toString("hex");
}
function validateCsrfToken(token, expectedToken) {
	if (!token || !expectedToken) return false;
	// Use constant-time comparison to prevent timing attacks
	var crypto = require("node:crypto");
	var tokenBuffer = Buffer.from(token, "hex");
	var expectedBuffer = Buffer.from(expectedToken, "hex");
	if (tokenBuffer.length !== expectedBuffer.length) return false;
	return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
}
