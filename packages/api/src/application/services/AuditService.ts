/**
 * Audit Service
 *
 * Centralized audit logging service for comprehensive activity tracking
 * Implements audit trail for compliance and security purposes
 */

import type { AuditLog, PrismaClient } from "@gcmc-kaj/db";

export interface AuditLogEntry {
	tenantId: number;
	actorUserId?: string | null;
	clientId?: number | null;
	entityType: string;
	entityId: number | string;
	action: string;
	changes?: any;
	metadata?: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
}

export interface AuditQueryOptions {
	tenantId: number;
	actorUserId?: string;
	clientId?: number;
	entityType?: string;
	action?: string;
	dateRange?: {
		from: Date;
		to: Date;
	};
	limit?: number;
	offset?: number;
	orderBy?: "createdAt" | "action" | "entityType";
	order?: "asc" | "desc";
}

export interface AuditService {
	log(entry: AuditLogEntry): Promise<void>;
	getAuditLogs(options: AuditQueryOptions): Promise<AuditLog[]>;
	getAuditLogCount(
		options: Omit<AuditQueryOptions, "limit" | "offset" | "orderBy" | "order">,
	): Promise<number>;
	getAuditLogsByEntity(
		tenantId: number,
		entityType: string,
		entityId: number | string,
	): Promise<AuditLog[]>;
	getUserActivity(
		tenantId: number,
		actorUserId: string,
		limit?: number,
	): Promise<AuditLog[]>;
	getClientActivity(
		tenantId: number,
		clientId: number,
		limit?: number,
	): Promise<AuditLog[]>;
}

export class PrismaAuditService implements AuditService {
	constructor(private prisma: PrismaClient) {}

	async log(entry: AuditLogEntry): Promise<void> {
		try {
			// Convert entityId to number if it's a string and represents a number
			let numericEntityId: number;
			if (typeof entry.entityId === "string") {
				numericEntityId = Number.parseInt(entry.entityId);
				if (isNaN(numericEntityId)) {
					// If entityId is not a valid number, hash it or store it differently
					numericEntityId = entry.entityId.length; // Simple fallback
				}
			} else {
				numericEntityId = entry.entityId;
			}

			await this.prisma.auditLog.create({
				data: {
					tenantId: entry.tenantId,
					actorUserId: entry.actorUserId,
					clientId: entry.clientId,
					entityType: entry.entityType,
					entityId: numericEntityId,
					action: entry.action,
					changes: entry.changes || {},
					ipAddress: entry.ipAddress,
					userAgent: entry.userAgent,
				},
			});
		} catch (error) {
			console.error("Failed to log audit entry:", error);
			// Don't throw to avoid breaking the main operation
		}
	}

	async getAuditLogs(options: AuditQueryOptions): Promise<AuditLog[]> {
		const {
			tenantId,
			actorUserId,
			clientId,
			entityType,
			action,
			dateRange,
			limit = 50,
			offset = 0,
			orderBy = "createdAt",
			order = "desc",
		} = options;

		const where: any = {
			tenantId,
			...(actorUserId && { actorUserId }),
			...(clientId && { clientId }),
			...(entityType && { entityType }),
			...(action && { action }),
			...(dateRange && {
				createdAt: {
					gte: dateRange.from,
					lte: dateRange.to,
				},
			}),
		};

		return await this.prisma.auditLog.findMany({
			where,
			include: {
				actor: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				client: {
					select: {
						id: true,
						name: true,
						type: true,
					},
				},
			},
			orderBy: {
				[orderBy]: order,
			},
			take: limit,
			skip: offset,
		});
	}

	async getAuditLogCount(
		options: Omit<AuditQueryOptions, "limit" | "offset" | "orderBy" | "order">,
	): Promise<number> {
		const { tenantId, actorUserId, clientId, entityType, action, dateRange } =
			options;

		const where: any = {
			tenantId,
			...(actorUserId && { actorUserId }),
			...(clientId && { clientId }),
			...(entityType && { entityType }),
			...(action && { action }),
			...(dateRange && {
				createdAt: {
					gte: dateRange.from,
					lte: dateRange.to,
				},
			}),
		};

		return await this.prisma.auditLog.count({ where });
	}

	async getAuditLogsByEntity(
		tenantId: number,
		entityType: string,
		entityId: number | string,
	): Promise<AuditLog[]> {
		// Convert entityId to number if needed
		let numericEntityId: number;
		if (typeof entityId === "string") {
			numericEntityId = Number.parseInt(entityId);
			if (isNaN(numericEntityId)) {
				numericEntityId = entityId.length; // Same fallback as in log method
			}
		} else {
			numericEntityId = entityId;
		}

		return await this.prisma.auditLog.findMany({
			where: {
				tenantId,
				entityType,
				entityId: numericEntityId,
			},
			include: {
				actor: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	}

	async getUserActivity(
		tenantId: number,
		actorUserId: string,
		limit = 100,
	): Promise<AuditLog[]> {
		return await this.prisma.auditLog.findMany({
			where: {
				tenantId,
				actorUserId,
			},
			include: {
				client: {
					select: {
						id: true,
						name: true,
						type: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: limit,
		});
	}

	async getClientActivity(
		tenantId: number,
		clientId: number,
		limit = 100,
	): Promise<AuditLog[]> {
		return await this.prisma.auditLog.findMany({
			where: {
				tenantId,
				clientId,
			},
			include: {
				actor: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: limit,
		});
	}
}

// Audit action constants
export const AuditActions = {
	// User Actions
	USER_LOGIN: "user.login",
	USER_LOGOUT: "user.logout",
	USER_CREATE: "user.create",
	USER_UPDATE: "user.update",
	USER_DELETE: "user.delete",

	// Client Actions
	CLIENT_CREATE: "client.create",
	CLIENT_UPDATE: "client.update",
	CLIENT_DELETE: "client.delete",
	CLIENT_VIEW: "client.view",

	// Document Actions
	DOCUMENT_UPLOAD: "document.upload",
	DOCUMENT_DOWNLOAD: "document.download",
	DOCUMENT_DELETE: "document.delete",
	DOCUMENT_UPDATE: "document.update",
	DOCUMENT_VIEW: "document.view",

	// Filing Actions
	FILING_CREATE: "filing.create",
	FILING_SUBMIT: "filing.submit",
	FILING_UPDATE: "filing.update",
	FILING_DELETE: "filing.delete",

	// Compliance Actions
	COMPLIANCE_ASSESSMENT: "compliance.assessment",
	COMPLIANCE_SCORE_UPDATE: "compliance.score_update",
	COMPLIANCE_ALERT: "compliance.alert",

	// System Actions
	SYSTEM_BACKUP: "system.backup",
	SYSTEM_CONFIG_UPDATE: "system.config_update",
	SYSTEM_MAINTENANCE: "system.maintenance",

	// Security Actions
	SECURITY_PERMISSION_GRANT: "security.permission_grant",
	SECURITY_PERMISSION_REVOKE: "security.permission_revoke",
	SECURITY_LOGIN_ATTEMPT: "security.login_attempt",
	SECURITY_PASSWORD_CHANGE: "security.password_change",
} as const;

// Entity type constants
export const EntityTypes = {
	USER: "user",
	CLIENT: "client",
	DOCUMENT: "document",
	FILING: "filing",
	COMPLIANCE: "compliance",
	TENANT: "tenant",
	ROLE: "role",
	PERMISSION: "permission",
	SYSTEM: "system",
} as const;
