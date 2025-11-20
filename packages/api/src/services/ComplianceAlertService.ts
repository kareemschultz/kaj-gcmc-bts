/**
 * Compliance Alert and Automated Deadline Management Service
 * Handles monitoring, alerts, and automated reminders for regulatory compliance
 */

import type {
	AgencyDeadline,
	Authority,
	ComplianceAlert,
	ComplianceLevel,
	TaskPriority,
} from "@GCMC-KAJ/types";

export interface AlertConfig {
	deadlineWarningDays: number[];
	escalationLevels: number[];
	penaltyThresholds: number[];
	notificationChannels: ("email" | "sms" | "in_app")[];
}

export interface DeadlineAnalysis {
	upcoming: AgencyDeadline[];
	overdue: AgencyDeadline[];
	atRisk: AgencyDeadline[];
	critical: AgencyDeadline[];
}

export interface ComplianceInsight {
	clientId: number;
	authority: Authority;
	riskLevel: ComplianceLevel;
	issues: string[];
	recommendations: string[];
	actionItems: string[];
	estimatedCost: number;
	timeToCompliance: number; // hours
}

/**
 * Compliance Alert Service for automated monitoring and notifications
 */
export class ComplianceAlertService {
	private defaultConfig: AlertConfig = {
		deadlineWarningDays: [30, 14, 7, 3, 1],
		escalationLevels: [0, 1, 2, 3],
		penaltyThresholds: [0, 500, 1000, 5000],
		notificationChannels: ["email", "in_app"],
	};

	constructor(
		private prisma: any,
		private config: AlertConfig = {},
	) {
		this.config = { ...this.defaultConfig, ...config };
	}

	/**
	 * Run comprehensive compliance monitoring
	 */
	async runComplianceMonitoring(tenantId: number): Promise<{
		alertsCreated: number;
		deadlinesProcessed: number;
		clientsAnalyzed: number;
		issuesFound: number;
	}> {
		console.log(`Starting compliance monitoring for tenant ${tenantId}`);

		try {
			const results = {
				alertsCreated: 0,
				deadlinesProcessed: 0,
				clientsAnalyzed: 0,
				issuesFound: 0,
			};

			// 1. Process deadline alerts
			const deadlineAlerts = await this.processDeadlineAlerts(tenantId);
			results.alertsCreated += deadlineAlerts.length;

			// 2. Process overdue items
			const overdueAlerts = await this.processOverdueItems(tenantId);
			results.alertsCreated += overdueAlerts.length;

			// 3. Check penalty accumulations
			const penaltyAlerts = await this.checkPenaltyAccumulation(tenantId);
			results.alertsCreated += penaltyAlerts.length;

			// 4. Analyze compliance scores
			const complianceAnalysis = await this.analyzeComplianceScores(tenantId);
			results.clientsAnalyzed = complianceAnalysis.clientsAnalyzed;
			results.issuesFound = complianceAnalysis.issuesFound;

			// 5. Generate system alerts
			const systemAlerts = await this.generateSystemAlerts(tenantId);
			results.alertsCreated += systemAlerts.length;

			// 6. Update deadline statuses
			results.deadlinesProcessed = await this.updateDeadlineStatuses(tenantId);

			console.log("Compliance monitoring completed:", results);
			return results;
		} catch (error) {
			console.error("Error during compliance monitoring:", error);
			throw error;
		}
	}

	/**
	 * Process deadline alerts and notifications
	 */
	async processDeadlineAlerts(tenantId: number): Promise<ComplianceAlert[]> {
		const alerts: ComplianceAlert[] = [];

		// Get upcoming deadlines that need alerts
		const deadlines = await this.getDeadlinesNeedingAlerts(tenantId);

		for (const deadline of deadlines) {
			try {
				const daysUntilDue = this.calculateDaysUntilDue(deadline.dueDate);
				const alertType = this.determineAlertType(daysUntilDue);
				const severity = this.calculateAlertSeverity(
					daysUntilDue,
					deadline.priority,
				);

				// Check if alert already exists
				const existingAlert = await this.checkExistingAlert(
					tenantId,
					deadline.clientId,
					deadline.agencyInfoId,
					alertType,
				);

				if (!existingAlert) {
					const alert = await this.createDeadlineAlert(
						tenantId,
						deadline,
						alertType,
						severity,
						daysUntilDue,
					);

					alerts.push(alert);

					// Send notifications
					await this.sendAlertNotifications(alert, deadline);
				}
			} catch (error) {
				console.error(`Error processing deadline ${deadline.id}:`, error);
			}
		}

		return alerts;
	}

	/**
	 * Process overdue items and create escalation alerts
	 */
	async processOverdueItems(tenantId: number): Promise<ComplianceAlert[]> {
		const alerts: ComplianceAlert[] = [];

		const overdueItems = await this.prisma.agencyOverdueItem.findMany({
			where: {
				tenantId,
				status: ["overdue", "penalty_accruing"],
			},
			include: {
				agencyInfo: true,
				client: true,
				requirement: true,
			},
		});

		for (const item of overdueItems) {
			try {
				// Calculate current penalty
				const currentPenalty = await this.calculateCurrentPenalty(item);

				// Update penalty amount
				await this.updateOverduePenalty(item.id, currentPenalty);

				// Check if escalation is needed
				if (this.shouldEscalateOverdueItem(item, currentPenalty)) {
					const alert = await this.createOverdueEscalationAlert(
						tenantId,
						item,
						currentPenalty,
					);

					alerts.push(alert);

					// Send escalation notifications
					await this.sendEscalationNotifications(alert, item);
				}
			} catch (error) {
				console.error(`Error processing overdue item ${item.id}:`, error);
			}
		}

		return alerts;
	}

	/**
	 * Check penalty accumulation and create alerts
	 */
	async checkPenaltyAccumulation(tenantId: number): Promise<ComplianceAlert[]> {
		const alerts: ComplianceAlert[] = [];

		const clients = await this.prisma.client.findMany({
			where: { tenantId },
			include: {
				agencyOverdueItems: true,
			},
		});

		for (const client of clients) {
			try {
				const totalPenalties = client.agencyOverdueItems.reduce(
					(sum: number, item: any) => sum + (item.accruedPenalties || 0),
					0,
				);

				// Check penalty thresholds
				for (const threshold of this.config.penaltyThresholds) {
					if (totalPenalties >= threshold && threshold > 0) {
						const existingAlert = await this.checkExistingAlert(
							tenantId,
							client.id,
							null,
							"penalty_accruing",
						);

						if (!existingAlert) {
							const alert = await this.createPenaltyAlert(
								tenantId,
								client.id,
								totalPenalties,
								threshold,
							);

							alerts.push(alert);
							break; // Only create one penalty alert per client
						}
					}
				}
			} catch (error) {
				console.error(
					`Error checking penalties for client ${client.id}:`,
					error,
				);
			}
		}

		return alerts;
	}

	/**
	 * Analyze compliance scores and generate insights
	 */
	async analyzeComplianceScores(tenantId: number): Promise<{
		clientsAnalyzed: number;
		issuesFound: number;
	}> {
		const complianceStatuses =
			await this.prisma.agencyComplianceStatus.findMany({
				where: { tenantId },
				include: {
					client: true,
					agencyInfo: true,
					requirementStatuses: true,
				},
			});

		let issuesFound = 0;

		for (const status of complianceStatuses) {
			try {
				// Check for declining compliance scores
				const previousScores = await this.getPreviousComplianceScores(
					tenantId,
					status.clientId,
					status.agencyInfoId,
				);

				if (this.isComplianceScoreDeclining(status.score, previousScores)) {
					await this.createComplianceDeclineAlert(tenantId, status);
					issuesFound++;
				}

				// Check for red compliance status
				if (status.overallStatus === "red") {
					const existingAlert = await this.checkExistingAlert(
						tenantId,
						status.clientId,
						status.agencyInfoId,
						"compliance_critical",
					);

					if (!existingAlert) {
						await this.createCriticalComplianceAlert(tenantId, status);
						issuesFound++;
					}
				}
			} catch (error) {
				console.error(
					`Error analyzing compliance for client ${status.clientId}:`,
					error,
				);
			}
		}

		return {
			clientsAnalyzed: complianceStatuses.length,
			issuesFound,
		};
	}

	/**
	 * Generate system-level alerts
	 */
	async generateSystemAlerts(tenantId: number): Promise<ComplianceAlert[]> {
		const alerts: ComplianceAlert[] = [];

		try {
			// Check for system-wide compliance issues
			const systemMetrics = await this.calculateSystemMetrics(tenantId);

			// High percentage of overdue items
			if (systemMetrics.overduePercentage > 0.2) {
				// 20%
				const alert = await this.createSystemAlert(
					tenantId,
					"system_update",
					"high",
					"High Overdue Rate",
					`${(systemMetrics.overduePercentage * 100).toFixed(1)}% of items are overdue`,
					"Review system processes and client compliance",
				);
				alerts.push(alert);
			}

			// Low average compliance score
			if (systemMetrics.averageComplianceScore < 60) {
				const alert = await this.createSystemAlert(
					tenantId,
					"system_update",
					"medium",
					"Low System Compliance",
					`Average compliance score is ${systemMetrics.averageComplianceScore.toFixed(1)}`,
					"Consider system-wide compliance review",
				);
				alerts.push(alert);
			}
		} catch (error) {
			console.error("Error generating system alerts:", error);
		}

		return alerts;
	}

	/**
	 * Update deadline statuses based on current date
	 */
	async updateDeadlineStatuses(tenantId: number): Promise<number> {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		// Update to "due_today"
		const dueTodayResult = await this.prisma.agencyDeadline.updateMany({
			where: {
				tenantId,
				dueDate: {
					gte: today,
					lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
				},
				status: "upcoming",
			},
			data: {
				status: "due_today",
			},
		});

		// Update to "overdue"
		const overdueResult = await this.prisma.agencyDeadline.updateMany({
			where: {
				tenantId,
				dueDate: {
					lt: today,
				},
				status: ["upcoming", "due_today"],
			},
			data: {
				status: "overdue",
			},
		});

		return dueTodayResult.count + overdueResult.count;
	}

	/**
	 * Get smart recommendations for compliance improvement
	 */
	async getComplianceRecommendations(
		tenantId: number,
		clientId?: number,
		authority?: Authority,
	): Promise<ComplianceInsight[]> {
		const insights: ComplianceInsight[] = [];

		const whereClause: any = { tenantId };
		if (clientId) whereClause.clientId = clientId;
		if (authority) whereClause.authority = authority;

		const complianceStatuses =
			await this.prisma.agencyComplianceStatus.findMany({
				where: whereClause,
				include: {
					client: true,
					agencyInfo: true,
					requirementStatuses: {
						include: {
							requirement: true,
						},
					},
				},
			});

		for (const status of complianceStatuses) {
			const insight: ComplianceInsight = {
				clientId: status.clientId,
				authority: status.authority as Authority,
				riskLevel: status.overallStatus as ComplianceLevel,
				issues: [],
				recommendations: [],
				actionItems: [],
				estimatedCost: 0,
				timeToCompliance: 0,
			};

			// Analyze requirement statuses
			for (const reqStatus of status.requirementStatuses) {
				if (reqStatus.status === "non_compliant") {
					insight.issues.push(`Missing: ${reqStatus.requirement.name}`);
					insight.actionItems.push(
						`Submit ${reqStatus.requirement.documentType}`,
					);

					// Estimate costs and time
					if (reqStatus.requirement.penalties) {
						const penalties = reqStatus.requirement.penalties as any;
						insight.estimatedCost += penalties.lateFilingFee || 0;
					}

					insight.timeToCompliance += 4; // Assume 4 hours per document
				}
			}

			// Generate recommendations based on issues
			if (insight.issues.length > 0) {
				insight.recommendations.push(
					`Priority: Address ${insight.issues.length} missing requirement(s)`,
				);

				if (insight.riskLevel === "red") {
					insight.recommendations.push(
						"URGENT: Immediate action required to avoid penalties",
					);
				}
			}

			insights.push(insight);
		}

		return insights;
	}

	// ===============================
	// PRIVATE HELPER METHODS
	// ===============================

	private async getDeadlinesNeedingAlerts(tenantId: number) {
		const futureDate = new Date();
		futureDate.setDate(
			futureDate.getDate() + Math.max(...this.config.deadlineWarningDays),
		);

		return await this.prisma.agencyDeadline.findMany({
			where: {
				tenantId,
				dueDate: {
					lte: futureDate,
				},
				status: ["upcoming", "due_today"],
			},
			include: {
				agencyInfo: true,
				client: true,
				requirement: true,
			},
		});
	}

	private calculateDaysUntilDue(dueDate: Date): number {
		const now = new Date();
		const due = new Date(dueDate);
		const diffTime = due.getTime() - now.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	}

	private determineAlertType(daysUntilDue: number): string {
		if (daysUntilDue <= 0) return "deadline_overdue";
		if (daysUntilDue <= 1) return "deadline_today";
		if (daysUntilDue <= 7) return "deadline_approaching";
		return "deadline_reminder";
	}

	private calculateAlertSeverity(
		daysUntilDue: number,
		priority: TaskPriority,
	): "low" | "medium" | "high" | "critical" {
		if (daysUntilDue <= 0) return "critical";
		if (daysUntilDue <= 1) return "high";
		if (daysUntilDue <= 7) {
			return priority === "urgent" ? "high" : "medium";
		}
		return "low";
	}

	private async checkExistingAlert(
		tenantId: number,
		clientId: number,
		agencyInfoId: number | null,
		alertType: string,
	): Promise<boolean> {
		const existingAlert = await this.prisma.complianceAlert.findFirst({
			where: {
				tenantId,
				clientId,
				...(agencyInfoId && { agencyInfoId }),
				type: alertType,
				acknowledged: false,
				createdAt: {
					gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
				},
			},
		});

		return !!existingAlert;
	}

	private async createDeadlineAlert(
		tenantId: number,
		deadline: any,
		alertType: string,
		severity: string,
		daysUntilDue: number,
	): Promise<ComplianceAlert> {
		const title = this.generateDeadlineAlertTitle(alertType, daysUntilDue);
		const message = this.generateDeadlineAlertMessage(deadline, daysUntilDue);

		const alert = await this.prisma.complianceAlert.create({
			data: {
				tenantId,
				clientId: deadline.clientId,
				agencyInfoId: deadline.agencyInfoId,
				authority: deadline.authority,
				type: alertType,
				severity,
				title,
				message,
				dueDate: deadline.dueDate,
				actionRequired: `Submit ${deadline.documentType}`,
				metadata: {
					deadlineId: deadline.id,
					daysUntilDue,
					priority: deadline.priority,
				},
			},
		});

		return alert as ComplianceAlert;
	}

	private generateDeadlineAlertTitle(
		alertType: string,
		daysUntilDue: number,
	): string {
		switch (alertType) {
			case "deadline_overdue":
				return "OVERDUE: Document Submission Required";
			case "deadline_today":
				return "DUE TODAY: Document Submission";
			case "deadline_approaching":
				return `DEADLINE APPROACHING: ${daysUntilDue} days remaining`;
			default:
				return "Upcoming Deadline Reminder";
		}
	}

	private generateDeadlineAlertMessage(
		deadline: any,
		daysUntilDue: number,
	): string {
		const clientName = deadline.client?.name || "Client";
		const docType = deadline.documentType;
		const authority = deadline.agencyInfo?.name || deadline.authority;

		if (daysUntilDue <= 0) {
			return `${docType} submission for ${clientName} to ${authority} is overdue by ${Math.abs(daysUntilDue)} day(s).`;
		}

		return `${docType} submission for ${clientName} to ${authority} is due in ${daysUntilDue} day(s).`;
	}

	private async sendAlertNotifications(
		alert: ComplianceAlert,
		deadline: any,
	): Promise<void> {
		// Implement notification sending logic
		console.log(`Sending notifications for alert: ${alert.title}`);
	}

	private async calculateCurrentPenalty(overdueItem: any): Promise<number> {
		const penalties = overdueItem.requirement?.penalties as any;
		if (!penalties) return 0;

		const daysOverdue = Math.max(0, overdueItem.daysOverdue);
		const dailyPenalty = penalties.dailyPenalty || 0;
		const lateFilingFee = penalties.lateFilingFee || 0;
		const maxPenalty = penalties.maximumPenalty || Number.MAX_SAFE_INTEGER;

		const totalPenalty = lateFilingFee + dailyPenalty * daysOverdue;
		return Math.min(totalPenalty, maxPenalty);
	}

	private async updateOverduePenalty(
		overdueItemId: number,
		penalty: number,
	): Promise<void> {
		await this.prisma.agencyOverdueItem.update({
			where: { id: overdueItemId },
			data: { accruedPenalties: penalty },
		});
	}

	private shouldEscalateOverdueItem(
		item: any,
		currentPenalty: number,
	): boolean {
		return (
			currentPenalty >= this.config.penaltyThresholds[1] ||
			item.daysOverdue >= 30
		);
	}

	private async createOverdueEscalationAlert(
		tenantId: number,
		item: any,
		penalty: number,
	): Promise<ComplianceAlert> {
		const alert = await this.prisma.complianceAlert.create({
			data: {
				tenantId,
				clientId: item.clientId,
				agencyInfoId: item.agencyInfoId,
				authority: item.authority,
				type: "penalty_accruing",
				severity:
					penalty >= this.config.penaltyThresholds[2] ? "critical" : "high",
				title: "PENALTY ACCRUING: Overdue Submission",
				message: `${item.description} is ${item.daysOverdue} days overdue. Penalty: $${penalty}`,
				actionRequired: "Submit immediately to stop penalty accumulation",
				metadata: {
					overdueItemId: item.id,
					penalty,
					daysOverdue: item.daysOverdue,
				},
			},
		});

		return alert as ComplianceAlert;
	}

	private async sendEscalationNotifications(
		alert: ComplianceAlert,
		item: any,
	): Promise<void> {
		console.log(`Sending escalation notifications for: ${alert.title}`);
	}

	private async createPenaltyAlert(
		tenantId: number,
		clientId: number,
		totalPenalties: number,
		threshold: number,
	): Promise<ComplianceAlert> {
		const alert = await this.prisma.complianceAlert.create({
			data: {
				tenantId,
				clientId,
				agencyInfoId: null, // System-wide alert
				authority: "GRA", // Default for penalty alerts
				type: "penalty_accruing",
				severity:
					totalPenalties >= this.config.penaltyThresholds[3]
						? "critical"
						: "high",
				title: "HIGH PENALTIES ACCRUED",
				message: `Total penalties have reached $${totalPenalties} (threshold: $${threshold})`,
				actionRequired: "Review all overdue items and submit immediately",
				metadata: {
					totalPenalties,
					threshold,
				},
			},
		});

		return alert as ComplianceAlert;
	}

	private async getPreviousComplianceScores(
		tenantId: number,
		clientId: number,
		agencyInfoId: number,
	): Promise<number[]> {
		// This would typically query historical compliance scores
		// For now, return empty array
		return [];
	}

	private isComplianceScoreDeclining(
		currentScore: number,
		previousScores: number[],
	): boolean {
		if (previousScores.length === 0) return false;
		const lastScore = previousScores[previousScores.length - 1];
		return currentScore < lastScore - 10; // 10 point decline
	}

	private async createComplianceDeclineAlert(
		tenantId: number,
		status: any,
	): Promise<void> {
		await this.prisma.complianceAlert.create({
			data: {
				tenantId,
				clientId: status.clientId,
				agencyInfoId: status.agencyInfoId,
				authority: status.authority,
				type: "compliance_declining",
				severity: "medium",
				title: "Compliance Score Declining",
				message: `Compliance score has declined to ${status.score}`,
				actionRequired: "Review compliance issues and address gaps",
			},
		});
	}

	private async createCriticalComplianceAlert(
		tenantId: number,
		status: any,
	): Promise<void> {
		await this.prisma.complianceAlert.create({
			data: {
				tenantId,
				clientId: status.clientId,
				agencyInfoId: status.agencyInfoId,
				authority: status.authority,
				type: "compliance_critical",
				severity: "critical",
				title: "CRITICAL COMPLIANCE ISSUES",
				message:
					"Client has critical compliance issues requiring immediate attention",
				actionRequired: "Immediate compliance review and remediation required",
			},
		});
	}

	private async createSystemAlert(
		tenantId: number,
		type: string,
		severity: string,
		title: string,
		message: string,
		action: string,
	): Promise<ComplianceAlert> {
		const alert = await this.prisma.complianceAlert.create({
			data: {
				tenantId,
				clientId: null, // System-wide alert
				agencyInfoId: null,
				authority: "GRA", // Default
				type,
				severity,
				title,
				message,
				actionRequired: action,
			},
		});

		return alert as ComplianceAlert;
	}

	private async calculateSystemMetrics(tenantId: number) {
		const totalDeadlines = await this.prisma.agencyDeadline.count({
			where: { tenantId },
		});

		const overdueDeadlines = await this.prisma.agencyDeadline.count({
			where: {
				tenantId,
				status: "overdue",
			},
		});

		const complianceStatuses =
			await this.prisma.agencyComplianceStatus.findMany({
				where: { tenantId },
				select: { score: true },
			});

		const averageComplianceScore =
			complianceStatuses.length > 0
				? complianceStatuses.reduce((sum, cs) => sum + cs.score, 0) /
					complianceStatuses.length
				: 0;

		return {
			overduePercentage:
				totalDeadlines > 0 ? overdueDeadlines / totalDeadlines : 0,
			averageComplianceScore,
		};
	}
}

/**
 * Factory function to create compliance alert service
 */
export function createComplianceAlertService(
	prisma: any,
	config?: Partial<AlertConfig>,
): ComplianceAlertService {
	return new ComplianceAlertService(prisma, config);
}
