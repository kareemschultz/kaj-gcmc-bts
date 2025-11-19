/**
 * NIS (National Insurance Scheme) Compliance Module
 *
 * Handles social security and employment-related compliance including:
 * - Employee contributions
 * - Employer contributions
 * - Employment injury insurance
 * - Maternity benefits
 * - Unemployment insurance
 */

import { addDays, addMonths } from "date-fns";
import type {
	ComplianceLevel,
	ComplianceResult,
	FilingDeadline,
	FilingHistory,
	GuyanaBusinessProfile,
} from "../types";

export const NIS_AGENCY = "NIS";

/**
 * NIS Contribution Rates (2024)
 */
export const NIS_RATES = {
	EMPLOYEE_CONTRIBUTION: 0.056, // 5.6% of insurable earnings
	EMPLOYER_CONTRIBUTION: 0.084, // 8.4% of insurable earnings
	SELF_EMPLOYED: 0.14, // 14% of declared income

	// Contribution limits
	MINIMUM_WEEKLY_EARNINGS: 3000, // GYD 3,000
	MAXIMUM_WEEKLY_EARNINGS: 100000, // GYD 100,000
	MINIMUM_ANNUAL_SELF_EMPLOYED: 156000, // GYD 156,000
};

/**
 * Calculate NIS contributions for employees
 */
export function calculateNISContributions(
	weeklyEarnings: number,
	_isEmployer = false,
): {
	employeeContribution: number;
	employerContribution: number;
	total: number;
} {
	// Apply earnings limits
	const insurableEarnings = Math.min(
		Math.max(weeklyEarnings, NIS_RATES.MINIMUM_WEEKLY_EARNINGS),
		NIS_RATES.MAXIMUM_WEEKLY_EARNINGS,
	);

	const employeeContribution =
		insurableEarnings * NIS_RATES.EMPLOYEE_CONTRIBUTION;
	const employerContribution =
		insurableEarnings * NIS_RATES.EMPLOYER_CONTRIBUTION;

	return {
		employeeContribution: Math.round(employeeContribution),
		employerContribution: Math.round(employerContribution),
		total: Math.round(employeeContribution + employerContribution),
	};
}

/**
 * Calculate NIS contributions for self-employed
 */
export function calculateSelfEmployedNIS(annualIncome: number): {
	contribution: number;
	quarterly: number;
	monthly: number;
} {
	const adjustedIncome = Math.max(
		annualIncome,
		NIS_RATES.MINIMUM_ANNUAL_SELF_EMPLOYED,
	);
	const contribution = adjustedIncome * NIS_RATES.SELF_EMPLOYED;

	return {
		contribution: Math.round(contribution),
		quarterly: Math.round(contribution / 4),
		monthly: Math.round(contribution / 12),
	};
}

/**
 * Get NIS filing deadlines
 */
export function calculateNISDeadlines(
	business: GuyanaBusinessProfile,
): FilingDeadline[] {
	const deadlines: FilingDeadline[] = [];
	const now = new Date();

	if (business.employeeCount > 0) {
		// Monthly remittance due 15th of following month
		const monthlyDue = addDays(
			addMonths(new Date(now.getFullYear(), now.getMonth(), 1), 1),
			14,
		);

		deadlines.push({
			agency: "NIS",
			filingType: "Monthly Contributions",
			dueDate: monthlyDue,
			description: "Monthly NIS contributions for employees",
			isOverdue: monthlyDue < now,
			daysUntilDue: Math.ceil(
				(monthlyDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
			),
			penalties: {
				daily: 500, // GYD 500 per day late
				maximum: 50000, // GYD 50,000 maximum
				current: 0,
			},
		});
	}

	// Self-employed quarterly contributions
	if (business.businessType === "SOLE_PROPRIETORSHIP") {
		const quarterlyDue = addDays(addMonths(now, 1), 15);

		deadlines.push({
			agency: "NIS",
			filingType: "Quarterly Self-Employed",
			dueDate: quarterlyDue,
			description: "Quarterly NIS contributions for self-employed",
			isOverdue: quarterlyDue < now,
			daysUntilDue: Math.ceil(
				(quarterlyDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
			),
			penalties: {
				daily: 200, // GYD 200 per day late
				maximum: 25000, // GYD 25,000 maximum
				current: 0,
			},
		});
	}

	return deadlines;
}

/**
 * Assess NIS compliance
 */
export function assessNISCompliance(
	business: GuyanaBusinessProfile,
	_contributionHistory: FilingHistory[] = [],
): ComplianceResult {
	const deadlines = calculateNISDeadlines(business);
	const overdueFilings = deadlines.filter((d) => d.isOverdue);

	let score = 100;
	let level: ComplianceLevel = "COMPLIANT";
	const notes: string[] = [];

	// Check NIS registration
	if (business.employeeCount > 0 && !business.nisNumber) {
		score -= 40;
		level = "CRITICAL";
		notes.push("Business must register with NIS for employee contributions");
	}

	// Check contribution compliance
	if (overdueFilings.length > 0) {
		score -= overdueFilings.length * 25;
		notes.push(`${overdueFilings.length} overdue NIS contribution(s)`);

		if (score < 60) level = "CRITICAL";
		else if (score < 80) level = "MAJOR_ISSUES";
		else level = "MINOR_ISSUES";
	}

	// Self-employed registration check
	if (
		business.businessType === "SOLE_PROPRIETORSHIP" &&
		business.annualRevenue >= NIS_RATES.MINIMUM_ANNUAL_SELF_EMPLOYED
	) {
		if (!business.nisNumber) {
			score -= 30;
			level = "MAJOR_ISSUES";
			notes.push("Self-employed individual must register with NIS");
		}
	}

	return {
		requirementId: "NIS_OVERALL",
		agency: "NIS",
		level,
		score: Math.max(0, score),
		dueDate: deadlines[0]?.dueDate || new Date(),
		daysOverdue:
			overdueFilings.length > 0
				? Math.max(...overdueFilings.map((d) => -d.daysUntilDue))
				: 0,
		penalties: overdueFilings.reduce(
			(sum, d) => sum + (d.penalties?.current || 0),
			0,
		),
		notes,
	};
}

/**
 * Get NIS forms and requirements
 */
export function getNISForms() {
	return [
		"Form NIS-1: Employer Registration",
		"Form NIS-2: Employee Registration",
		"Form NIS-3: Monthly Contribution Return",
		"Form NIS-4: Self-Employed Registration",
		"Form NIS-5: Quarterly Self-Employed Contributions",
		"Form NIS-6: Employment Injury Report",
		"Form NIS-7: Maternity Benefit Claim",
	];
}

/**
 * Calculate total annual NIS obligations for business planning
 */
export function calculateAnnualNISBudget(
	business: GuyanaBusinessProfile,
	avgMonthlyPayroll: number,
): {
	employeeContributions: number;
	employerContributions: number;
	total: number;
	selfEmployedContributions: number;
} {
	let employeeContributions = 0;
	let employerContributions = 0;
	let selfEmployedContributions = 0;

	if (business.employeeCount > 0) {
		const weeklyPayroll = (avgMonthlyPayroll * 12) / 52;
		const avgWeeklyPerEmployee = weeklyPayroll / business.employeeCount;

		const { employeeContribution, employerContribution } =
			calculateNISContributions(avgWeeklyPerEmployee);

		employeeContributions = employeeContribution * business.employeeCount * 52;
		employerContributions = employerContribution * business.employeeCount * 52;
	}

	if (business.businessType === "SOLE_PROPRIETORSHIP") {
		const { contribution } = calculateSelfEmployedNIS(business.annualRevenue);
		selfEmployedContributions = contribution;
	}

	return {
		employeeContributions,
		employerContributions,
		total:
			employeeContributions + employerContributions + selfEmployedContributions,
		selfEmployedContributions,
	};
}
