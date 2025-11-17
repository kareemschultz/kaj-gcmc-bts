/**
 * Clients tRPC Router
 *
 * Handles client management operations: list, get, create, update, delete
 * Enforces tenant isolation and RBAC permissions
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";
import { queueWelcomeEmail } from "../utils/emailQueue";

/**
 * Client validation schema
 */
export const clientSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	type: z.enum(["individual", "company", "partnership"]),
	email: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
	phone: z.string().optional(),
	address: z.string().optional(),
	tin: z.string().optional(),
	nisNumber: z.string().optional(),
	sector: z.string().optional(),
	riskLevel: z.enum(["low", "medium", "high"]).optional(),
	notes: z.string().optional(),
});

/**
 * Clients router
 */
export const clientsRouter = router({
	/**
	 * List clients with filtering and pagination
	 * Requires: clients:view permission
	 */
	list: rbacProcedure("clients", "view")
		.input(
			z
				.object({
					search: z.string().optional(),
					type: z.string().optional(),
					sector: z.string().optional(),
					riskLevel: z.string().optional(),
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const {
				search = "",
				type,
				sector,
				riskLevel,
				page = 1,
				pageSize = 20,
			} = input || {};

			const skip = (page - 1) * pageSize;

			const where: Prisma.ClientWhereInput = { tenantId: ctx.tenantId };

			if (search) {
				where.OR = [
					{ name: { contains: search, mode: "insensitive" } },
					{ email: { contains: search, mode: "insensitive" } },
					{ tin: { contains: search, mode: "insensitive" } },
					{ nisNumber: { contains: search, mode: "insensitive" } },
				];
			}

			if (type) where.type = type;
			if (sector) where.sector = sector;
			if (riskLevel) where.riskLevel = riskLevel;

			const [clients, total] = await Promise.all([
				prisma.client.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
					include: {
						_count: {
							select: {
								documents: true,
								filings: true,
								serviceRequests: true,
							},
						},
					},
				}),
				prisma.client.count({ where }),
			]);

			return {
				clients,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * Get single client by ID
	 * Requires: clients:view permission
	 */
	get: rbacProcedure("clients", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const client = await prisma.client.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId, // Tenant isolation
				},
				include: {
					businesses: true,
					_count: {
						select: {
							documents: true,
							filings: true,
							serviceRequests: true,
							tasks: true,
						},
					},
				},
			});

			if (!client) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client not found",
				});
			}

			return client;
		}),

	/**
	 * Create new client
	 * Requires: clients:create permission
	 */
	create: rbacProcedure("clients", "create")
		.input(clientSchema)
		.mutation(async ({ ctx, input }) => {
			const client = await prisma.client.create({
				data: {
					...input,
					tenantId: ctx.tenantId,
					// Convert undefined to null for optional properties to satisfy exactOptionalPropertyTypes
					email: input.email || null,
					phone: input.phone || null,
					address: input.address || null,
					tin: input.tin || null,
					nisNumber: input.nisNumber || null,
					sector: input.sector || null,
					riskLevel: input.riskLevel || null,
					notes: input.notes || null,
				},
				include: {
					tenant: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: client.id,
					entityType: "client",
					entityId: client.id,
					action: "create",
					changes: { created: input },
				},
			});

			// Send welcome email if client has email
			if (client.email) {
				const contactInfo = (
					client as typeof client & {
						tenant: { contactInfo: unknown; name: string };
					}
				).tenant.contactInfo;
				let tenantSupportEmail: string | undefined;

				if (
					contactInfo &&
					typeof contactInfo === "object" &&
					!Array.isArray(contactInfo)
				) {
					const emailValue = (contactInfo as Record<string, unknown>).email;
					if (typeof emailValue === "string") {
						tenantSupportEmail = emailValue;
					}
				}

				try {
					await queueWelcomeEmail(client.email, {
						clientName: client.name,
						tenantName: (
							client as typeof client & {
								tenant: { contactInfo: unknown; name: string };
							}
						).tenant.name,
						portalUrl: process.env.PORTAL_URL || "https://portal.gcmc.com",
						supportEmail:
							process.env.SUPPORT_EMAIL ||
							tenantSupportEmail ||
							"support@gcmc.com",
					});
				} catch (error) {
					console.error("Failed to queue welcome email:", error);
					// Don't fail the request if email fails
				}
			}

			return client;
		}),

	/**
	 * Update existing client
	 * Requires: clients:edit permission
	 */
	update: rbacProcedure("clients", "edit")
		.input(
			z.object({
				id: z.number(),
				data: clientSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify client belongs to tenant
			const existing = await prisma.client.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client not found",
				});
			}

			const updated = await prisma.client.update({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				data: {
					// Convert undefined to null for optional properties to satisfy exactOptionalPropertyTypes
					...(input.data.name !== undefined && { name: input.data.name }),
					...(input.data.type !== undefined && { type: input.data.type }),
					...(input.data.email !== undefined && {
						email: input.data.email || null,
					}),
					...(input.data.phone !== undefined && {
						phone: input.data.phone || null,
					}),
					...(input.data.address !== undefined && {
						address: input.data.address || null,
					}),
					...(input.data.tin !== undefined && { tin: input.data.tin || null }),
					...(input.data.nisNumber !== undefined && {
						nisNumber: input.data.nisNumber || null,
					}),
					...(input.data.sector !== undefined && {
						sector: input.data.sector || null,
					}),
					...(input.data.riskLevel !== undefined && {
						riskLevel: input.data.riskLevel || null,
					}),
					...(input.data.notes !== undefined && {
						notes: input.data.notes || null,
					}),
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: updated.id,
					entityType: "client",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete client
	 * Requires: clients:delete permission
	 */
	delete: rbacProcedure("clients", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			// Verify client belongs to tenant
			const existing = await prisma.client.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client not found",
				});
			}

			await prisma.client.delete({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: input.id,
					entityType: "client",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get client statistics
	 * Requires: clients:view permission
	 */
	stats: rbacProcedure("clients", "view").query(async ({ ctx }) => {
		const [total, byType, byRiskLevel] = await Promise.all([
			prisma.client.count({ where: { tenantId: ctx.tenantId } }),
			prisma.client.groupBy({
				by: ["type"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
			prisma.client.groupBy({
				by: ["riskLevel"],
				where: { tenantId: ctx.tenantId, riskLevel: { not: null } },
				_count: true,
			}),
		]);

		return {
			total,
			byType,
			byRiskLevel,
		};
	}),
});
