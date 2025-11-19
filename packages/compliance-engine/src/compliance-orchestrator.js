/**
 * Guyana Compliance Orchestrator
 *
 * Central orchestration of all Guyana agency compliance requirements
 */
import { assessDCRACompliance, calculateDCRADeadlines } from "./agencies/dcra";
import { assessEPACompliance } from "./agencies/epa";
import { assessGoInvestCompliance } from "./agencies/go-invest";
import {
	assessGRACompliance,
	calculateGRADeadlines,
	calculateGRATaxes,
} from "./agencies/gra";
import { assessImmigrationCompliance } from "./agencies/immigration";
import {
	assessNISCompliance,
	calculateAnnualNISBudget,
	calculateNISDeadlines,
} from "./agencies/nis";
/**
 * Comprehensive compliance assessment for all Guyana agencies
 */
export class GuyanaComplianceOrchestrator {
	/**
	 * Get overall compliance score for a business
	 */
	async getComplianceScore(business, filingHistory = []) {
		const results = await this.getAllComplianceResults(business, filingHistory);
		// Calculate weighted scores
		const weights = {
			GRA: 0.35, // Highest weight for tax compliance
			NIS: 0.25, // High weight for employment compliance
			DCRA: 0.2, // Important for business registration
			GO_INVEST: 0.08, // Lower weight for investment incentives
			EPA: 0.07, // Important for certain sectors
			IMMIGRATION: 0.05, // Lower weight for most businesses
		};
		let weightedScore = 0;
		const byAgency = {};
		results.forEach((result) => {
			const weight = weights[result.agency] || 0;
			weightedScore += result.score * weight;
			byAgency[result.agency] = result.score;
		});
		// Determine overall compliance level
		let level = "COMPLIANT";
		const criticalIssues = results.filter((r) => r.level === "CRITICAL").length;
		if (criticalIssues > 0) {
			level = "CRITICAL";
		} else if (weightedScore < 70) {
			level = "MAJOR_ISSUES";
		} else if (weightedScore < 85) {
			level = "MINOR_ISSUES";
		}
		return {
			overall: Math.round(weightedScore),
			byAgency,
			level,
			criticalIssues,
			lastCalculated: new Date(),
		};
	}
	/**
	 * Get compliance results from all agencies
	 */
	async getAllComplianceResults(business, filingHistory = []) {
		return [
			assessGRACompliance(business, filingHistory),
			assessNISCompliance(business, filingHistory),
			assessDCRACompliance(business, filingHistory),
			assessGoInvestCompliance(business),
			assessEPACompliance(business),
			assessImmigrationCompliance(business),
		];
	}
	/**
	 * Get all upcoming filing deadlines
	 */
	async getUpcomingDeadlines(business) {
		const allDeadlines = [
			...calculateGRADeadlines(business),
			...calculateNISDeadlines(business),
			...calculateDCRADeadlines(business),
		];
		// Sort by due date
		return allDeadlines.sort(
			(a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
		);
	}
	/**
	 * Calculate comprehensive tax obligations
	 */
	async calculateTaxObligations(business, input) {
		const graTaxes = calculateGRATaxes(input);
		const nisBudget = calculateAnnualNISBudget(
			business,
			input.grossIncome / 12,
		);
		return {
			...graTaxes,
			nisContribution: nisBudget.total,
			totalDue: graTaxes.totalDue + nisBudget.total,
		};
	}
	/**
	 * Get compliance action plan
	 */
	async getComplianceActionPlan(business, filingHistory = []) {
		const results = await this.getAllComplianceResults(business, filingHistory);
		const deadlines = await this.getUpcomingDeadlines(business);
		const criticalActions = [];
		const recommendations = [];
		let estimatedCosts = 0;
		// Extract critical actions from compliance results
		results.forEach((result) => {
			if (result.level === "CRITICAL") {
				criticalActions.push(
					...result.notes.map((note) => `${result.agency}: ${note}`),
				);
			} else if (result.level === "MAJOR_ISSUES") {
				recommendations.push(
					...result.notes.map((note) => `${result.agency}: ${note}`),
				);
			}
			estimatedCosts += result.penalties || 0;
		});
		// Add upcoming deadline costs
		deadlines.forEach((deadline) => {
			if (deadline.daysUntilDue <= 30) {
				recommendations.push(
					`Upcoming: ${deadline.description} due ${deadline.dueDate.toLocaleDateString()}`,
				);
			}
		});
		return {
			criticalActions,
			upcomingDeadlines: deadlines.filter((d) => d.daysUntilDue <= 60),
			recommendations,
			estimatedCosts,
		};
	}
	/**
	 * Validate business setup for compliance
	 */
	async validateBusinessSetup(business) {
		const missingRequirements = [];
		const nextSteps = [];
		// Basic validation
		if (!business.registrationDate) {
			missingRequirements.push("Business registration with DCRA");
			nextSteps.push(
				"Register business with Deeds & Commercial Registry Authority",
			);
		}
		if (!business.tinNumber) {
			missingRequirements.push("Tax Identification Number (TIN)");
			nextSteps.push("Apply for TIN with Guyana Revenue Authority");
		}
		if (business.employeeCount > 0 && !business.nisNumber) {
			missingRequirements.push("National Insurance Scheme registration");
			nextSteps.push("Register with NIS for employee contributions");
		}
		if (business.annualRevenue >= 10000000 && !business.vatRegistered) {
			missingRequirements.push("VAT registration (revenue exceeds GYD 10M)");
			nextSteps.push("Register for VAT with Guyana Revenue Authority");
		}
		return {
			isValid: missingRequirements.length === 0,
			missingRequirements,
			nextSteps,
		};
	}
	/**
	 * Generate compliance summary report
	 */
	async generateComplianceReport(business, filingHistory = []) {
		const [
			complianceScore,
			agencyResults,
			upcomingDeadlines,
			actionPlan,
			validationResults,
		] = await Promise.all([
			this.getComplianceScore(business, filingHistory),
			this.getAllComplianceResults(business, filingHistory),
			this.getUpcomingDeadlines(business),
			this.getComplianceActionPlan(business, filingHistory),
			this.validateBusinessSetup(business),
		]);
		return {
			business,
			complianceScore,
			agencyResults,
			upcomingDeadlines,
			actionPlan,
			validationResults,
			generatedAt: new Date(),
		};
	}
}
// Export singleton instance
export const complianceOrchestrator = new GuyanaComplianceOrchestrator();
// Export for direct usage
export {
	calculateGRATaxes,
	calculateNISContributions,
	calculateSelfEmployedNIS,
	getDCRAForms,
	getGRAForms,
	getNISForms,
	validateBusinessName,
} from "./agencies";
