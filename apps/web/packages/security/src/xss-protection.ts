/**
 * XSS Protection Utilities
 *
 * Provides comprehensive protection against Cross-Site Scripting (XSS) attacks
 */

import xss from "xss";

/**
 * Sanitize HTML content with strict XSS protection
 */
export function sanitizeHtml(content: string): string {
	if (!content || typeof content !== "string") {
		return "";
	}

	return xss(content, {
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
		],
		allowCommentTag: false,
	});
}

/**
 * Strip all HTML tags completely
 */
export function stripHtml(content: string): string {
	if (!content || typeof content !== "string") {
		return "";
	}

	return content.replace(/<[^>]*>/g, "");
}

/**
 * Escape HTML entities
 */
export function escapeHtml(content: string): string {
	if (!content || typeof content !== "string") {
		return "";
	}

	return content
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Validate if URL is safe (no javascript: or data: protocols)
 */
export function isSafeUrl(url: string): boolean {
	if (!url || typeof url !== "string") {
		return false;
	}

	try {
		const parsed = new URL(url);
		const safeProtocols = ["http:", "https:", "mailto:", "tel:"];
		return safeProtocols.includes(parsed.protocol);
	} catch {
		return false;
	}
}

/**
 * Content Security Policy header configuration
 */
export const CSP_CONFIG = {
	directives: {
		defaultSrc: ["'self'"],
		scriptSrc: ["'self'", "'unsafe-inline'"],
		styleSrc: ["'self'", "'unsafe-inline'"],
		imgSrc: ["'self'", "data:", "https:"],
		connectSrc: ["'self'"],
		fontSrc: ["'self'"],
		objectSrc: ["'none'"],
		mediaSrc: ["'self'"],
		frameSrc: ["'none'"],
	},
};
