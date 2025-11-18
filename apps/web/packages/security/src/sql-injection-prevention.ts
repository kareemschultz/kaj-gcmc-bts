/**
 * SQL Injection Prevention Utilities
 */

import { z } from "zod";

export function escapeSqlIdentifier(identifier: string): string {
	if (!identifier || typeof identifier !== "string") {
		throw new Error("Invalid SQL identifier");
	}

	if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
		throw new Error("Invalid SQL identifier format");
	}

	return `"${identifier}"`;
}

export function validateOrderBy(orderBy: string): boolean {
	if (!orderBy || typeof orderBy !== "string") {
		return false;
	}

	const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*\s+(ASC|DESC)$/i;
	return pattern.test(orderBy.trim());
}

export const limitSchema = z.object({
	limit: z.number().int().min(1).max(1000),
	offset: z.number().int().min(0).optional(),
});

export function validatePagination(params: unknown) {
	return limitSchema.safeParse(params);
}

const SQL_INJECTION_PATTERNS = [
	/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
	/('|(\\)|(;)|(--)|(\|)|(\*)|(%)|(\+))/,
	/(\b(OR|AND)\b\s*\d+\s*=\s*\d+)/i,
];

export function detectSqlInjection(input: string): {
	isMalicious: boolean;
	pattern?: RegExp;
} {
	if (!input || typeof input !== "string") {
		return { isMalicious: false };
	}

	for (const pattern of SQL_INJECTION_PATTERNS) {
		if (pattern.test(input)) {
			return { isMalicious: true, pattern };
		}
	}

	return { isMalicious: false };
}
