/**
 * SQL Injection Prevention
 *
 * Comprehensive protection against SQL injection attacks
 * Works with Prisma ORM and raw queries
 */

import { z } from "zod";

/**
 * SQL injection patterns to detect and block
 */
const SQL_INJECTION_PATTERNS = [
	// Union-based injection
	/(\s|^)(union|select|insert|delete|update|drop|create|alter|exec|execute)(\s|$)/i,
	// Comment-based injection
	/('|(\\'))+.*(--)/i,
	// Stored procedure execution
	/(;|\s)(exec|execute|xp_cmdshell|sp_executesql)\s/i,
	// Information schema access
	/information_schema|sysobjects|syscolumns/i,
	// Script injection
	/<script|javascript:|vbscript:|onload=|onerror=/i,
	// SQL functions that shouldn't be in user input
	/\b(char|ascii|substring|length|version|database|user|system_user)\s*\(/i,
	// Hex encoding attacks
	/0x[0-9a-f]+/i,
	// SQL concatenation
	/\+\s*['"]|['"]\s*\+/,
	// Boolean-based blind injection
	/\b(and|or)\s+\d+\s*=\s*\d+/i,
	// Time-based injection
	/waitfor\s+delay|benchmark\s*\(|sleep\s*\(/i,
] as const;

/**
 * Characters that should not appear in SQL identifiers
 */
// Unused constant removed - const DANGEROUS_SQL_CHARS = /[;'"`\\/*\-+=<>()]/;

/**
 * Detect potential SQL injection in user input
 */
export function detectSqlInjection(input: string): {
	isMalicious: boolean;
	detectedPatterns: string[];
} {
	if (!input || typeof input !== "string") {
		return { isMalicious: false, detectedPatterns: [] };
	}

	const detectedPatterns: string[] = [];

	for (const pattern of SQL_INJECTION_PATTERNS) {
		if (pattern.test(input)) {
			detectedPatterns.push(pattern.toString());
		}
	}

	return {
		isMalicious: detectedPatterns.length > 0,
		detectedPatterns,
	};
}

/**
 * Sanitize user input to prevent SQL injection
 */
export function sanitizeSqlInput(input: string): string {
	if (!input || typeof input !== "string") return "";

	// Remove dangerous patterns
	let sanitized = input;

	// Escape single quotes
	sanitized = sanitized.replace(/'/g, "''");

	// Remove SQL comments
	sanitized = sanitized.replace(/--.*$/gm, "");
	sanitized = sanitized.replace(/\/\*.*?\*\//gs, "");

	// Remove dangerous SQL keywords at word boundaries
	const dangerousKeywords = [
		"union",
		"select",
		"insert",
		"update",
		"delete",
		"drop",
		"create",
		"alter",
		"exec",
		"execute",
		"xp_cmdshell",
		"sp_executesql",
		"declare",
		"cast",
		"convert",
		"char",
		"ascii",
		"substring",
		"sys",
		"information_schema",
	];

	for (const keyword of dangerousKeywords) {
		const regex = new RegExp(`\\b${keyword}\\b`, "gi");
		sanitized = sanitized.replace(regex, "");
	}

	return sanitized.trim();
}

/**
 * Validate SQL identifier (table name, column name, etc.)
 */
export function validateSqlIdentifier(identifier: string): {
	isValid: boolean;
	error?: string;
} {
	if (!identifier || typeof identifier !== "string") {
		return { isValid: false, error: "Identifier cannot be empty" };
	}

	// Must start with letter or underscore
	if (!/^[a-zA-Z_]/.test(identifier)) {
		return {
			isValid: false,
			error: "Identifier must start with letter or underscore",
		};
	}

	// Must contain only alphanumeric characters and underscores
	if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
		return { isValid: false, error: "Identifier contains invalid characters" };
	}

	// Check length limits
	if (identifier.length > 63) {
		// PostgreSQL limit
		return { isValid: false, error: "Identifier too long (max 63 characters)" };
	}

	// Check against SQL reserved words
	const sqlReservedWords = [
		"select",
		"insert",
		"update",
		"delete",
		"from",
		"where",
		"join",
		"union",
		"drop",
		"create",
		"alter",
		"table",
		"database",
		"index",
		"view",
		"procedure",
		"function",
		"trigger",
		"user",
		"role",
		"grant",
		"revoke",
		"exec",
		"execute",
	];

	if (sqlReservedWords.includes(identifier.toLowerCase())) {
		return {
			isValid: false,
			error: "Identifier cannot be a SQL reserved word",
		};
	}

	return { isValid: true };
}

/**
 * Escape SQL identifier for safe use in queries
 */
export function escapeSqlIdentifier(identifier: string): string {
	const validation = validateSqlIdentifier(identifier);
	if (!validation.isValid) {
		throw new Error(`Invalid SQL identifier: ${validation.error}`);
	}

	// Double-quote the identifier for PostgreSQL
	return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Validate and sanitize ORDER BY clause
 */
export function validateOrderBy(
	orderBy: string,
	allowedColumns: string[],
): { column: string; direction: "ASC" | "DESC" } | null {
	if (!orderBy || typeof orderBy !== "string") return null;

	// Parse column and direction
	const parts = orderBy.trim().split(/\s+/);
	if (parts.length === 0 || parts.length > 2) return null;

	const column = parts[0];
	if (!column) return null;
	const direction = (parts[1]?.toUpperCase() as "ASC" | "DESC") || "ASC";

	// Validate direction
	if (!["ASC", "DESC"].includes(direction)) return null;

	// Validate column name
	const columnValidation = validateSqlIdentifier(column);
	if (!columnValidation.isValid) return null;

	// Check if column is in allowed list
	if (!allowedColumns.includes(column)) return null;

	return { column, direction };
}

/**
 * Zod schema for SQL-safe inputs
 */
export const SqlSafeSchemas = {
	identifier: z
		.string()
		.min(1)
		.max(63)
		.regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid identifier format")
		.refine(
			(val) => validateSqlIdentifier(val).isValid,
			"Invalid SQL identifier",
		),

	searchTerm: z
		.string()
		.max(255)
		.transform((val) => {
			const detection = detectSqlInjection(val);
			if (detection.isMalicious) {
				throw new Error("Potentially malicious input detected");
			}
			return sanitizeSqlInput(val);
		}),

	orderBy: z
		.string()
		.regex(
			/^[a-zA-Z_][a-zA-Z0-9_]*(\s+(ASC|DESC))?$/i,
			"Invalid ORDER BY format",
		)
		.optional(),

	limit: z.number().int().min(1).max(1000),

	offset: z.number().int().min(0).max(1000000),
};

/**
 * Parameterized query builder for complex WHERE clauses
 */
export class SafeQueryBuilder {
	private conditions: string[] = [];
	private parameters: unknown[] = [];
	private parameterIndex = 1;

	addCondition(column: string, operator: string, value: unknown): this {
		const columnValidation = validateSqlIdentifier(column);
		if (!columnValidation.isValid) {
			throw new Error(`Invalid column name: ${columnValidation.error}`);
		}

		const validOperators = [
			"=",
			"!=",
			"<",
			">",
			"<=",
			">=",
			"LIKE",
			"ILIKE",
			"IN",
			"NOT IN",
		];
		if (!validOperators.includes(operator.toUpperCase())) {
			throw new Error(`Invalid operator: ${operator}`);
		}

		const escapedColumn = escapeSqlIdentifier(column);

		if (
			operator.toUpperCase() === "IN" ||
			operator.toUpperCase() === "NOT IN"
		) {
			if (!Array.isArray(value)) {
				throw new Error("IN operator requires array value");
			}
			const placeholders = value
				.map(() => `$${this.parameterIndex++}`)
				.join(", ");
			this.conditions.push(`${escapedColumn} ${operator} (${placeholders})`);
			this.parameters.push(...value);
		} else {
			this.conditions.push(
				`${escapedColumn} ${operator} $${this.parameterIndex++}`,
			);
			this.parameters.push(value);
		}

		return this;
	}

	addRawCondition(condition: string, ...parameters: unknown[]): this {
		// Only allow if condition doesn't contain user input
		// This should only be used for trusted, hardcoded conditions
		console.warn("Raw condition added to query builder. Ensure this is safe!");
		this.conditions.push(condition);
		this.parameters.push(...parameters);
		return this;
	}

	build(): { whereClause: string; parameters: unknown[] } {
		const whereClause =
			this.conditions.length > 0
				? `WHERE ${this.conditions.join(" AND ")}`
				: "";

		return {
			whereClause,
			parameters: this.parameters,
		};
	}

	reset(): this {
		this.conditions = [];
		this.parameters = [];
		this.parameterIndex = 1;
		return this;
	}
}

/**
 * Validate Prisma where clause for security
 */
export function validatePrismaWhere(whereClause: unknown): boolean {
	if (!whereClause || typeof whereClause !== "object") return true;

	// Recursively check all values in the where clause
	function checkValue(value: unknown): boolean {
		if (typeof value === "string") {
			const detection = detectSqlInjection(value);
			return !detection.isMalicious;
		}

		if (Array.isArray(value)) {
			return value.every(checkValue);
		}

		if (typeof value === "object" && value !== null) {
			return Object.values(value).every(checkValue);
		}

		return true;
	}

	return checkValue(whereClause);
}

/**
 * Log SQL injection attempts for security monitoring
 */
export function logSqlInjectionAttempt(
	input: string,
	detectedPatterns: string[],
	userId?: string,
	endpoint?: string,
): void {
	const logData = {
		timestamp: new Date().toISOString(),
		type: "SQL_INJECTION_ATTEMPT",
		input: input.substring(0, 200), // Limit logged input
		detectedPatterns,
		userId,
		endpoint,
		severity: "HIGH",
	};

	console.warn("🚨 SQL Injection Attempt Detected:", logData);

	// In production, send this to your security monitoring system
	// securityMonitor.alert(logData);
}
