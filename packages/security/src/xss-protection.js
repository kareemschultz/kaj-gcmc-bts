/**
 * Cross-Site Scripting (XSS) Protection
 *
 * Comprehensive XSS prevention and content sanitization
 * Implements multiple layers of protection against XSS attacks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSP_DIRECTIVES = void 0;
exports.sanitizeUserInput = sanitizeUserInput;
exports.sanitizeRichText = sanitizeRichText;
exports.sanitizeDocumentContent = sanitizeDocumentContent;
exports.sanitizeJsonResponse = sanitizeJsonResponse;
exports.generateCSPHeader = generateCSPHeader;
exports.sanitizeFileName = sanitizeFileName;
exports.detectXSSPayload = detectXSSPayload;
exports.logXSSAttempt = logXSSAttempt;
exports.xssProtectionMiddleware = xssProtectionMiddleware;
var validator_1 = require("validator");
var xss_1 = require("xss");
/**
 * XSS filter configuration for different contexts
 */
var XSS_FILTERS = {
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
		onIgnoreTag: (tag, html, _options) => {
			// Log potential XSS attempts
			console.warn("🚨 Potential XSS attempt blocked:", {
				tag: tag,
				html: html.substring(0, 100),
			});
			return "";
		},
		onIgnoreTagAttr: (tag, name, value) => {
			console.warn("🚨 Dangerous attribute blocked:", {
				tag: tag,
				name: name,
				value: value,
			});
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
		onTag: (_tag, html, options) => {
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
		onTagAttr: (_tag, name, value, isWhiteAttr) => {
			// Validate URLs in href and src attributes
			if (["href", "src"].includes(name)) {
				if (!isValidUrl(value)) {
					return "";
				}
			}
			// Validate style attribute
			if (name === "style") {
				return sanitizeStyle(value)
					? "".concat(name, '="').concat(sanitizeStyle(value), '"')
					: "";
			}
			// Allow whitelisted attributes
			if (isWhiteAttr) {
				return ""
					.concat(name, '="')
					.concat(validator_1.default.escape(value), '"');
			}
			return "";
		},
	},
};
/**
 * Validate URL to prevent javascript: and data: URI attacks
 */
function isValidUrl(url) {
	if (!url) return false;
	try {
		var parsed = new URL(url);
		// Only allow safe protocols
		var safeProtocols = ["http:", "https:", "mailto:", "tel:"];
		return safeProtocols.includes(parsed.protocol);
	} catch (_a) {
		// Relative URLs are okay
		return !/^(javascript:|data:|vbscript:)/i.test(url);
	}
}
/**
 * Sanitize CSS style attribute
 */
function sanitizeStyle(style) {
	if (!style) return "";
	// Remove dangerous CSS properties and values
	var dangerousPatterns = [
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
	var sanitized = style;
	for (
		var _i = 0, dangerousPatterns_1 = dangerousPatterns;
		_i < dangerousPatterns_1.length;
		_i++
	) {
		var pattern = dangerousPatterns_1[_i];
		sanitized = sanitized.replace(pattern, "");
	}
	// Remove any remaining potentially dangerous characters
	sanitized = sanitized.replace(/[<>"']/g, "");
	return sanitized;
}
/**
 * Strict XSS filtering for user input (no HTML allowed)
 */
function sanitizeUserInput(input) {
	if (!input || typeof input !== "string") return "";
	// Use strict filtering
	var sanitized = (0, xss_1.default)(input, XSS_FILTERS.strict);
	// Additional escape for any remaining special characters
	return validator_1.default.escape(sanitized);
}
/**
 * Basic XSS filtering for rich text content
 */
function sanitizeRichText(input) {
	if (!input || typeof input !== "string") return "";
	return (0, xss_1.default)(input, XSS_FILTERS.basic);
}
/**
 * Extended XSS filtering for document content
 */
function sanitizeDocumentContent(input) {
	if (!input || typeof input !== "string") return "";
	return (0, xss_1.default)(input, XSS_FILTERS.document);
}
/**
 * Sanitize JSON to prevent XSS in JSON responses
 */
function sanitizeJsonResponse(obj) {
	if (obj === null || obj === undefined) return obj;
	if (typeof obj === "string") {
		return validator_1.default.escape(obj);
	}
	if (Array.isArray(obj)) {
		return obj.map(sanitizeJsonResponse);
	}
	if (typeof obj === "object") {
		var sanitized = {};
		for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
			var _b = _a[_i];
			var key = _b[0];
			var value = _b[1];
			sanitized[validator_1.default.escape(key)] = sanitizeJsonResponse(value);
		}
		return sanitized;
	}
	return obj;
}
/**
 * Content Security Policy (CSP) helpers
 */
exports.CSP_DIRECTIVES = {
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
};
/**
 * Generate CSP header value
 */
function generateCSPHeader(environment) {
	var directives = exports.CSP_DIRECTIVES[environment];
	return Object.entries(directives)
		.map((_a) => {
			var directive = _a[0];
			var sources = _a[1];
			if (sources.length === 0) return directive;
			return "".concat(directive, " ").concat(sources.join(" "));
		})
		.join("; ");
}
/**
 * Validate and sanitize file upload names
 */
function sanitizeFileName(fileName) {
	if (!fileName || typeof fileName !== "string") return "";
	// Remove path separators and dangerous characters
	var sanitized = fileName
		.replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
		.replace(/^\.+/, "") // Remove leading dots
		.trim();
	// Limit length
	if (sanitized.length > 255) {
		var extension = sanitized.substring(sanitized.lastIndexOf("."));
		var name_1 = sanitized.substring(0, 255 - extension.length);
		sanitized = name_1 + extension;
	}
	return sanitized || "unnamed-file";
}
/**
 * Detect potential XSS payloads
 */
function detectXSSPayload(input) {
	if (!input || typeof input !== "string") {
		return { isXSS: false, detectedPatterns: [], riskLevel: "low" };
	}
	var xssPatterns = [
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
	var detectedPatterns = [];
	var highestRisk = "low";
	for (
		var _i = 0, xssPatterns_1 = xssPatterns;
		_i < xssPatterns_1.length;
		_i++
	) {
		var _a = xssPatterns_1[_i];
		var pattern = _a.pattern;
		var risk = _a.risk;
		if (pattern.test(input)) {
			detectedPatterns.push(pattern.toString());
			if (risk === "high" || (risk === "medium" && highestRisk === "low")) {
				highestRisk = risk;
			}
		}
	}
	return {
		isXSS: detectedPatterns.length > 0,
		detectedPatterns: detectedPatterns,
		riskLevel: highestRisk,
	};
}
/**
 * Log XSS attempts for security monitoring
 */
function logXSSAttempt(input, detectedPatterns, riskLevel, userId, endpoint) {
	var logData = {
		timestamp: new Date().toISOString(),
		type: "XSS_ATTEMPT",
		input: input.substring(0, 200), // Limit logged input
		detectedPatterns: detectedPatterns,
		riskLevel: riskLevel,
		userId: userId,
		endpoint: endpoint,
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
function xssProtectionMiddleware(strictMode) {
	if (strictMode === void 0) {
		strictMode = false;
	}
	return (req, _res, next) => {
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
function sanitizeRequestBody(obj, strictMode) {
	if (obj === null || obj === undefined) return obj;
	if (typeof obj === "string") {
		var detection = detectXSSPayload(obj);
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
		var sanitized = {};
		for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
			var _b = _a[_i];
			var key = _b[0];
			var value = _b[1];
			// Sanitize both keys and values
			var sanitizedKey = sanitizeUserInput(key);
			sanitized[sanitizedKey] = sanitizeRequestBody(value, strictMode);
		}
		return sanitized;
	}
	return obj;
}
