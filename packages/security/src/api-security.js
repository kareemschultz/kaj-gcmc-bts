"use strict";
/**
 * API Security Middleware and Guards
 *
 * Comprehensive API security layer for tRPC endpoints
 * Implements input validation, rate limiting, and security controls
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResourceTenantAccess = exports.sanitizeFileName = exports.API_RATE_LIMITS = exports.ApiSchemas = void 0;
exports.createSecureContext = createSecureContext;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
exports.requireTenantResource = requireTenantResource;
exports.sanitizeOrderBy = sanitizeOrderBy;
exports.sanitizeSearchQuery = sanitizeSearchQuery;
exports.validateFileUpload = validateFileUpload;
exports.handleSecurityError = handleSecurityError;
var server_1 = require("@trpc/server");
var zod_1 = require("zod");
var input_validation_1 = require("./input-validation");
var rbac_guard_1 = require("./rbac-guard");
/**
 * Create authenticated context with security validation
 */
function createSecureContext(context) {
    if (!context.user || !context.tenantId || !context.role) {
        throw new server_1.TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication required",
        });
    }
    return __assign(__assign({}, context), { tenantId: context.tenantId, role: context.role });
}
/**
 * Require authentication for tRPC procedures
 */
function requireAuth() {
    var _this = this;
    return function (context) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!context.user) {
                throw new server_1.TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Authentication required",
                });
            }
            if (!context.tenantId || !context.role) {
                throw new server_1.TRPCError({
                    code: "FORBIDDEN",
                    message: "User not assigned to any tenant",
                });
            }
            return [2 /*return*/, createSecureContext(context)];
        });
    }); };
}
/**
 * Require specific role for tRPC procedures
 */
function requireRole(allowedRoles) {
    var _this = this;
    return function (context) { return __awaiter(_this, void 0, void 0, function () {
        var secureContext;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, requireAuth()(context)];
                case 1:
                    secureContext = _a.sent();
                    if (!allowedRoles.includes(secureContext.role)) {
                        throw new server_1.TRPCError({
                            code: "FORBIDDEN",
                            message: "Access denied. Required roles: ".concat(allowedRoles.join(", ")),
                        });
                    }
                    return [2 /*return*/, secureContext];
            }
        });
    }); };
}
/**
 * Require specific permission for tRPC procedures
 */
function requirePermission(module, action) {
    var _this = this;
    return function (context, resourceId) { return __awaiter(_this, void 0, void 0, function () {
        var secureContext, rbacContext, allowed;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, requireAuth()(context)];
                case 1:
                    secureContext = _b.sent();
                    rbacContext = {
                        userId: (_a = secureContext.user) === null || _a === void 0 ? void 0 : _a.id,
                        tenantId: secureContext.tenantId,
                        role: secureContext.role,
                    };
                    return [4 /*yield*/, (0, rbac_guard_1.hasPermission)(rbacContext, {
                            module: module,
                            action: action,
                            resourceId: resourceId,
                        })];
                case 2:
                    allowed = _b.sent();
                    if (!allowed) {
                        throw new server_1.TRPCError({
                            code: "FORBIDDEN",
                            message: "Access denied: insufficient permissions for ".concat(module, ".").concat(action),
                        });
                    }
                    return [2 /*return*/, secureContext];
            }
        });
    }); };
}
/**
 * Validate tenant access for resources
 */
function requireTenantResource(resourceType) {
    var _this = this;
    return function (context, resourceId) { return __awaiter(_this, void 0, void 0, function () {
        var secureContext, hasAccess;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, requireAuth()(context)];
                case 1:
                    secureContext = _a.sent();
                    return [4 /*yield*/, (0, tenant_isolation_1.validateResourceTenantAccess)(resourceType, resourceId, secureContext.tenantId)];
                case 2:
                    hasAccess = _a.sent();
                    if (!hasAccess) {
                        throw new server_1.TRPCError({
                            code: "NOT_FOUND",
                            message: "Resource not found or access denied",
                        });
                    }
                    return [2 /*return*/, secureContext];
            }
        });
    }); };
}
/**
 * Input validation schemas for API endpoints
 */
exports.ApiSchemas = {
    // Pagination
    pagination: zod_1.z.object({
        page: zod_1.z.number().min(1).max(1000).default(1),
        limit: zod_1.z.number().min(1).max(100).default(20),
        orderBy: zod_1.z
            .string()
            .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
            .optional(),
        orderDir: zod_1.z.enum(["asc", "desc"]).default("desc"),
    }),
    // Search and filtering
    search: zod_1.z.object({
        query: input_validation_1.SecureSchemas.safeText.optional(),
        filters: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
    // Client operations
    createClient: zod_1.z.object({
        name: input_validation_1.SecureSchemas.businessName,
        email: input_validation_1.SecureSchemas.email.optional(),
        phone: input_validation_1.SecureSchemas.phoneNumber.optional(),
        address: zod_1.z
            .object({
            street: input_validation_1.SecureSchemas.safeText,
            city: input_validation_1.SecureSchemas.safeText,
            state: input_validation_1.SecureSchemas.safeText,
            postalCode: input_validation_1.SecureSchemas.postalCode,
            country: input_validation_1.SecureSchemas.safeText.default("US"),
        })
            .optional(),
        taxId: zod_1.z
            .string()
            .regex(/^[0-9-]+$/)
            .optional(),
        incorporationDate: zod_1.z.string().datetime().optional(),
        businessType: zod_1.z
            .enum(["Corporation", "LLC", "Partnership", "Sole Proprietorship"])
            .optional(),
    }),
    updateClient: zod_1.z.object({
        id: zod_1.z.number().positive(),
        name: input_validation_1.SecureSchemas.businessName.optional(),
        email: input_validation_1.SecureSchemas.email.optional(),
        phone: input_validation_1.SecureSchemas.phoneNumber.optional(),
        address: zod_1.z
            .object({
            street: input_validation_1.SecureSchemas.safeText,
            city: input_validation_1.SecureSchemas.safeText,
            state: input_validation_1.SecureSchemas.safeText,
            postalCode: input_validation_1.SecureSchemas.postalCode,
            country: input_validation_1.SecureSchemas.safeText,
        })
            .optional(),
        taxId: zod_1.z
            .string()
            .regex(/^[0-9-]+$/)
            .optional(),
        incorporationDate: zod_1.z.string().datetime().optional(),
        businessType: zod_1.z
            .enum(["Corporation", "LLC", "Partnership", "Sole Proprietorship"])
            .optional(),
    }),
    // Document operations
    createDocument: zod_1.z.object({
        clientId: zod_1.z.number().positive(),
        name: input_validation_1.SecureSchemas.fileName,
        type: zod_1.z.string().min(1).max(50),
        description: input_validation_1.SecureSchemas.safeText.optional(),
        filePath: zod_1.z.string().min(1).max(500),
        fileSize: zod_1.z
            .number()
            .positive()
            .max(100 * 1024 * 1024), // 100MB max
        mimeType: zod_1.z.string().regex(/^[a-z]+\/[a-z0-9\-+]+$/i),
    }),
    // Filing operations
    createFiling: zod_1.z.object({
        clientId: zod_1.z.number().positive(),
        filingTypeId: zod_1.z.number().positive(),
        dueDate: zod_1.z.string().datetime(),
        status: zod_1.z
            .enum(["Pending", "In Progress", "Completed", "Overdue"])
            .default("Pending"),
        priority: zod_1.z.enum(["Low", "Normal", "High", "Critical"]).default("Normal"),
        notes: input_validation_1.SecureSchemas.safeText.optional(),
    }),
    // User operations
    updateUser: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: input_validation_1.SecureSchemas.safeText.optional(),
        email: input_validation_1.SecureSchemas.email.optional(),
        role: zod_1.z
            .enum([
            "Tenant Admin",
            "Manager",
            "Supervisor",
            "Senior Staff",
            "Staff",
            "Junior Staff",
            "Viewer",
        ])
            .optional(),
    }),
    // File upload
    fileUpload: zod_1.z.object({
        fileName: input_validation_1.SecureSchemas.fileName,
        fileSize: zod_1.z
            .number()
            .positive()
            .max(100 * 1024 * 1024),
        mimeType: zod_1.z.string().regex(/^[a-z]+\/[a-z0-9\-+]+$/i),
        clientId: zod_1.z.number().positive().optional(),
    }),
};
/**
 * Rate limiting for API endpoints
 */
exports.API_RATE_LIMITS = {
    // Authentication endpoints (handled separately)
    auth: { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes
    // General API endpoints
    general: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
    // File upload endpoints
    upload: { requests: 10, window: 60 * 1000 }, // 10 uploads per minute
    // Search endpoints
    search: { requests: 30, window: 60 * 1000 }, // 30 searches per minute
    // Bulk operations
    bulk: { requests: 5, window: 60 * 1000 }, // 5 bulk operations per minute
    // Reporting endpoints
    reports: { requests: 10, window: 60 * 1000 }, // 10 report generations per minute
};
/**
 * SQL injection prevention for dynamic queries
 */
function sanitizeOrderBy(orderBy, allowedColumns) {
    if (!orderBy || typeof orderBy !== "string")
        return null;
    // Remove any non-alphanumeric characters except underscore
    var sanitized = orderBy.replace(/[^a-zA-Z0-9_]/g, "");
    // Check if column is in allowed list
    if (!allowedColumns.includes(sanitized)) {
        throw new server_1.TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid order by column",
        });
    }
    return sanitized;
}
/**
 * Validate and sanitize search query
 */
function sanitizeSearchQuery(query) {
    if (!query || typeof query !== "string")
        return "";
    // Remove SQL injection patterns
    var dangerous = [
        /('|(\\'))+.*(--)/i,
        /(;|\s)(exec|execute|drop|create|alter|insert|update|delete|select|union|declare)\s/i,
        /(\s|^)(union|select|insert|delete|update|drop|create|alter|exec|execute)(\s|$)/i,
    ];
    for (var _i = 0, dangerous_1 = dangerous; _i < dangerous_1.length; _i++) {
        var pattern = dangerous_1[_i];
        if (pattern.test(query)) {
            throw new server_1.TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid search query",
            });
        }
    }
    // Sanitize and limit length
    return query.trim().slice(0, 100);
}
/**
 * Validate file upload security
 */
function validateFileUpload(file) {
    var errors = [];
    // Check file name
    var fileNameValidation = (0, tenant_isolation_1.sanitizeFileName)(file.fileName);
    if (!fileNameValidation.isValid) {
        errors.push.apply(errors, (fileNameValidation.errors || []));
    }
    // Check file size (100MB limit)
    if (file.fileSize > 100 * 1024 * 1024) {
        errors.push("File size exceeds 100MB limit");
    }
    // Check MIME type whitelist
    var allowedMimeTypes = [
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
        // Archives
        "application/zip",
        "application/x-zip-compressed",
    ];
    if (!allowedMimeTypes.includes(file.mimeType)) {
        errors.push("File type not allowed");
    }
    return { isValid: errors.length === 0, errors: errors };
}
/**
 * Error handler for API security violations
 */
function handleSecurityError(error, context) {
    var _a;
    // Log security incidents
    console.error("🚨 API Security Error:", {
        timestamp: new Date().toISOString(),
        error: error.message,
        userId: (_a = context === null || context === void 0 ? void 0 : context.user) === null || _a === void 0 ? void 0 : _a.id,
        tenantId: context === null || context === void 0 ? void 0 : context.tenantId,
        stack: error.stack,
    });
    // Return safe error messages to client
    if (error instanceof server_1.TRPCError) {
        return error;
    }
    return new server_1.TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "A security error occurred",
    });
}
// Re-export validation functions for use in other modules
var tenant_isolation_1 = require("./tenant-isolation");
Object.defineProperty(exports, "sanitizeFileName", { enumerable: true, get: function () { return tenant_isolation_1.sanitizeFileName; } });
Object.defineProperty(exports, "validateResourceTenantAccess", { enumerable: true, get: function () { return tenant_isolation_1.validateResourceTenantAccess; } });
