/**
 * Client Domain Event Handlers
 *
 * Handles cross-domain operations triggered by client events
 */

import { DomainEvent, type DomainEventHandler } from "../../domains/shared/events/DomainEvent";
import { logger } from "../../infrastructure/logging/Logger";
import { CacheKeyBuilder, CacheTags } from "../../infrastructure/caching/CacheService";
import type { CacheService } from "../../infrastructure/caching/CacheService";
import type { AuditService } from "../services/AuditService";

export class ClientCreatedEventHandler implements DomainEventHandler {
  eventType = 'client.created';

  constructor(
    private cacheService: CacheService,
    private auditService: AuditService
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    const { tenantId, clientData, createdBy } = event.data;

    logger.info('Handling client created event', {
      tenantId,
      clientId: clientData.id,
      createdBy,
      correlationId: event.id
    });

    // Invalidate client list caches
    await this.cacheService.invalidateByTags([
      CacheTags.client(tenantId),
      CacheTags.tenant(tenantId)
    ]);

    // Create welcome tasks or notifications here
    // This demonstrates cross-domain coordination

    logger.info('Client created event handled successfully', {
      tenantId,
      clientId: clientData.id,
      correlationId: event.id
    });
  }
}

export class ClientUpdatedEventHandler implements DomainEventHandler {
  eventType = 'client.updated';

  constructor(
    private cacheService: CacheService,
    private auditService: AuditService
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    const { tenantId, clientId, oldData, newData } = event.data;

    logger.info('Handling client updated event', {
      tenantId,
      clientId,
      correlationId: event.id
    });

    // Invalidate specific client cache
    await this.cacheService.delete(CacheKeyBuilder.client(tenantId, clientId));

    // Invalidate client list caches
    await this.cacheService.invalidateByTags([
      CacheTags.client(tenantId, clientId),
      CacheTags.client(tenantId)
    ]);

    // If risk level changed significantly, create notifications
    if (oldData.riskLevel !== newData.riskLevel && newData.riskLevel === 'high') {
      // Trigger high-risk client notification workflow
      logger.warn('Client risk level increased to high', {
        tenantId,
        clientId,
        oldRiskLevel: oldData.riskLevel,
        newRiskLevel: newData.riskLevel
      });
    }

    logger.info('Client updated event handled successfully', {
      tenantId,
      clientId,
      correlationId: event.id
    });
  }
}

export class ClientRiskLevelChangedEventHandler implements DomainEventHandler {
  eventType = 'client.risk_level_changed';

  constructor(
    private cacheService: CacheService
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    const { tenantId, clientId, oldRiskLevel, newRiskLevel, riskScore } = event.data;

    logger.info('Handling client risk level changed event', {
      tenantId,
      clientId,
      oldRiskLevel,
      newRiskLevel,
      riskScore,
      correlationId: event.id
    });

    // Invalidate compliance-related caches
    await this.cacheService.invalidateByTags([
      CacheTags.compliance(tenantId),
      CacheTags.client(tenantId, clientId)
    ]);

    // Trigger compliance score recalculation if needed
    if (newRiskLevel === 'high') {
      // Could trigger additional compliance checks or notifications
      logger.warn('Client risk level escalated to high', {
        tenantId,
        clientId,
        riskScore
      });
    }

    logger.info('Client risk level changed event handled successfully', {
      tenantId,
      clientId,
      correlationId: event.id
    });
  }
}