/**
 * Guyana tRPC Router
 *
 * Handles Guyana-specific business compliance endpoints
 * Integrates with Phase 6 compliance engine for GRA/GRT requirements
 */

import { CacheKeys, cacheMiddleware } from "@GCMC-KAJ/cache";
import prisma from "@GCMC-KAJ/db";
import { cachedRbacProcedure, rbacProcedure, router } from "../index";

/**
 * Guyana router - specialized endpoints for Guyana business compliance
 */
export const guyanaRouter = router({
	/**
	 * Get overall compliance statistics for Guyana requirements
	 * Requires: compliance:view permission
	 */
	complianceStats: rbacProcedure("compliance", "view")
		.use(
			cacheMiddleware({
				ttl: 300, // 5 minutes cache
				keyBuilder: (_input, ctx) => CacheKeys.guyanaStats(ctx.tenant?.id),
				tags: [CacheKeys.tags.compliance, CacheKeys.tags.dashboard],
			}),
		)
		.query(async ({ ctx }) => {
			const [
				totalClients,
				soleTraders,
				companies,
				overdueFilings,
				upcomingDeadlines,
				totalPenalties,
				activeGRAFilings,
				compliantClients,
			] = await Promise.all([
				// Total clients count
				prisma.client.count({ where: { tenantId: ctx.tenantId } }),

				// Sole traders (business type filter)
				prisma.client.count({
					where: {
						tenantId: ctx.tenantId,
						type: "individual", // Assuming this represents sole traders
					},
				}),

				// Companies
				prisma.client.count({
					where: {
						tenantId: ctx.tenantId,
						type: "company",
					},
				}),

				// Overdue filings
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						status: { in: ["draft", "prepared"] },
						periodEnd: { lt: new Date() },
					},
				}),

				// Upcoming deadlines (next 30 days)
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						status: { in: ["draft", "prepared"] },
						periodEnd: {
							gte: new Date(),
							lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
						},
					},
				}),

				// Mock penalty calculation (placeholder)
				Promise.resolve(0),

				// Active GRA filings (mock)
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						status: "in_progress",
					},
				}),

				// Compliant clients (high compliance score)
				prisma.complianceScore.count({
					where: {
						tenantId: ctx.tenantId,
						level: "high",
					},
				}),
			]);

			return {
				totalClients,
				soleTraders,
				companies,
				overdueFilings,
				upcomingDeadlines,
				totalPenalties,
				activeGRAFilings,
				compliantClients,
			};
		}),

	/**
	 * Get GRT (Goods & Services Tax) filing status
	 * Requires: filings:view permission
	 */
	grtStatus: rbacProcedure("filings", "view")
		.use(
			cacheMiddleware({
				ttl: 180, // 3 minutes cache
				keyBuilder: (_input, ctx) => CacheKeys.grtStatus(ctx.tenant?.id),
				tags: [CacheKeys.tags.filings, CacheKeys.tags.grt],
			}),
		)
		.query(async ({ ctx }) => {
			const currentMonth = new Date();
			currentMonth.setDate(1);

			const [totalRegistered, currentCompliant, thisMonthFiled, overdue] =
				await Promise.all([
					// Total GRT-registered clients
					prisma.client.count({
						where: {
							tenantId: ctx.tenantId,
							type: { in: ["company", "individual"] }, // All business types
						},
					}),

					// Current compliant (filed on time)
					prisma.filing.count({
						where: {
							tenantId: ctx.tenantId,
							filingType: { name: { contains: "GRT" } },
							status: "filed",
							periodEnd: { gte: currentMonth },
						},
					}),

					// This month filed
					prisma.filing.count({
						where: {
							tenantId: ctx.tenantId,
							filingType: { name: { contains: "GRT" } },
							status: "filed",
							filedAt: { gte: currentMonth },
						},
					}),

					// Overdue GRT filings
					prisma.filing.count({
						where: {
							tenantId: ctx.tenantId,
							filingType: { name: { contains: "GRT" } },
							status: { in: ["draft", "prepared"] },
							periodEnd: { lt: new Date() },
						},
					}),
				]);

			return {
				totalRegistered,
				currentCompliant,
				thisMonthFiled,
				overdue,
			};
		}),

	/**
	 * Get Corporation Tax filing status
	 * Requires: filings:view permission
	 */
	corporationTaxStatus: rbacProcedure("filings", "view")
		.use(
			cacheMiddleware({
				ttl: 300, // 5 minutes cache
				keyBuilder: (_input, ctx) =>
					CacheKeys.corporationTaxStatus(ctx.tenant?.id),
				tags: [CacheKeys.tags.filings, CacheKeys.tags.corporationTax],
			}),
		)
		.query(async ({ ctx }) => {
			const [companies, filed, inProgress, dueSoon] = await Promise.all([
				// Total companies
				prisma.client.count({
					where: {
						tenantId: ctx.tenantId,
						type: "company",
					},
				}),

				// Filed corporation tax returns
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						filingType: { name: { contains: "Corporation Tax" } },
						status: "filed",
					},
				}),

				// In progress
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						filingType: { name: { contains: "Corporation Tax" } },
						status: "in_progress",
					},
				}),

				// Due soon (next 60 days)
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						filingType: { name: { contains: "Corporation Tax" } },
						status: { in: ["draft", "prepared"] },
						periodEnd: {
							gte: new Date(),
							lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
						},
					},
				}),
			]);

			return {
				companies,
				filed,
				inProgress,
				dueSoon,
			};
		}),

	/**
	 * Get PAYE (Pay As You Earn) filing status
	 * Requires: filings:view permission
	 */
	payeStatus: rbacProcedure("filings", "view")
		.use(
			cacheMiddleware({
				ttl: 240, // 4 minutes cache
				keyBuilder: (_input, ctx) => CacheKeys.payeStatus(ctx.tenant?.id),
				tags: [CacheKeys.tags.filings, CacheKeys.tags.paye],
			}),
		)
		.query(async ({ ctx }) => {
			const _currentYear = new Date().getFullYear();

			const [monthlyOnTime, monthlyLate, monthlyOutstanding, quarterlyData] =
				await Promise.all([
					// Monthly PAYE filed on time
					prisma.filing.count({
						where: {
							tenantId: ctx.tenantId,
							filingType: { name: { contains: "PAYE" } },
							status: "filed",
							filedAt: { lte: prisma.raw`"periodEnd" + interval '15 days'` }, // Filed within 15 days
						},
					}),

					// Monthly PAYE filed late
					prisma.filing.count({
						where: {
							tenantId: ctx.tenantId,
							filingType: { name: { contains: "PAYE" } },
							status: "filed",
							filedAt: { gt: prisma.raw`"periodEnd" + interval '15 days'` }, // Filed after 15 days
						},
					}),

					// Outstanding monthly PAYE
					prisma.filing.count({
						where: {
							tenantId: ctx.tenantId,
							filingType: { name: { contains: "PAYE" } },
							status: { in: ["draft", "prepared"] },
							periodEnd: { lt: new Date() },
						},
					}),

					// Quarterly data (mock)
					Promise.resolve({ current: 5, previous: 12 }),
				]);

			return {
				monthly: {
					onTime: monthlyOnTime,
					late: monthlyLate,
					outstanding: monthlyOutstanding,
				},
				quarterly: quarterlyData,
			};
		}),

	/**
	 * Get Withholding Tax status
	 * Requires: filings:view permission
	 */
	withholdingTaxStatus: rbacProcedure("filings", "view")
		.use(
			cacheMiddleware({
				ttl: 600, // 10 minutes cache (less frequent changes)
				keyBuilder: (_input, ctx) =>
					CacheKeys.withholdingTaxStatus(ctx.tenant?.id),
				tags: [CacheKeys.tags.filings, CacheKeys.tags.withholdingTax],
			}),
		)
		.query(async ({ ctx }) => {
			// Mock data for withholding tax (placeholder for future implementation)
			return {
				currentStatus: "compliant",
				totalDeducted: 15000,
				remitted: 12000,
				outstanding: 3000,
			};
		}),

	/**
	 * Get Business Registration status
	 * Requires: clients:view permission
	 */
	businessRegistrationStatus: rbacProcedure("clients", "view")
		.use(
			cacheMiddleware({
				ttl: 300, // 5 minutes cache
				keyBuilder: (_input, ctx) =>
					CacheKeys.businessRegistrationStatus(ctx.tenant?.id),
				tags: [CacheKeys.tags.compliance, CacheKeys.tags.businessRegistration],
			}),
		)
		.query(async ({ ctx }) => {
			const [active, expired, renewalsDue, pending] = await Promise.all([
				// Active registrations
				prisma.client.count({
					where: {
						tenantId: ctx.tenantId,
						status: "active",
					},
				}),

				// Expired/inactive
				prisma.client.count({
					where: {
						tenantId: ctx.tenantId,
						status: "inactive",
					},
				}),

				// Mock data for renewals and pending
				Promise.resolve(3),
				Promise.resolve(1),
			]);

			return {
				active,
				expired,
				renewalsDue,
				pending,
			};
		}),

	/**
	 * Get tax calendar with upcoming events
	 * Requires: filings:view permission
	 */
	taxCalendar: rbacProcedure("filings", "view")
		.use(
			cacheMiddleware({
				ttl: 120, // 2 minutes cache (frequently changing data)
				keyBuilder: (_input, ctx) => CacheKeys.taxCalendar(ctx.tenant?.id),
				tags: [CacheKeys.tags.filings, CacheKeys.tags.compliance],
			}),
		)
		.query(async ({ ctx }) => {
			const upcomingFilings = await prisma.filing.findMany({
				where: {
					tenantId: ctx.tenantId,
					status: { in: ["draft", "prepared"] },
					periodEnd: {
						gte: new Date(),
						lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Next 90 days
					},
				},
				include: {
					filingType: true,
					client: true,
				},
				orderBy: { periodEnd: "asc" },
				take: 10,
			});

			const upcomingEvents = upcomingFilings.map((filing) => {
				const daysUntil = Math.ceil(
					(filing.periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
				);

				return {
					title: filing.filingType.name,
					daysUntil,
					clientsAffected: 1, // Count could be aggregated
					urgency:
						daysUntil <= 7
							? "critical"
							: daysUntil <= 14
								? "warning"
								: "normal",
				};
			});

			return {
				upcomingEvents,
			};
		}),

	/**
	 * Get compliance deadlines with penalty information
	 * Requires: compliance:view permission
	 */
	complianceDeadlines: rbacProcedure("compliance", "view")
		.use(
			cacheMiddleware({
				ttl: 120, // 2 minutes cache (critical deadline data)
				keyBuilder: (_input, ctx) =>
					CacheKeys.complianceDeadlines(ctx.tenant?.id),
				tags: [CacheKeys.tags.compliance, CacheKeys.tags.filings],
			}),
		)
		.query(async ({ ctx }) => {
			const upcomingDeadlines = await prisma.filing.findMany({
				where: {
					tenantId: ctx.tenantId,
					status: { in: ["draft", "prepared"] },
					periodEnd: {
						gte: new Date(),
						lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
					},
				},
				include: {
					filingType: true,
					client: true,
				},
				orderBy: { periodEnd: "asc" },
			});

			const criticalDeadlines = upcomingDeadlines.map((deadline) => {
				const daysRemaining = Math.ceil(
					(deadline.periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
				);
				const urgency =
					daysRemaining <= 7
						? "critical"
						: daysRemaining <= 14
							? "warning"
							: "normal";

				// Mock penalty calculation based on filing type
				let penaltyAmount = 0;
				if (deadline.filingType.name.includes("GRT")) {
					penaltyAmount = 500;
				} else if (deadline.filingType.name.includes("PAYE")) {
					penaltyAmount = 250;
				} else {
					penaltyAmount = 300;
				}

				return {
					title: deadline.filingType.name,
					description: `${deadline.client.name} - Period ending ${deadline.periodEnd.toLocaleDateString()}`,
					daysRemaining,
					urgency,
					penaltyAmount,
				};
			});

			return {
				criticalDeadlines,
			};
		}),

	/**
	 * Get tax filing status breakdown
	 * Requires: filings:view permission
	 */
	taxFilingStatus: rbacProcedure("filings", "view")
		.use(
			cacheMiddleware({
				ttl: 300, // 5 minutes cache
				keyBuilder: (_input, ctx) => CacheKeys.taxFilingStatus(ctx.tenant?.id),
				tags: [CacheKeys.tags.filings],
			}),
		)
		.query(async ({ ctx }) => {
			// Mock data for tax filing status (placeholder)
			return {
				grtRegistered: 25,
				payeEmployers: 15,
				corporationTaxPayers: 8,
				withholdingAgents: 12,
			};
		}),

	/**
	 * Get filing status breakdown for dashboard
	 * Requires: filings:view permission
	 */
	filingStatus: rbacProcedure("filings", "view")
		.use(
			cacheMiddleware({
				ttl: 180, // 3 minutes cache
				keyBuilder: (_input, ctx) => CacheKeys.filingStatus(ctx.tenant?.id),
				tags: [CacheKeys.tags.filings, CacheKeys.tags.dashboard],
			}),
		)
		.query(async ({ ctx }) => {
			const [submitted, inProgress, pending, overdue] = await Promise.all([
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						status: "filed",
					},
				}),
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						status: "in_progress",
					},
				}),
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						status: { in: ["draft", "prepared"] },
						periodEnd: { gte: new Date() },
					},
				}),
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						status: { in: ["draft", "prepared"] },
						periodEnd: { lt: new Date() },
					},
				}),
			]);

			return {
				submitted,
				inProgress,
				pending,
				overdue,
			};
		}),
});
