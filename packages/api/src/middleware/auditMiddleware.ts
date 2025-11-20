/**
 * Audit Middleware
 *
 * Automatically captures audit logs for CRUD operations
 * Integrates with tRPC procedures to track all database changes
 */

import { TRPCError } from "@trpc/server";
import type { ProcedureBuilderDef } from "@trpc/server/dist/declarations/src/internals/procedureBuilder";
import {
	AuditActions,
	type AuditLogEntry,
	type AuditService,
	EntityTypes,
} from "../application/services/AuditService";
import type { Context } from "../context";

export interface AuditMiddlewareOptions {
	entityType: string;
	action: string;
	extractEntityId?: (input: any, result?: any) => number | string;
	extractChanges?: (input: any, result?: any, before?: any) => any;
	skipAudit?: (input: any) => boolean;
	clientId?: (input: any, ctx: Context) => number | null;
}

/**
 * Audit middleware factory that creates tRPC middleware for audit logging
 */
export function createAuditMiddleware(options: AuditMiddlewareOptions) {
	return async function auditMiddleware(opts: {
		ctx: Context;
		next: () => Promise<any>;
		path: string;
		input: any;
	}) {
		const { ctx, next, path, input } = opts;

		// Skip audit if configured to do so
		if (options.skipAudit && options.skipAudit(input)) {
			return next();
		}

		// Verify we have audit service and user context
		if (!ctx.auditService || !ctx.user || !ctx.user.tenantId) {
			return next();
		}

		const before: any = null;
		let entityId: number | string | null = null;

		try {
			// For update/delete operations, fetch the current state first
			if (
				options.action.includes("update") ||
				options.action.includes("delete")
			) {
				if (options.extractEntityId && input) {
					entityId = options.extractEntityId(input);
					// You would implement entity fetching here based on your repository pattern
					// before = await fetchEntityById(options.entityType, entityId);
				}
			}

			// Execute the main procedure
			const result = await next();

			// Extract entity ID from result if not already available
			if (!entityId && options.extractEntityId) {
				entityId = options.extractEntityId(input, result);
			}

			// Extract changes for the audit log
			const changes = options.extractChanges
				? options.extractChanges(input, result, before)
				: input;

			// Determine client ID if applicable
			const clientId = options.clientId ? options.clientId(input, ctx) : null;

			// Create audit log entry
			const auditEntry: AuditLogEntry = {
				tenantId: ctx.user.tenantId,
				actorUserId: ctx.user.id,
				clientId,
				entityType: options.entityType,
				entityId: entityId || 0,
				action: options.action,
				changes,
				ipAddress:
					(ctx.req?.headers?.["x-forwarded-for"] as string) ||
					(ctx.req?.headers?.["x-real-ip"] as string) ||
					ctx.req?.connection?.remoteAddress,
				userAgent: ctx.req?.headers?.["user-agent"] as string,
			};

			// Log the audit entry (fire and forget to not affect main operation)
			await ctx.auditService.log(auditEntry);

			return result;
		} catch (error) {
			// If the main operation failed, we might still want to log the attempt
			if (ctx.auditService && entityId) {
				const failedEntry: AuditLogEntry = {
					tenantId: ctx.user?.tenantId || 0,
					actorUserId: ctx.user?.id || null,
					clientId: options.clientId ? options.clientId(input, ctx) : null,
					entityType: options.entityType,
					entityId: entityId,
					action: `${options.action}.failed`,
					changes: {
						error: error instanceof Error ? error.message : "Unknown error",
						input: input,
					},
					ipAddress:
						(ctx.req?.headers?.["x-forwarded-for"] as string) ||
						(ctx.req?.headers?.["x-real-ip"] as string) ||
						ctx.req?.connection?.remoteAddress,
					userAgent: ctx.req?.headers?.["user-agent"] as string,
				};

				await ctx.auditService.log(failedEntry);
			}

			throw error;
		}
	};
}

/**
 * Pre-configured audit middleware for common operations
 */
export const auditMiddlewares = {
	// Client operations
	clientCreate: createAuditMiddleware({
		entityType: EntityTypes.CLIENT,
		action: AuditActions.CLIENT_CREATE,
		extractEntityId: (input, result) => result?.id,
		extractChanges: (input) => input,
	}),

	clientUpdate: createAuditMiddleware({
		entityType: EntityTypes.CLIENT,
		action: AuditActions.CLIENT_UPDATE,
		extractEntityId: (input) => input.id,
		extractChanges: (input) => input,
		clientId: (input) => input.id,
	}),

	clientDelete: createAuditMiddleware({
		entityType: EntityTypes.CLIENT,
		action: AuditActions.CLIENT_DELETE,
		extractEntityId: (input) => input.id,
		extractChanges: (input) => ({ deletedId: input.id }),
		clientId: (input) => input.id,
	}),

	clientView: createAuditMiddleware({
		entityType: EntityTypes.CLIENT,
		action: AuditActions.CLIENT_VIEW,
		extractEntityId: (input) => input.id,
		extractChanges: () => ({}),
		clientId: (input) => input.id,
		skipAudit: (input) => input.skipAudit === true, // Allow skipping for frequent reads
	}),

	// Document operations
	documentUpload: createAuditMiddleware({
		entityType: EntityTypes.DOCUMENT,
		action: AuditActions.DOCUMENT_UPLOAD,
		extractEntityId: (input, result) => result?.id,
		extractChanges: (input) => ({
			fileName: input.fileName,
			fileSize: input.fileSize,
			documentType: input.documentType,
		}),
		clientId: (input) => input.clientId,
	}),

	documentDownload: createAuditMiddleware({
		entityType: EntityTypes.DOCUMENT,
		action: AuditActions.DOCUMENT_DOWNLOAD,
		extractEntityId: (input) => input.id,
		extractChanges: () => ({}),
		clientId: (input, ctx) => input.clientId,
		skipAudit: (input) => input.skipAudit === true,
	}),

	documentDelete: createAuditMiddleware({
		entityType: EntityTypes.DOCUMENT,
		action: AuditActions.DOCUMENT_DELETE,
		extractEntityId: (input) => input.id,
		extractChanges: (input) => ({ deletedId: input.id }),
		clientId: (input) => input.clientId,
	}),

	// Filing operations
	filingCreate: createAuditMiddleware({
		entityType: EntityTypes.FILING,
		action: AuditActions.FILING_CREATE,
		extractEntityId: (input, result) => result?.id,
		extractChanges: (input) => input,
		clientId: (input) => input.clientId,
	}),

	filingSubmit: createAuditMiddleware({
		entityType: EntityTypes.FILING,
		action: AuditActions.FILING_SUBMIT,
		extractEntityId: (input) => input.id,
		extractChanges: (input) => ({
			submittedAt: new Date(),
			status: "submitted",
		}),
		clientId: (input) => input.clientId,
	}),

	filingUpdate: createAuditMiddleware({
		entityType: EntityTypes.FILING,
		action: AuditActions.FILING_UPDATE,
		extractEntityId: (input) => input.id,
		extractChanges: (input) => input,
		clientId: (input) => input.clientId,
	}),

	// User operations
	userCreate: createAuditMiddleware({
		entityType: EntityTypes.USER,
		action: AuditActions.USER_CREATE,
		extractEntityId: (input, result) => result?.id,
		extractChanges: (input) => ({
			name: input.name,
			email: input.email,
			role: input.role,
		}),
	}),

	userUpdate: createAuditMiddleware({
		entityType: EntityTypes.USER,
		action: AuditActions.USER_UPDATE,
		extractEntityId: (input) => input.id,
		extractChanges: (input) => input,
	}),

	userDelete: createAuditMiddleware({
		entityType: EntityTypes.USER,
		action: AuditActions.USER_DELETE,
		extractEntityId: (input) => input.id,
		extractChanges: (input) => ({ deletedId: input.id }),
	}),

	// Compliance operations
	complianceAssessment: createAuditMiddleware({
		entityType: EntityTypes.COMPLIANCE,
		action: AuditActions.COMPLIANCE_ASSESSMENT,
		extractEntityId: (input) => input.clientId,
		extractChanges: (input, result) => ({
			assessmentType: input.type,
			score: result?.score,
			findings: result?.findings,
		}),
		clientId: (input) => input.clientId,
	}),

	complianceScoreUpdate: createAuditMiddleware({
		entityType: EntityTypes.COMPLIANCE,
		action: AuditActions.COMPLIANCE_SCORE_UPDATE,
		extractEntityId: (input) => input.clientId,
		extractChanges: (input, result) => ({
			oldScore: input.oldScore,
			newScore: result?.score,
			reason: input.reason,
		}),
		clientId: (input) => input.clientId,
	}),
};

/**
 * Audit decorator for class methods
 * Usage: @Audit(auditOptions)
 */
export function Audit(options: AuditMiddlewareOptions) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			// Extract context from method arguments (assuming it's typically the first arg)
			const ctx = args[0];

			if (ctx && ctx.auditService) {
				const middleware = createAuditMiddleware(options);
				return middleware({
					ctx,
					next: () => originalMethod.apply(this, args),
					path: `${target.constructor.name}.${propertyKey}`,
					input: args[1] || {},
				});
			}

			// Fallback to original method if no audit context
			return originalMethod.apply(this, args);
		};

		return descriptor;
	};
}

/**
 * Audit helper functions
 */
export const auditHelpers = {
	/**
	 * Create audit log entry for authentication events
	 */
	loginAttempt: async (
		auditService: AuditService,
		tenantId: number,
		userId: string | null,
		success: boolean,
		ipAddress?: string,
		userAgent?: string,
	) => {
		await auditService.log({
			tenantId,
			actorUserId: userId,
			entityType: EntityTypes.USER,
			entityId: userId || "anonymous",
			action: success
				? AuditActions.USER_LOGIN
				: AuditActions.SECURITY_LOGIN_ATTEMPT,
			changes: { success, timestamp: new Date() },
			ipAddress,
			userAgent,
		});
	},

	/**
	 * Create audit log entry for system events
	 */
	systemEvent: async (
		auditService: AuditService,
		tenantId: number,
		action: string,
		details: any,
		actorUserId?: string,
	) => {
		await auditService.log({
			tenantId,
			actorUserId,
			entityType: EntityTypes.SYSTEM,
			entityId: "system",
			action,
			changes: details,
		});
	},

	/**
	 * Create audit log entry for permission changes
	 */
	permissionChange: async (
		auditService: AuditService,
		tenantId: number,
		actorUserId: string,
		targetUserId: string,
		permission: string,
		granted: boolean,
	) => {
		await auditService.log({
			tenantId,
			actorUserId,
			entityType: EntityTypes.PERMISSION,
			entityId: targetUserId,
			action: granted
				? AuditActions.SECURITY_PERMISSION_GRANT
				: AuditActions.SECURITY_PERMISSION_REVOKE,
			changes: { permission, granted, targetUserId },
		});
	},
};
