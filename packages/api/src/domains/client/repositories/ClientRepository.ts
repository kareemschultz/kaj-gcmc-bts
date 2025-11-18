/**
 * Client Repository Interface
 *
 * Domain repository pattern for client aggregate persistence
 */

import type { Client, ClientType, RiskLevel } from "../entities/Client";

export interface ClientSearchCriteria {
	tenantId: number;
	type?: ClientType;
	riskLevel?: RiskLevel;
	sector?: string;
	search?: string;
	active?: boolean;
}

export interface ClientRepository {
	findById(id: number, tenantId: number): Promise<Client | null>;
	findByEmail(email: string, tenantId: number): Promise<Client | null>;
	findByTin(tin: string, tenantId: number): Promise<Client | null>;
	findMany(criteria: ClientSearchCriteria): Promise<Client[]>;
	countBy(criteria: ClientSearchCriteria): Promise<number>;
	save(client: Client): Promise<Client>;
	delete(id: number, tenantId: number): Promise<void>;
}
