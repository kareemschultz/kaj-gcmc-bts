/**
 * Wizards tRPC Router
 *
 * Handles guided workflows and wizards
 * Enforces tenant isolation and RBAC permissions
 */

import prisma from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Wizards router
 */
export const wizardsRouter = router({
	/**
	 * New client wizard - Complete client onboarding
	 * Requires: clients:create permission
	 */
	newClient: rbacProcedure("clients", "create")
		.input(
			z.object({
				// Client basic info
				client: z.object({
					name: z.string().min(1),
					type: z.enum(["individual", "company", "partnership"]),
					email: z.string().email().optional(),
					phone: z.string().optional(),
					address: z.string().optional(),
					tin: z.string().optional(),
					nisNumber: z.string().optional(),
					sector: z.string().optional(),
					riskLevel: z.enum(["low", "medium", "high"]).optional(),
					notes: z.string().optional(),
				}),
				// Optional business entities
				businesses: z
					.array(
						z.object({
							name: z.string().min(1),
							registrationNumber: z.string().optional(),
							registrationType: z.string().optional(),
							incorporationDate: z.string().datetime().optional(),
							country: z.string().optional(),
							sector: z.string().optional(),
						}),
					)
					.optional(),
				// Initial service requests
				serviceRequestIds: z.array(z.number()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Create client
			const client = await prisma.client.create({
				data: {
					...input.client,
					tenantId: ctx.tenantId,
				},
			});

			// Create businesses if provided
			const businesses = [];
			if (input.businesses && input.businesses.length > 0) {
				for (const business of input.businesses) {
					const created = await prisma.clientBusiness.create({
						data: {
							...business,
							incorporationDate: business.incorporationDate
								? new Date(business.incorporationDate)
								: null,
							clientId: client.id,
							tenantId: ctx.tenantId,
						},
					});
					businesses.push(created);
				}
			}

			// Create initial service requests if provided
			const serviceRequests = [];
			if (input.serviceRequestIds && input.serviceRequestIds.length > 0) {
				for (const serviceId of input.serviceRequestIds) {
					const service = await prisma.service.findUnique({
						where: { id: serviceId, tenantId: ctx.tenantId },
					});

					if (service) {
						const sr = await prisma.serviceRequest.create({
							data: {
								clientId: client.id,
								serviceId: serviceId,
								status: "new",
								tenantId: ctx.tenantId,
							},
						});
						serviceRequests.push(sr);
					}
				}
			}

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: client.id,
					entityType: "client",
					entityId: client.id,
					action: "create",
					changes: {
						wizard: "newClient",
						client: input.client,
						businessesCount: businesses.length,
						serviceRequestsCount: serviceRequests.length,
					},
				},
			});

			return {
				client,
				businesses,
				serviceRequests,
			};
		}),

	/**
	 * Compliance setup wizard for a client
	 * Requires: compliance:edit permission
	 */
	complianceSetup: rbacProcedure("compliance", "edit")
		.input(
			z.object({
				clientId: z.number(),
				bundleIds: z.array(z.number()),
				calculateInitialScore: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify client belongs to tenant
			const client = await prisma.client.findUnique({
				where: { id: input.clientId, tenantId: ctx.tenantId },
			});

			if (!client) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client not found",
				});
			}

			// Verify all bundles belong to tenant
			const bundles = await prisma.requirementBundle.findMany({
				where: {
					id: { in: input.bundleIds },
					tenantId: ctx.tenantId,
				},
				include: {
					items: {
						include: {
							documentType: true,
							filingType: true,
						},
					},
				},
			});

			if (bundles.length !== input.bundleIds.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "One or more bundles not found",
				});
			}

			// Calculate initial compliance score if requested
			let complianceScore = null;
			if (input.calculateInitialScore) {
				// Placeholder: Would calculate based on bundle requirements
				complianceScore = await prisma.complianceScore.upsert({
					where: {
						tenantId_clientId: {
							tenantId: ctx.tenantId,
							clientId: input.clientId,
						},
					},
					update: {
						scoreValue: 0,
						level: "high",
						missingCount: bundles.reduce(
							(sum, b) => sum + b.items.length,
							0,
						),
						expiringCount: 0,
						overdueFilingsCount: 0,
						lastCalculatedAt: new Date(),
						breakdown: {
							bundles: bundles.map((b) => ({
								id: b.id,
								name: b.name,
								authority: b.authority,
								requiredItems: b.items.length,
								completedItems: 0,
							})),
						},
					},
					create: {
						tenantId: ctx.tenantId,
						clientId: input.clientId,
						scoreValue: 0,
						level: "high",
						missingCount: bundles.reduce(
							(sum, b) => sum + b.items.length,
							0,
						),
						expiringCount: 0,
						overdueFilingsCount: 0,
						lastCalculatedAt: new Date(),
						breakdown: {
							bundles: bundles.map((b) => ({
								id: b.id,
								name: b.name,
								authority: b.authority,
								requiredItems: b.items.length,
								completedItems: 0,
							})),
						},
					},
				});
			}

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: input.clientId,
					entityType: "compliance_score",
					entityId: complianceScore?.id || 0,
					action: "create",
					changes: {
						wizard: "complianceSetup",
						bundleIds: input.bundleIds,
					},
				},
			});

			return {
				bundles,
				complianceScore,
			};
		}),

	/**
	 * Service request wizard - Create service request with steps
	 * Requires: services:create permission
	 */
	serviceRequest: rbacProcedure("services", "create")
		.input(
			z.object({
				clientId: z.number(),
				clientBusinessId: z.number().optional(),
				serviceId: z.number(),
				templateId: z.number().optional(),
				priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
				steps: z
					.array(
						z.object({
							title: z.string().min(1),
							description: z.string().optional(),
							order: z.number().int(),
							requiredDocTypeIds: z.array(z.number()).default([]),
							dueDate: z.string().datetime().optional(),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify client and service belong to tenant
			const [client, service] = await Promise.all([
				prisma.client.findUnique({
					where: { id: input.clientId, tenantId: ctx.tenantId },
				}),
				prisma.service.findUnique({
					where: { id: input.serviceId, tenantId: ctx.tenantId },
				}),
			]);

			if (!client) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client not found",
				});
			}

			if (!service) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service not found",
				});
			}

			// Create service request
			const serviceRequest = await prisma.serviceRequest.create({
				data: {
					clientId: input.clientId,
					clientBusinessId: input.clientBusinessId,
					serviceId: input.serviceId,
					templateId: input.templateId,
					priority: input.priority,
					status: "new",
					tenantId: ctx.tenantId,
				},
			});

			// Create steps if provided
			const steps = [];
			if (input.steps && input.steps.length > 0) {
				for (const step of input.steps) {
					const created = await prisma.serviceStep.create({
						data: {
							serviceRequestId: serviceRequest.id,
							title: step.title,
							description: step.description,
							order: step.order,
							status: "not_started",
							requiredDocTypeIds: step.requiredDocTypeIds,
							dueDate: step.dueDate ? new Date(step.dueDate) : null,
						},
					});
					steps.push(created);
				}

				// Update current step order
				await prisma.serviceRequest.update({
					where: { id: serviceRequest.id },
					data: { currentStepOrder: steps[0]?.order || 1 },
				});
			}

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: input.clientId,
					entityType: "service_request",
					entityId: serviceRequest.id,
					action: "create",
					changes: {
						wizard: "serviceRequest",
						stepsCount: steps.length,
					},
				},
			});

			return {
				serviceRequest,
				steps,
			};
		}),
});
