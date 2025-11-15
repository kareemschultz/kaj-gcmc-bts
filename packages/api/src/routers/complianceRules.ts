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

			const where: Prisma.ComplianceRuleSetWhereInput = {
				tenantId: ctx.tenantId,
			};

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

			// COMPLIANCE SCORING ALGORITHM
			// Get compliance metrics
			const [
				missingCount,
				expiringCount,
				overdueFilingsCount,
				totalDocuments,
				validDocuments,
				totalFilings,
			] = await Promise.all([
				// Missing/problematic documents
				prisma.document.count({
					where: {
						clientId: input.clientId,
						status: { in: ["pending_review", "rejected"] },
					},
				}),
				// Documents expiring within 30 days
				prisma.document.count({
					where: {
						clientId: input.clientId,
						status: "valid",
						latestVersion: {
							expiryDate: {
								lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
								gte: new Date(),
							},
						},
					},
				}),
				// Overdue filings
				prisma.filing.count({
					where: {
						clientId: input.clientId,
						status: { in: ["draft", "prepared"] },
						periodEnd: { lt: new Date() },
					},
				}),
				// Total documents for percentage calculation
				prisma.document.count({
					where: { clientId: input.clientId },
				}),
				// Valid documents
				prisma.document.count({
					where: {
						clientId: input.clientId,
						status: "valid",
						latestVersion: {
							OR: [
								{ expiryDate: null },
								{ expiryDate: { gt: new Date() } },
							],
						},
					},
				}),
				// Total filings for context
				prisma.filing.count({
					where: { clientId: input.clientId },
				}),
			]);

			/**
			 * Score ranges from 0-100 where:
			 * - 100 = Perfect compliance (no issues)
			 * - 0 = Critical non-compliance
			 *
			 * Weights:
			 * - Missing/rejected documents: -10 points each (critical)
			 * - Expiring documents: -5 points each (warning)
			 * - Overdue filings: -15 points each (critical)
			 *
			 * Bonuses:
			 * - High valid document ratio: up to +10 points
			 */

			let scoreValue = 100; // Start with perfect score

			// Deduct for missing/problematic documents (critical impact)
			scoreValue -= missingCount * 10;

			// Deduct for expiring documents (warning impact)
			scoreValue -= expiringCount * 5;

			// Deduct for overdue filings (critical impact)
			scoreValue -= overdueFilingsCount * 15;

			// Add bonus for high valid document ratio
			if (totalDocuments > 0) {
				const validRatio = validDocuments / totalDocuments;
				if (validRatio >= 0.9) {
					scoreValue += 10; // 90%+ valid
				} else if (validRatio >= 0.75) {
					scoreValue += 5; // 75%+ valid
				}
			}

			// Ensure score stays within 0-100 range
			scoreValue = Math.max(0, Math.min(100, scoreValue));

			// Determine compliance level based on score
			let level: "low" | "medium" | "high";
			if (scoreValue >= 80) {
				level = "high"; // Good compliance
			} else if (scoreValue >= 50) {
				level = "medium"; // Moderate compliance
			} else {
				level = "low"; // Poor compliance
			}

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
