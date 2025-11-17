/**
 * Audit Service
 *
 * Centralized audit logging service
 */

export interface AuditLogEntry {
  tenantId: number;
  actorUserId: string;
  entityType: string;
  entityId: number;
  action: string;
  changes?: any;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditService {
  log(entry: AuditLogEntry): Promise<void>;
}