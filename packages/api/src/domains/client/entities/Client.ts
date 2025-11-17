/**
 * Client Domain Entity
 *
 * Core business entity representing a client in the compliance platform
 * Implements domain rules and business logic
 */

import type { User } from "../../auth/entities/User";
import { DomainError } from "../../shared/errors/DomainError";
import { DomainEvent } from "../../shared/events/DomainEvent";

export interface ClientProps {
  id: number;
  tenantId: number;
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  address?: string;
  tin?: string;
  nisNumber?: string;
  sector?: string;
  riskLevel?: RiskLevel;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ClientType {
  INDIVIDUAL = "individual",
  COMPANY = "company",
  PARTNERSHIP = "partnership"
}

export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

export class Client {
  private _id: number;
  private _tenantId: number;
  private _name: string;
  private _type: ClientType;
  private _email?: string;
  private _phone?: string;
  private _address?: string;
  private _tin?: string;
  private _nisNumber?: string;
  private _sector?: string;
  private _riskLevel?: RiskLevel;
  private _notes?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _domainEvents: DomainEvent[] = [];

  constructor(props: ClientProps) {
    this.validateClientData(props);

    this._id = props.id;
    this._tenantId = props.tenantId;
    this._name = props.name;
    this._type = props.type;
    this._email = props.email;
    this._phone = props.phone;
    this._address = props.address;
    this._tin = props.tin;
    this._nisNumber = props.nisNumber;
    this._sector = props.sector;
    this._riskLevel = props.riskLevel;
    this._notes = props.notes;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get id(): number { return this._id; }
  get tenantId(): number { return this._tenantId; }
  get name(): string { return this._name; }
  get type(): ClientType { return this._type; }
  get email(): string | undefined { return this._email; }
  get phone(): string | undefined { return this._phone; }
  get address(): string | undefined { return this._address; }
  get tin(): string | undefined { return this._tin; }
  get nisNumber(): string | undefined { return this._nisNumber; }
  get sector(): string | undefined { return this._sector; }
  get riskLevel(): RiskLevel | undefined { return this._riskLevel; }
  get notes(): string | undefined { return this._notes; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get domainEvents(): DomainEvent[] { return [...this._domainEvents]; }

  /**
   * Business logic: Update client information
   */
  updateInfo(data: Partial<Omit<ClientProps, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>, updatedBy: User): void {
    const oldData = { ...this.toJSON() };

    if (data.name) this._name = data.name;
    if (data.type) this._type = data.type;
    if (data.email !== undefined) this._email = data.email;
    if (data.phone !== undefined) this._phone = data.phone;
    if (data.address !== undefined) this._address = data.address;
    if (data.tin !== undefined) this._tin = data.tin;
    if (data.nisNumber !== undefined) this._nisNumber = data.nisNumber;
    if (data.sector !== undefined) this._sector = data.sector;
    if (data.riskLevel !== undefined) this._riskLevel = data.riskLevel;
    if (data.notes !== undefined) this._notes = data.notes;

    this._updatedAt = new Date();

    // Validate updated data
    this.validateClientData(this.toJSON());

    // Domain event for audit trail
    this._domainEvents.push(new DomainEvent(
      'client.updated',
      {
        clientId: this._id,
        tenantId: this._tenantId,
        oldData,
        newData: this.toJSON(),
        updatedBy: updatedBy.id,
        timestamp: new Date()
      }
    ));
  }

  /**
   * Business logic: Assess risk level based on business rules
   */
  assessRiskLevel(): RiskLevel {
    let riskScore = 0;

    // Company type adds risk
    if (this._type === ClientType.COMPANY) riskScore += 1;
    if (this._type === ClientType.PARTNERSHIP) riskScore += 2;

    // High-risk sectors
    const highRiskSectors = ['finance', 'mining', 'gambling', 'cryptocurrency'];
    if (this._sector && highRiskSectors.includes(this._sector.toLowerCase())) {
      riskScore += 2;
    }

    // Missing key information adds risk
    if (!this._tin) riskScore += 1;
    if (!this._email && !this._phone) riskScore += 1;

    const newRiskLevel = riskScore <= 1 ? RiskLevel.LOW :
                        riskScore <= 3 ? RiskLevel.MEDIUM :
                        RiskLevel.HIGH;

    if (newRiskLevel !== this._riskLevel) {
      const oldRiskLevel = this._riskLevel;
      this._riskLevel = newRiskLevel;
      this._updatedAt = new Date();

      this._domainEvents.push(new DomainEvent(
        'client.risk_level_changed',
        {
          clientId: this._id,
          tenantId: this._tenantId,
          oldRiskLevel,
          newRiskLevel,
          riskScore,
          timestamp: new Date()
        }
      ));
    }

    return newRiskLevel;
  }

  /**
   * Business rule: Can client be archived?
   */
  canBeArchived(): boolean {
    // Add business rules for archiving
    // For example: no active filings, no outstanding documents, etc.
    return true; // Simplified for now
  }

  /**
   * Clear domain events after publishing
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  private validateClientData(props: ClientProps): void {
    if (!props.name?.trim()) {
      throw new DomainError('Client name is required', 'CLIENT_INVALID_NAME');
    }

    if (props.name.length > 255) {
      throw new DomainError('Client name cannot exceed 255 characters', 'CLIENT_NAME_TOO_LONG');
    }

    if (!Object.values(ClientType).includes(props.type)) {
      throw new DomainError('Invalid client type', 'CLIENT_INVALID_TYPE');
    }

    if (props.email && !this.isValidEmail(props.email)) {
      throw new DomainError('Invalid email format', 'CLIENT_INVALID_EMAIL');
    }

    if (props.tin && props.tin.length > 50) {
      throw new DomainError('TIN cannot exceed 50 characters', 'CLIENT_TIN_TOO_LONG');
    }

    if (props.riskLevel && !Object.values(RiskLevel).includes(props.riskLevel)) {
      throw new DomainError('Invalid risk level', 'CLIENT_INVALID_RISK_LEVEL');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toJSON(): ClientProps {
    return {
      id: this._id,
      tenantId: this._tenantId,
      name: this._name,
      type: this._type,
      email: this._email,
      phone: this._phone,
      address: this._address,
      tin: this._tin,
      nisNumber: this._nisNumber,
      sector: this._sector,
      riskLevel: this._riskLevel,
      notes: this._notes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  static create(props: Omit<ClientProps, 'id' | 'createdAt' | 'updatedAt'>, createdBy: User): Client {
    const now = new Date();
    const client = new Client({
      ...props,
      id: 0, // Will be set by repository
      createdAt: now,
      updatedAt: now
    });

    client._domainEvents.push(new DomainEvent(
      'client.created',
      {
        tenantId: props.tenantId,
        clientData: client.toJSON(),
        createdBy: createdBy.id,
        timestamp: now
      }
    ));

    return client;
  }
}