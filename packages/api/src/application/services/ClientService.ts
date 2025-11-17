/**
 * Client Application Service
 *
 * Orchestrates client operations and business workflows
 */

import type { User } from "../../domains/auth/entities/User";
import { Client, ClientType, RiskLevel } from "../../domains/client/entities/Client";
import type { ClientRepository, ClientSearchCriteria } from "../../domains/client/repositories/ClientRepository";
import { ConflictError, NotFoundError, ValidationError } from "../../domains/shared/errors/DomainError";
import { domainEventDispatcher } from "../../domains/shared/events/DomainEvent";
import type { AuditService } from "./AuditService";

export interface CreateClientDTO {
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  address?: string;
  tin?: string;
  nisNumber?: string;
  sector?: string;
  notes?: string;
}

export interface UpdateClientDTO {
  name?: string;
  type?: ClientType;
  email?: string;
  phone?: string;
  address?: string;
  tin?: string;
  nisNumber?: string;
  sector?: string;
  riskLevel?: RiskLevel;
  notes?: string;
}

export interface ClientListQuery {
  type?: ClientType;
  riskLevel?: RiskLevel;
  sector?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClientListResult {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly auditService: AuditService
  ) {}

  async createClient(
    data: CreateClientDTO,
    tenantId: number,
    createdBy: User
  ): Promise<Client> {
    // Business rule: Check for duplicate email/TIN
    if (data.email) {
      const existingByEmail = await this.clientRepository.findByEmail(data.email, tenantId);
      if (existingByEmail) {
        throw new ConflictError('Client with this email already exists', 'CLIENT_EMAIL_EXISTS');
      }
    }

    if (data.tin) {
      const existingByTin = await this.clientRepository.findByTin(data.tin, tenantId);
      if (existingByTin) {
        throw new ConflictError('Client with this TIN already exists', 'CLIENT_TIN_EXISTS');
      }
    }

    // Create domain entity
    const client = Client.create({
      ...data,
      tenantId
    }, createdBy);

    // Assess initial risk level
    client.assessRiskLevel();

    // Persist to repository
    const savedClient = await this.clientRepository.save(client);

    // Dispatch domain events
    await domainEventDispatcher.dispatchMany(client.domainEvents);
    savedClient.clearDomainEvents();

    // Audit logging
    await this.auditService.log({
      tenantId,
      actorUserId: createdBy.id,
      entityType: 'client',
      entityId: savedClient.id,
      action: 'create',
      changes: { created: savedClient.toJSON() }
    });

    return savedClient;
  }

  async updateClient(
    clientId: number,
    data: UpdateClientDTO,
    tenantId: number,
    updatedBy: User
  ): Promise<Client> {
    const client = await this.clientRepository.findById(clientId, tenantId);
    if (!client) {
      throw new NotFoundError('Client', clientId);
    }

    // Business rule: Check for duplicate email/TIN (if changing)
    if (data.email && data.email !== client.email) {
      const existingByEmail = await this.clientRepository.findByEmail(data.email, tenantId);
      if (existingByEmail && existingByEmail.id !== clientId) {
        throw new ConflictError('Client with this email already exists', 'CLIENT_EMAIL_EXISTS');
      }
    }

    if (data.tin && data.tin !== client.tin) {
      const existingByTin = await this.clientRepository.findByTin(data.tin, tenantId);
      if (existingByTin && existingByTin.id !== clientId) {
        throw new ConflictError('Client with this TIN already exists', 'CLIENT_TIN_EXISTS');
      }
    }

    const oldData = client.toJSON();

    // Update entity
    client.updateInfo(data, updatedBy);

    // Re-assess risk level if relevant fields changed
    if (data.type || data.sector || data.tin || data.email || data.phone) {
      client.assessRiskLevel();
    }

    // Persist changes
    const updatedClient = await this.clientRepository.save(client);

    // Dispatch domain events
    await domainEventDispatcher.dispatchMany(client.domainEvents);
    updatedClient.clearDomainEvents();

    // Audit logging
    await this.auditService.log({
      tenantId,
      actorUserId: updatedBy.id,
      entityType: 'client',
      entityId: clientId,
      action: 'update',
      changes: { from: oldData, to: updatedClient.toJSON() }
    });

    return updatedClient;
  }

  async getClient(clientId: number, tenantId: number): Promise<Client> {
    const client = await this.clientRepository.findById(clientId, tenantId);
    if (!client) {
      throw new NotFoundError('Client', clientId);
    }
    return client;
  }

  async listClients(
    query: ClientListQuery,
    tenantId: number
  ): Promise<ClientListResult> {
    const { page = 1, limit = 50 } = query;

    if (limit > 100) {
      throw new ValidationError('Limit cannot exceed 100 items');
    }

    const criteria: ClientSearchCriteria = {
      tenantId,
      type: query.type,
      riskLevel: query.riskLevel,
      sector: query.sector,
      search: query.search
    };

    const [clients, total] = await Promise.all([
      this.clientRepository.findMany(criteria),
      this.clientRepository.countBy(criteria)
    ]);

    // Apply pagination in memory (could be moved to repository for better performance)
    const startIndex = (page - 1) * limit;
    const paginatedClients = clients.slice(startIndex, startIndex + limit);

    return {
      clients: paginatedClients,
      total,
      page,
      limit,
      hasNext: startIndex + limit < total,
      hasPrev: page > 1
    };
  }

  async deleteClient(
    clientId: number,
    tenantId: number,
    deletedBy: User
  ): Promise<void> {
    const client = await this.clientRepository.findById(clientId, tenantId);
    if (!client) {
      throw new NotFoundError('Client', clientId);
    }

    // Business rule: Check if client can be deleted
    if (!client.canBeArchived()) {
      throw new ValidationError('Client cannot be deleted - has active dependencies');
    }

    await this.clientRepository.delete(clientId, tenantId);

    // Audit logging
    await this.auditService.log({
      tenantId,
      actorUserId: deletedBy.id,
      entityType: 'client',
      entityId: clientId,
      action: 'delete',
      changes: { deleted: client.toJSON() }
    });
  }

  async assessClientRisk(
    clientId: number,
    tenantId: number,
    assessedBy: User
  ): Promise<RiskLevel> {
    const client = await this.clientRepository.findById(clientId, tenantId);
    if (!client) {
      throw new NotFoundError('Client', clientId);
    }

    const oldRiskLevel = client.riskLevel;
    const newRiskLevel = client.assessRiskLevel();

    if (oldRiskLevel !== newRiskLevel) {
      await this.clientRepository.save(client);

      // Dispatch domain events
      await domainEventDispatcher.dispatchMany(client.domainEvents);
      client.clearDomainEvents();

      // Audit logging
      await this.auditService.log({
        tenantId,
        actorUserId: assessedBy.id,
        entityType: 'client',
        entityId: clientId,
        action: 'risk_assessment',
        changes: { oldRiskLevel, newRiskLevel }
      });
    }

    return newRiskLevel;
  }
}