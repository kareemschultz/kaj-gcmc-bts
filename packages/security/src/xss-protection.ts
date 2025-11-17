/**
 * Cross-Site Scripting (XSS) Protection
 *
 * Comprehensive XSS prevention and content sanitization
 * Implements multiple layers of protection against XSS attacks
 */

import validator from "validator";
import xss from "xss";

/**
 * XSS filter configuration for different contexts
 */
const XSS_FILTERS = {
	// Strict filter for user input (no HTML allowed)
	strict: {
		whiteList: {},
		stripIgnoreTag: true,
		stripIgnoreTagBody: [
			"script",
			"style",
			"iframe",
			"object",
			"embed",
			"form",
		],
		allowCommentTag: false,
		onIgnoreTag: (tag: string, html: string, _options: any) => {
			// Log potential XSS attempts
			console.warn("🚨 Potential XSS attempt blocked:", {
				tag,
				html: html.substring(0, 100),
			});
			return "";
		},
		onIgnoreTagAttr: (tag: string, name: string, value: string) => {
			console.warn("🚨 Dangerous attribute blocked:", { tag, name, value });
			return "";
		},
	},

	// Basic filter for rich text content
	basic: {
		whiteList: {
			p: [],
			br: [],
			strong: [],
			b: [],
			em: [],
			i: [],
			u: [],
			h1: [],
			h2: [],
			h3: [],
			h4: [],
			h5: [],
			h6: [],
			ul: [],
			ol: [],
			li: [],
			blockquote: [],
		},
		stripIgnoreTag: true,
		stripIgnoreTagBody: [
			"script",
			"style",
			"iframe",
			"object",
			"embed",
			"form",
			"input",
			"textarea",
			"select",
		],
		allowCommentTag: false,
		onTag: (_tag: string, html: string, options: any) => {
			// Additional validation for allowed tags
			if (options.isClosing) return html;

			// Check for dangerous attributes
			if (
				html.includes("javascript:") ||
				html.includes("data:") ||
				html.includes("vbscript:")
			) {
				return "";
			}

			return html;
		},
	},

	// Extended filter for document content
	document: {
		whiteList: {
			p: ["class", "style"],
			br: [],
			strong: [],
			b: [],
			em: [],
			i: [],
			u: [],
			s: [],
			h1: ["class"],
			h2: ["class"],
			h3: ["class"],
			h4: ["class"],
			h5: ["class"],
			h6: ["class"],
			ul: ["class"],
			ol: ["class"],
			li: ["class"],
			blockquote: ["class"],
			a: ["href", "title", "target"],
			img: ["src", "alt", "title", "width", "height"],
			table: ["class"],
			thead: [],
			tbody: [],
			tr: [],
			th: ["colspan", "rowspan"],
			td: ["colspan", "rowspan"],
			div: ["class"],
			span: ["class"],
		},
		stripIgnoreTag: true,
		stripIgnoreTagBody: [
			"script",
			"style",
			"iframe",
			"object",
			"embed",
			"form",
			"input",
			"textarea",
			"select",
		],
		allowCommentTag: false,
		onTagAttr: (
			_tag: string,
			name: string,
			value: string,
			isWhiteAttr: boolean,
		) => {
			// Validate URLs in href and src attributes
			if (["href", "src"].includes(name)) {
				if (!isValidUrl(value)) {
					return "";
				}
			}

			// Validate style attribute
			if (name === "style") {
				return sanitizeStyle(value) ? `${name}="${sanitizeStyle(value)}"` : "";
			}

			// Allow whitelisted attributes
			if (isWhiteAttr) {
				return `${name}="${validator.escape(value)}"`;
			}

			return "";
		},
	},
} as const;

/**
 * Validate URL to prevent javascript: and data: URI attacks
 */
function isValidUrl(url: string): boolean {
	if (!url) return false;

	try {
		const parsed = new URL(url);
		// Only allow safe protocols
		const safeProtocols = ["http:", "https:", "mailto:", "tel:"];
		return safeProtocols.includes(parsed.protocol);
	} catch {
		// Relative URLs are okay
		return !/^(javascript:|data:|vbscript:)/i.test(url);
	}
}

/**
 * Sanitize CSS style attribute
 */
function sanitizeStyle(style: string): string {
	if (!style) return "";

	// Remove dangerous CSS properties and values
	const dangerousPatterns = [
		/expression\s*\(/i,
		/javascript:/i,
		/vbscript:/i,
		/data:/i,
		/@import/i,
		/url\s*\(/i,
		/binding:/i,
		/-moz-binding/i,
		/behavior:/i,
	];

	let sanitized = style;

	for (const pattern of dangerousPatterns) {
		sanitized = sanitized.replace(pattern, "");
	}

	// Remove any remaining potentially dangerous characters
	sanitized = sanitized.replace(/[<>"']/g, "");

	return sanitized;
}

/**
 * Strict XSS filtering for user input (no HTML allowed)
 */
export function sanitizeUserInput(input: string): string {
	if (!input || typeof input !== "string") return "";

	// Use strict filtering
	const sanitized = xss(input, XSS_FILTERS.strict);

	// Additional escape for any remaining special characters
	return validator.escape(sanitized);
}

/**
 * Basic XSS filtering for rich text content
 */
export function sanitizeRichText(input: string): string {
	if (!input || typeof input !== "string") return "";

	return xss(input, XSS_FILTERS.basic);
}

/**
 * Extended XSS filtering for document content
 */
export function sanitizeDocumentContent(input: string): string {
	if (!input || typeof input !== "string") return "";

	return xss(input, XSS_FILTERS.document);
}

/**
 * Sanitize JSON to prevent XSS in JSON responses
 */
export function sanitizeJsonResponse(obj: any): any {
	if (obj === null || obj === undefined) return obj;

	if (typeof obj === "string") {
		return validator.escape(obj);
	}

	if (Array.isArray(obj)) {
		return obj.map(sanitizeJsonResponse);
	}

	if (typeof obj === "object") {
		const sanitized: any = {};
		for (const [key, value] of Object.entries(obj)) {
			sanitized[validator.escape(key)] = sanitizeJsonResponse(value);
		}
		return sanitized;
	}

	return obj;
}

/**
 * Content Security Policy (CSP) helpers
 */
export const CSP_DIRECTIVES = {
	development: {
		"default-src": ["'self'"],
		"script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
		"style-src": ["'self'", "'unsafe-inline'"],
		"img-src": ["'self'", "data:", "blob:", "https:"],
		"font-src": ["'self'", "data:"],
		"connect-src": ["'self'", "ws:", "wss:"],
		"media-src": ["'self'"],
		"object-src": ["'none'"],
		"frame-src": ["'self'"],
		"base-uri": ["'self'"],
		"form-action": ["'self'"],
		"frame-ancestors": ["'none'"],
	},
	production: {
		"default-src": ["'self'"],
		"script-src": ["'self'", "'unsafe-inline'"], // Next.js requires unsafe-inline
		"style-src": ["'self'", "'unsafe-inline'"],
		"img-src": ["'self'", "data:", "blob:", "https:"],
		"font-src": ["'self'", "data:"],
		"connect-src": ["'self'"],
		"media-src": ["'self'"],
		"object-src": ["'none'"],
		"frame-src": ["'self'"],
		"base-uri": ["'self'"],
		"form-action": ["'self'"],
		"frame-ancestors": ["'none'"],
		"upgrade-insecure-requests": [],
	},
} as const;

/**
 * Generate CSP header value
 */
export function generateCSPHeader(
	environment: "development" | "production",
): string {
	const directives = CSP_DIRECTIVES[environment];

	return Object.entries(directives)
		.map(([directive, sources]) => {
			if (sources.length === 0) return directive;
			return `${directive} ${sources.join(" ")}`;
		})
		.join("; ");
}

/**
 * Validate and sanitize file upload names
 */
export function sanitizeFileName(fileName: string): string {
	if (!fileName || typeof fileName !== "string") return "";

	// Remove path separators and dangerous characters
	let sanitized = fileName
		.replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
		.replace(/^\.+/, "") // Remove leading dots
		.trim();

	// Limit length
	if (sanitized.length > 255) {
		const extension = sanitized.substring(sanitized.lastIndexOf("."));
		const name = sanitized.substring(0, 255 - extension.length);
		sanitized = name + extension;
	}

	return sanitized || "unnamed-file";
}

/**
 * Detect potential XSS payloads
 */
export function detectXSSPayload(input: string): {
	isXSS: boolean;
	detectedPatterns: string[];
	riskLevel: "low" | "medium" | "high";
} {
	if (!input || typeof input !== "string") {
		return { isXSS: false, detectedPatterns: [], riskLevel: "low" };
	}

	const xssPatterns = [
		// Script tags
		{ pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/gi, risk: "high" },
		// Event handlers
		{ pattern: /on\w+\s*=/gi, risk: "high" },
		// Javascript URIs
		{ pattern: /javascript:/gi, risk: "high" },
		// Data URIs with scripts
		{ pattern: /data:\s*text\/html/gi, risk: "high" },
		// VBScript
		{ pattern: /vbscript:/gi, risk: "high" },
		// Expression (IE specific)
		{ pattern: /expression\s*\(/gi, risk: "medium" },
		// Import statements
		{ pattern: /@import/gi, risk: "medium" },
		// Iframe tags
		{ pattern: /<iframe/gi, risk: "medium" },
		// Object/embed tags
		{ pattern: /<(object|embed)/gi, risk: "medium" },
		// Meta refresh
		{ pattern: /<meta[\s\S]*?http-equiv\s*=\s*['"]*refresh/gi, risk: "medium" },
		// Form tags
		{ pattern: /<form/gi, risk: "low" },
		// Input tags
		{ pattern: /<input/gi, risk: "low" },
	];

	const detectedPatterns: string[] = [];
	let highestRisk: "low" | "medium" | "high" = "low";

	for (const { pattern, risk } of xssPatterns) {
		if (pattern.test(input)) {
			detectedPatterns.push(pattern.toString());
			if (risk === "high" || (risk === "medium" && highestRisk === "low")) {
				highestRisk = risk;
			}
		}
	}

	return {
		isXSS: detectedPatterns.length > 0,
		detectedPatterns,
		riskLevel: highestRisk,
	};
}

/**
 * Log XSS attempts for security monitoring
 */
export function logXSSAttempt(
	input: string,
	detectedPatterns: string[],
	riskLevel: "low" | "medium" | "high",
	userId?: string,
	endpoint?: string,
): void {
	const logData = {
		timestamp: new Date().toISOString(),
		type: "XSS_ATTEMPT",
		input: input.substring(0, 200), // Limit logged input
		detectedPatterns,
		riskLevel,
		userId,
		endpoint,
	};

	if (riskLevel === "high") {
		console.error("🚨 High-Risk XSS Attempt:", logData);
	} else if (riskLevel === "medium") {
		console.warn("⚠️  Medium-Risk XSS Attempt:", logData);
	} else {
		console.info("ℹ️  Low-Risk XSS Pattern Detected:", logData);
	}

	// In production, send this to your security monitoring system
}

/**
 * Middleware for automatic XSS protection
 */
export function xssProtectionMiddleware(strictMode = false) {
	return (req: any, _res: any, next: any) => {
		// Sanitize request body
		if (req.body && typeof req.body === "object") {
			req.body = sanitizeRequestBody(req.body, strictMode);
		}

		// Sanitize query parameters
		if (req.query && typeof req.query === "object") {
			req.query = sanitizeRequestBody(req.query, true); // Always strict for query params
		}

		next();
	};
}

/**
 * Recursively sanitize request body
 */
function sanitizeRequestBody(obj: any, strictMode: boolean): any {
	if (obj === null || obj === undefined) return obj;

	if (typeof obj === "string") {
		const detection = detectXSSPayload(obj);
		if (detection.isXSS && detection.riskLevel === "high") {
			// Block high-risk payloads
			throw new Error("Potentially malicious content detected");
		}

		return strictMode ? sanitizeUserInput(obj) : sanitizeRichText(obj);
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => sanitizeRequestBody(item, strictMode));
	}

	if (typeof obj === "object") {
		const sanitized: any = {};
		for (const [key, value] of Object.entries(obj)) {
			// Sanitize both keys and values
			const sanitizedKey = sanitizeUserInput(key);
			sanitized[sanitizedKey] = sanitizeRequestBody(value, strictMode);
		}
		return sanitized;
	}

	return obj;
}
