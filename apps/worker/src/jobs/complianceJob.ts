/**
 * Compliance Job - Process automated compliance tasks
 *
 * Integrates with the Guyana Compliance Engine to:
 * - Calculate compliance scores
 * - Check filing deadlines
 * - Send compliance notifications
 * - Generate compliance reports
 */

import { complianceOrchestrator } from "@GCMC-KAJ/compliance-engine";
import prisma from "@GCMC-KAJ/db";
import { emailService } from "@GCMC-KAJ/email";
import type { Job } from "bullmq";

export interface ComplianceJobData {
	type:
		| "score_refresh"
		| "deadline_check"
		| "compliance_report"
		| "penalty_calculation";
	businessId?: string;
	tenantId?: string;
	notificationThreshold?: number; // Days until deadline for notifications
}

/**
 * Process compliance job from queue
 */
export async function processComplianceJob(job: Job<ComplianceJobData>) {
	const { type, businessId, tenantId, notificationThreshold = 30 } = job.data;

	console.log(
		`[Compliance Job] Processing ${type} for business ${businessId || "all"}`,
	);

	try {
		switch (type) {
			case "score_refresh":
				return await processComplianceScoreRefresh(businessId, tenantId);

			case "deadline_check":
				return await processDeadlineCheck(
					businessId,
					tenantId,
					notificationThreshold,
				);

			case "compliance_report":
				return await processComplianceReport(businessId, tenantId);

			case "penalty_calculation":
				return await processPenaltyCalculation(businessId, tenantId);

			default:
				throw new Error(`Unknown compliance job type: ${type}`);
		}
	} catch (error) {
		console.error(`[Compliance Job] Failed to process ${type}:`, error);
		throw error;
	}
}

/**
 * Refresh compliance scores for businesses
 */
async function processComplianceScoreRefresh(
	businessId?: string,
	tenantId?: string,
) {
	const businesses = businessId
		? await prisma.clientBusiness.findMany({ where: { id: businessId } })
		: await prisma.clientBusiness.findMany({
				where: tenantId ? { client: { tenantId } } : {},
				include: { client: true },
			});

	let processed = 0;
	let updated = 0;

	for (const business of businesses) {
		try {
			// Create business profile for compliance engine
			const profile = {
				businessId: business.id,
				businessType: business.businessType as any,
				sector: business.sector || "general",
				registrationDate: business.incorporationDate || new Date(),
				tinNumber: business.taxId,
				nisNumber: business.nisNumber,
				vatRegistered: business.vatRegistered || false,
				employeeCount: business.employeeCount || 0,
				annualRevenue: business.annualRevenue
					? Number(business.annualRevenue)
					: 0,
				location: {
					region: business.region || "Georgetown",
					municipality: business.municipality,
				},
			};

			// Get compliance score
			const complianceScore =
				await complianceOrchestrator.getComplianceScore(profile);

			// Update business with new compliance data
			await prisma.clientBusiness.update({
				where: { id: business.id },
				data: {
					complianceScore: complianceScore.overall,
					complianceLevel: complianceScore.level,
					lastComplianceCheck: new Date(),
					metadata: {
						...business.metadata,
						complianceDetails: {
							byAgency: complianceScore.byAgency,
							criticalIssues: complianceScore.criticalIssues,
							lastCalculated: complianceScore.lastCalculated,
						},
					},
				},
			});

			updated++;
		} catch (error) {
			console.error(
				`Failed to update compliance for business ${business.id}:`,
				error,
			);
		}

		processed++;
	}

	console.log(
		`[Compliance Score Refresh] Processed: ${processed}, Updated: ${updated}`,
	);
	return { processed, updated };
}

/**
 * Check upcoming deadlines and send notifications
 */
async function processDeadlineCheck(
	businessId?: string,
	tenantId?: string,
	notificationThreshold = 30,
) {
	const businesses = businessId
		? await prisma.clientBusiness.findMany({
				where: { id: businessId },
				include: { client: { include: { users: true } } },
			})
		: await prisma.clientBusiness.findMany({
				where: tenantId ? { client: { tenantId } } : {},
				include: { client: { include: { users: true } } },
			});

	let processed = 0;
	let notificationsSent = 0;

	for (const business of businesses) {
		try {
			// Create business profile
			const profile = {
				businessId: business.id,
				businessType: business.businessType as any,
				sector: business.sector || "general",
				registrationDate: business.incorporationDate || new Date(),
				tinNumber: business.taxId,
				nisNumber: business.nisNumber,
				vatRegistered: business.vatRegistered || false,
				employeeCount: business.employeeCount || 0,
				annualRevenue: business.annualRevenue
					? Number(business.annualRevenue)
					: 0,
				location: {
					region: business.region || "Georgetown",
					municipality: business.municipality,
				},
			};

			// Get upcoming deadlines
			const deadlines =
				await complianceOrchestrator.getUpcomingDeadlines(profile);

			// Filter deadlines within notification threshold
			const upcomingDeadlines = deadlines.filter(
				(d) => d.daysUntilDue <= notificationThreshold && d.daysUntilDue > 0,
			);

			const overdueDeadlines = deadlines.filter((d) => d.isOverdue);

			// Send notifications if there are upcoming or overdue deadlines
			if (upcomingDeadlines.length > 0 || overdueDeadlines.length > 0) {
				// Get notification recipients (business users)
				const recipients = business.client.users.map((u) => u.email);

				for (const email of recipients) {
					if (upcomingDeadlines.length > 0) {
						await emailService.sendFilingReminder(email, {
							businessName: business.legalName,
							deadlines: upcomingDeadlines.map((d) => ({
								description: d.description,
								dueDate: d.dueDate,
								agency: d.agency,
								isOverdue: false,
								daysUntilDue: d.daysUntilDue,
							})),
							complianceScore: business.complianceScore || 0,
						});
						notificationsSent++;
					}

					if (overdueDeadlines.length > 0) {
						// Send urgent overdue notification
						await emailService.sendCustom({
							to: email,
							subject: `URGENT: Overdue Filings for ${business.legalName}`,
							html: `
                <h2>Overdue Filing Alert</h2>
                <p>The following filings are overdue for ${business.legalName}:</p>
                <ul>
                  ${overdueDeadlines
										.map(
											(d) => `
                    <li><strong>${d.description}</strong> - ${Math.abs(d.daysUntilDue)} days overdue</li>
                  `,
										)
										.join("")}
                </ul>
                <p>Please address these immediately to avoid further penalties.</p>
              `,
							metadata: {
								type: "overdue_filing_alert",
								businessId: business.id,
							},
						});
						notificationsSent++;
					}
				}
			}
		} catch (error) {
			console.error(
				`Failed to check deadlines for business ${business.id}:`,
				error,
			);
		}

		processed++;
	}

	console.log(
		`[Deadline Check] Processed: ${processed}, Notifications sent: ${notificationsSent}`,
	);
	return { processed, notificationsSent };
}

/**
 * Generate compliance reports
 */
async function processComplianceReport(businessId?: string, tenantId?: string) {
	const businesses = businessId
		? await prisma.clientBusiness.findMany({
				where: { id: businessId },
				include: { client: true },
			})
		: await prisma.clientBusiness.findMany({
				where: tenantId ? { client: { tenantId } } : {},
				include: { client: true },
			});

	let processed = 0;
	let reportsGenerated = 0;

	for (const business of businesses) {
		try {
			const profile = {
				businessId: business.id,
				businessType: business.businessType as any,
				sector: business.sector || "general",
				registrationDate: business.incorporationDate || new Date(),
				tinNumber: business.taxId,
				nisNumber: business.nisNumber,
				vatRegistered: business.vatRegistered || false,
				employeeCount: business.employeeCount || 0,
				annualRevenue: business.annualRevenue
					? Number(business.annualRevenue)
					: 0,
				location: {
					region: business.region || "Georgetown",
					municipality: business.municipality,
				},
			};

			const complianceReport =
				await complianceOrchestrator.generateComplianceReport(profile);

			// Store report in database if needed
			await prisma.clientBusiness.update({
				where: { id: business.id },
				data: {
					metadata: {
						...business.metadata,
						lastComplianceReport: {
							generatedAt: new Date(),
							summary: {
								overallScore: complianceReport.complianceScore.overall,
								level: complianceReport.complianceScore.level,
								criticalIssues: complianceReport.complianceScore.criticalIssues,
							},
							agencyBreakdown: complianceReport.complianceScore.byAgency,
						},
					},
				},
			});

			reportsGenerated++;
		} catch (error) {
			console.error(
				`Failed to generate compliance report for business ${business.id}:`,
				error,
			);
		}

		processed++;
	}

	console.log(
		`[Compliance Report] Processed: ${processed}, Reports generated: ${reportsGenerated}`,
	);
	return { processed, reportsGenerated };
}

/**
 * Calculate penalties for overdue filings
 */
async function processPenaltyCalculation(
	businessId?: string,
	tenantId?: string,
) {
	const businesses = businessId
		? await prisma.clientBusiness.findMany({
				where: { id: businessId },
				include: { client: true, filings: true },
			})
		: await prisma.clientBusiness.findMany({
				where: tenantId ? { client: { tenantId } } : {},
				include: { client: true, filings: true },
			});

	let processed = 0;
	let penaltiesCalculated = 0;

	for (const business of businesses) {
		try {
			const profile = {
				businessId: business.id,
				businessType: business.businessType as any,
				sector: business.sector || "general",
				registrationDate: business.incorporationDate || new Date(),
				tinNumber: business.taxId,
				nisNumber: business.nisNumber,
				vatRegistered: business.vatRegistered || false,
				employeeCount: business.employeeCount || 0,
				annualRevenue: business.annualRevenue
					? Number(business.annualRevenue)
					: 0,
				location: {
					region: business.region || "Georgetown",
					municipality: business.municipality,
				},
			};

			const deadlines =
				await complianceOrchestrator.getUpcomingDeadlines(profile);
			const overdueDeadlines = deadlines.filter((d) => d.isOverdue);

			for (const overdue of overdueDeadlines) {
				const daysPastDue = Math.abs(overdue.daysUntilDue);
				let penaltyAmount = 0;

				// Calculate penalty based on Guyana agency rules
				switch (overdue.agency) {
					case "GRA":
						// 2% per month for tax obligations
						penaltyAmount =
							(overdue.estimatedAmount || 0) *
							0.02 *
							Math.ceil(daysPastDue / 30);
						break;
					case "NIS":
						// 1.5% per month for NIS contributions
						penaltyAmount =
							(overdue.estimatedAmount || 0) *
							0.015 *
							Math.ceil(daysPastDue / 30);
						break;
					case "DCRA":
						// Fixed daily penalty up to maximum
						penaltyAmount = Math.min(5000, daysPastDue * 100); // GYD 100 per day, max GYD 5000
						break;
					default:
						penaltyAmount = daysPastDue * 50; // Default GYD 50 per day
				}

				if (penaltyAmount > 0) {
					// Store penalty calculation in business metadata
					const currentMetadata = business.metadata || {};
					const penalties = (currentMetadata.penalties as any[]) || [];

					const existingPenalty = penalties.find(
						(p) =>
							p.requirementId === overdue.requirementId &&
							p.agency === overdue.agency,
					);

					if (existingPenalty) {
						existingPenalty.amount = penaltyAmount;
						existingPenalty.daysPastDue = daysPastDue;
						existingPenalty.calculatedAt = new Date();
					} else {
						penalties.push({
							requirementId: overdue.requirementId,
							agency: overdue.agency,
							amount: penaltyAmount,
							daysPastDue,
							description: `Late filing penalty for ${overdue.description}`,
							calculatedAt: new Date(),
						});
					}

					await prisma.clientBusiness.update({
						where: { id: business.id },
						data: {
							metadata: {
								...currentMetadata,
								penalties,
								totalPenalties: penalties.reduce((sum, p) => sum + p.amount, 0),
							},
						},
					});

					penaltiesCalculated++;
				}
			}
		} catch (error) {
			console.error(
				`Failed to calculate penalties for business ${business.id}:`,
				error,
			);
		}

		processed++;
	}

	console.log(
		`[Penalty Calculation] Processed: ${processed}, Penalties calculated: ${penaltiesCalculated}`,
	);
	return { processed, penaltiesCalculated };
}
