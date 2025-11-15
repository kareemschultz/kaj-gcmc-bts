/**
 * Compliance Rules tRPC Router
 *
 * Handles compliance rules and rule sets for scoring
 * Enforces tenant isolation and RBAC permissions
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Compliance rule set validation schema
 */
export const ruleSetSchema = z.object({
	name: z.string().min(1).max(255),
	appliesTo: z.record(z.string(), z.any()).optional(),
	active: z.boolean().default(true),
});

/**
 * Compliance rule validation schema
 */
export const complianceRuleSchema = z.object({
	ruleSetId: z.number(),
	ruleType: z.string().min(1),
	condition: z.record(z.string(), z.any()).optional(),
	targetId: z.number().optional(),
	weight: z.number(),
	description: z.string().optional(),
});

/**
 * Compliance Rules router
 */
export const complianceRulesRouter = router({
	/**
	 * List rule sets
	 * Requires: compliance:view permission
	 */
	listRuleSets: rbacProcedure("compliance", "view")
		.input(
			z
				.object({
					active: z.boolean().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { active } = input || {};

			const where: Prisma.ComplianceRuleWhereInput = { tenantId: ctx.tenantId };

			if (active !== undefined) where.active = active;

			const ruleSets = await prisma.complianceRuleSet.findMany({
				where,
				orderBy: { name: "asc" },
				include: {
					_count: {
						select: { rules: true },
					},
				},
			});

			return ruleSets;
		}),

	/**
	 * Get single rule set by ID
	 * Requires: compliance:view permission
	 */
	getRuleSet: rbacProcedure("compliance", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const ruleSet = await prisma.complianceRuleSet.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				include: {
					rules: {
						orderBy: { weight: "desc" },
					},
				},
			});

			if (!ruleSet) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Rule set not found",
				});
			}

			return ruleSet;
		}),

	/**
	 * Create rule set
	 * Requires: compliance:edit permission
	 */
	createRuleSet: rbacProcedure("compliance", "edit")
		.input(ruleSetSchema)
		.mutation(async ({ ctx, input }) => {
			const ruleSet = await prisma.complianceRuleSet.create({
				data: {
					...input,
					tenantId: ctx.tenantId,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "compliance_rule_set",
					entityId: ruleSet.id,
					action: "create",
					changes: { created: input },
				},
			});

			return ruleSet;
		}),

	/**
	 * Update rule set
	 * Requires: compliance:edit permission
	 */
	updateRuleSet: rbacProcedure("compliance", "edit")
		.input(
			z.object({
				id: z.number(),
				data: ruleSetSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.complianceRuleSet.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Rule set not found",
				});
			}

			const updated = await prisma.complianceRuleSet.update({
				where: { id: input.id },
				data: input.data,
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "compliance_rule_set",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete rule set
	 * Requires: compliance:edit permission
	 */
	deleteRuleSet: rbacProcedure("compliance", "edit")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.complianceRuleSet.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Rule set not found",
				});
			}

			await prisma.complianceRuleSet.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "compliance_rule_set",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Create compliance rule
	 * Requires: compliance:edit permission
	 */
	createRule: rbacProcedure("compliance", "edit")
		.input(complianceRuleSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify rule set belongs to tenant
			const ruleSet = await prisma.complianceRuleSet.findUnique({
				where: { id: input.ruleSetId, tenantId: ctx.tenantId },
			});

			if (!ruleSet) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Rule set not found",
				});
			}

			const rule = await prisma.complianceRule.create({
				data: input,
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "compliance_rule",
					entityId: rule.id,
					action: "create",
					changes: { created: input },
				},
			});

			return rule;
		}),

	/**
	 * Update compliance rule
	 * Requires: compliance:edit permission
	 */
	updateRule: rbacProcedure("compliance", "edit")
		.input(
			z.object({
				id: z.number(),
				data: complianceRuleSchema.partial().omit({ ruleSetId: true }),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.complianceRule.findUnique({
				where: { id: input.id },
				include: { ruleSet: true },
			});

			if (!existing || existing.ruleSet.tenantId !== ctx.tenantId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Compliance rule not found",
				});
			}

			const updated = await prisma.complianceRule.update({
				where: { id: input.id },
				data: input.data,
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "compliance_rule",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete compliance rule
	 * Requires: compliance:edit permission
	 */
	deleteRule: rbacProcedure("compliance", "edit")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.complianceRule.findUnique({
				where: { id: input.id },
				include: { ruleSet: true },
			});

			if (!existing || existing.ruleSet.tenantId !== ctx.tenantId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Compliance rule not found",
				});
			}

			await prisma.complianceRule.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "compliance_rule",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get compliance score for a client
	 * Requires: compliance:view permission
	 */
	getScore: rbacProcedure("compliance", "view")
		.input(z.object({ clientId: z.number() }))
		.query(async ({ ctx, input }) => {
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

			const score = await prisma.complianceScore.findUnique({
				where: {
					tenantId_clientId: {
						tenantId: ctx.tenantId,
						clientId: input.clientId,
					},
				},
			});

			return score;
		}),

	/**
	 * Calculate and update compliance score for a client
	 * Requires: compliance:edit permission
	 */
	calculateScore: rbacProcedure("compliance", "edit")
		.input(z.object({ clientId: z.number() }))
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

			// TODO: Implement compliance scoring logic
			// This is a placeholder - actual implementation would calculate based on rules
			const scoreValue = 75.0;
			const level = "medium";

			// Get counts for breakdown
			const [missingCount, expiringCount, overdueFilingsCount] =
				await Promise.all([
					prisma.document.count({
						where: {
							clientId: input.clientId,
							status: { in: ["pending_review", "rejected"] },
						},
					}),
					prisma.document.count({
						where: {
							clientId: input.clientId,
							latestVersion: {
								expiryDate: {
									lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
									gte: new Date(),
								},
							},
						},
					}),
					prisma.filing.count({
						where: {
							clientId: input.clientId,
							status: { in: ["draft", "prepared"] },
							periodEnd: { lt: new Date() },
						},
					}),
				]);

			// Upsert compliance score
			const score = await prisma.complianceScore.upsert({
				where: {
					tenantId_clientId: {
						tenantId: ctx.tenantId,
						clientId: input.clientId,
					},
				},
				update: {
					scoreValue,
					level,
					missingCount,
					expiringCount,
					overdueFilingsCount,
					lastCalculatedAt: new Date(),
					breakdown: {
						documents: missingCount,
						expiring: expiringCount,
						overdue: overdueFilingsCount,
					},
				},
				create: {
					tenantId: ctx.tenantId,
					clientId: input.clientId,
					scoreValue,
					level,
					missingCount,
					expiringCount,
					overdueFilingsCount,
					lastCalculatedAt: new Date(),
					breakdown: {
						documents: missingCount,
						expiring: expiringCount,
						overdue: overdueFilingsCount,
					},
				},
			});

			return score;
		}),
});
