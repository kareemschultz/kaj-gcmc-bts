/**
 * Security Utilities Package
 *
 * Comprehensive security utilities for the KAJ-GCMC BTS Platform
 * Implements OWASP security best practices and enterprise-grade security controls
 */

// Re-export other security modules with explicit exports to avoid conflicts
export type { ApiSecurityContext } from "./api-security";
export {
	API_RATE_LIMITS,
	ApiSchemas,
	createSecureContext,
	handleSecurityError,
	requireAuth,
	// requirePermission conflicts with rbac-guard, using requireApiPermission
	requirePermission as requireApiPermission,
	requireRole,
	requireTenantResource,
	sanitizeOrderBy,
	sanitizeSearchQuery,
	validateFileUpload,
	validateResourceTenantAccess,
} from "./api-security";
export * from "./encryption";
// Export input validation utilities
export {
	escapeLdapFilter,
	escapeSqlIdentifier as validateSqlIdentifier,
	generateCsrfToken,
	SecureSchemas,
	sanitizeFileName as validateAndSanitizeFileName,
	sanitizeHtml,
	sanitizeText,
	ValidationPatterns,
	validateCommandArgument,
	validateCsrfToken,
	validateJsonInput,
} from "./input-validation";
export type { Permission, RbacContext } from "./rbac-guard";
export {
	getRolePermissions,
	getTenantFilteredData,
	hasAllPermissions,
	hasAnyPermission,
	hasPermission,
	logPermissionCheck,
	PERMISSION_MATRIX,
	requirePermission,
	// validateTenantAccess conflicts with tenant-isolation, using rbacValidateTenantAccess
	validateTenantAccess as rbacValidateTenantAccess,
} from "./rbac-guard";
// Export SQL injection prevention utilities
export {
	detectSqlInjection,
	escapeSqlIdentifier,
	logSqlInjectionAttempt,
	SafeQueryBuilder,
	SqlSafeSchemas,
	sanitizeSqlInput,
	validateOrderBy,
	validatePrismaWhere,
	validateSqlIdentifier as validateSqlIdentifierSafe,
} from "./sql-injection-prevention";
export type { TenantContext } from "./tenant-isolation";
export {
	auditTenantAccess,
	createTenantPrismaClient,
	getTenantCacheKey,
	getTenantConfig,
	getTenantEncryptionKey,
	getUserTenantInfo,
	requireTenantAccess,
	validateTenantAccess,
	withTenantIsolation,
} from "./tenant-isolation";
// Export XSS protection utilities
export {
	CSP_DIRECTIVES,
	detectXSSPayload,
	generateCSPHeader,
	logXSSAttempt,
	sanitizeDocumentContent,
	sanitizeFileName,
	sanitizeJsonResponse,
	sanitizeRichText,
	sanitizeUserInput,
	xssProtectionMiddleware,
} from "./xss-protection";
