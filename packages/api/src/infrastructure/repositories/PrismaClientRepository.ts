/**
 * Prisma Client Repository Implementation
 *
 * Infrastructure layer implementation of client repository using Prisma ORM
 */

import type { Prisma } from "@GCMC-KAJ/db";
import prisma from "@GCMC-KAJ/db";
import {
	Client,
	type ClientType,
	type RiskLevel,
} from "../../domains/client/entities/Client";
import type {
	ClientRepository,
	ClientSearchCriteria,
} from "../../domains/client/repositories/ClientRepository";

export class PrismaClientRepository implements ClientRepository {
	async findById(id: number, tenantId: number): Promise<Client | null> {
		const clientData = await prisma.client.findUnique({
			where: {
				id,
				tenantId,
			},
		});

		return clientData ? this.toDomain(clientData) : null;
	}

	async findByEmail(email: string, tenantId: number): Promise<Client | null> {
		const clientData = await prisma.client.findFirst({
			where: {
				email,
				tenantId,
			},
		});

		return clientData ? this.toDomain(clientData) : null;
	}

	async findByTin(tin: string, tenantId: number): Promise<Client | null> {
		const clientData = await prisma.client.findFirst({
			where: {
				tin,
				tenantId,
			},
		});

		return clientData ? this.toDomain(clientData) : null;
	}

	async findMany(criteria: ClientSearchCriteria): Promise<Client[]> {
		const where = this.buildWhereClause(criteria);

		const clientsData = await prisma.client.findMany({
			where,
			orderBy: [{ name: "asc" }],
		});

		return clientsData.map(this.toDomain);
	}

	async countBy(criteria: ClientSearchCriteria): Promise<number> {
		const where = this.buildWhereClause(criteria);
		return prisma.client.count({ where });
	}

	async save(client: Client): Promise<Client> {
		const clientData = client.toJSON();

		if (clientData.id === 0) {
			// Create new client
			const { id, ...createData } = clientData;
			const created = await prisma.client.create({
				data: createData,
			});
			return this.toDomain(created);
		}
		// Update existing client
		const { id, createdAt, ...updateData } = clientData;
		const updated = await prisma.client.update({
			where: {
				id: clientData.id,
				tenantId: clientData.tenantId,
			},
			data: updateData,
		});
		return this.toDomain(updated);
	}

	async delete(id: number, tenantId: number): Promise<void> {
		await prisma.client.delete({
			where: {
				id,
				tenantId,
			},
		});
	}

	private buildWhereClause(
		criteria: ClientSearchCriteria,
	): Prisma.ClientWhereInput {
		const where: Prisma.ClientWhereInput = {
			tenantId: criteria.tenantId,
		};

		if (criteria.type) {
			where.type = criteria.type;
		}

		if (criteria.riskLevel) {
			where.riskLevel = criteria.riskLevel;
		}

		if (criteria.sector) {
			where.sector = criteria.sector;
		}

		if (criteria.search) {
			where.OR = [
				{ name: { contains: criteria.search, mode: "insensitive" } },
				{ email: { contains: criteria.search, mode: "insensitive" } },
				{ phone: { contains: criteria.search, mode: "insensitive" } },
				{ tin: { contains: criteria.search, mode: "insensitive" } },
			];
		}

		return where;
	}

	private toDomain(prismaClient: any): Client {
		return new Client({
			id: prismaClient.id,
			tenantId: prismaClient.tenantId,
			name: prismaClient.name,
			type: prismaClient.type as ClientType,
			email: prismaClient.email,
			phone: prismaClient.phone,
			address: prismaClient.address,
			tin: prismaClient.tin,
			nisNumber: prismaClient.nisNumber,
			sector: prismaClient.sector,
			riskLevel: prismaClient.riskLevel as RiskLevel,
			notes: prismaClient.notes,
			createdAt: prismaClient.createdAt,
			updatedAt: prismaClient.updatedAt,
		});
	}
}
