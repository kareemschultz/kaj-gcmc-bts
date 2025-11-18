/**
 * DCRA (Deeds & Commercial Registry Authority) Compliance Module
 *
 * Handles business registration and corporate compliance including:
 * - Business registration and incorporation
 * - Annual returns and filing requirements
 * - Name reservations and changes
 * - Director and shareholder changes
 * - Registered office requirements
 */

import { addMonths, addYears, isBefore } from "date-fns";
import type {
	BusinessType,
	ComplianceResult,
	FilingDeadline,
	GuyanaBusinessProfile,
} from "../types";

export const DCRA_AGENCY = "DCRA";

/**
 * DCRA Filing Requirements and Fees (2024)
 */
export const DCRA_REQUIREMENTS = {
	ANNUAL_RETURNS: {
		CORPORATION: {
			fee: 15000, // GYD 15,000
			dueMonths: 12, // Due 12 months after incorporation/last filing
			lateFee: 5000, // GYD 5,000 late fee
		},
		PARTNERSHIP: {
			fee: 10000, // GYD 10,000
			dueMonths: 12,
			lateFee: 3000,
		},
		SOLE_PROPRIETORSHIP: {
			fee: 5000, // GYD 5,000
			dueMonths: 12,
			lateFee: 2000,
		},
	},

	REGISTRATION_FEES: {
		CORPORATION: 25000, // GYD 25,000
		PARTNERSHIP: 15000, // GYD 15,000
		SOLE_PROPRIETORSHIP: 10000, // GYD 10,000
		BRANCH: 30000, // GYD 30,000
		SUBSIDIARY: 25000, // GYD 25,000
	},

	NAME_RESERVATION: {
		fee: 2000, // GYD 2,000
		validityDays: 60,
	},

	CHANGE_FEES: {
		REGISTERED_OFFICE: 5000,
		DIRECTORS: 3000,
		SHARE_CAPITAL: 10000,
		BUSINESS_NAME: 8000,
	},
};

/**
 * Calculate DCRA annual return deadline
 */
export function calculateDCRADeadlines(
	business: GuyanaBusinessProfile,
): FilingDeadline[] {
	const deadlines: FilingDeadline[] = [];
	const now = new Date();

	// Annual return due 12 months after incorporation/last filing
	const requirement = DCRA_REQUIREMENTS.ANNUAL_RETURNS[business.businessType];
	if (requirement) {
		const annualReturnDue = addMonths(
			business.registrationDate,
			requirement.dueMonths,
		);

		// If the deadline has passed, calculate next year's deadline
		let nextDue = annualReturnDue;
		while (isBefore(nextDue, now)) {
			nextDue = addYears(nextDue, 1);
		}

		deadlines.push({
			agency: "DCRA",
			filingType: "Annual Return",
			dueDate: nextDue,
			description: `Annual return filing for ${business.businessType.toLowerCase()}`,
			isOverdue: isBefore(nextDue, now),
			daysUntilDue: Math.ceil(
				(nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
			),
			penalties: {
				daily: 100, // GYD 100 per day
				maximum: requirement.lateFee,
				current: 0,
			},
		});
	}

	return deadlines;
}

/**
 * Assess DCRA compliance
 */
export function assessDCRACompliance(
	business: GuyanaBusinessProfile,
	filingHistory: any[] = [],
): ComplianceResult {
	const deadlines = calculateDCRADeadlines(business);
	const overdueFilings = deadlines.filter((d) => d.isOverdue);

	let score = 100;
	let level: any = "COMPLIANT";
	const notes: string[] = [];

	// Check if business is properly registered
	if (!business.registrationDate) {
		score = 0;
		level = "CRITICAL";
		notes.push("Business is not registered with DCRA");
		return {
			requirementId: "DCRA_REGISTRATION",
			agency: "DCRA",
			level,
			score,
			dueDate: new Date(),
			notes,
		};
	}

	// Check annual return compliance
	if (overdueFilings.length > 0) {
		const overdueDays = Math.max(...overdueFilings.map((d) => -d.daysUntilDue));

		if (overdueDays > 365) {
			score = 0;
			level = "CRITICAL";
			notes.push(
				"Annual return is more than 1 year overdue - business may be struck off",
			);
		} else if (overdueDays > 180) {
			score = 20;
			level = "CRITICAL";
			notes.push("Annual return is more than 6 months overdue");
		} else if (overdueDays > 90) {
			score = 50;
			level = "MAJOR_ISSUES";
			notes.push("Annual return is more than 3 months overdue");
		} else {
			score = 75;
			level = "MINOR_ISSUES";
			notes.push("Annual return is overdue");
		}
	}

	// Check for upcoming deadlines
	const upcomingDeadlines = deadlines.filter(
		(d) => !d.isOverdue && d.daysUntilDue <= 30,
	);
	if (upcomingDeadlines.length > 0) {
		notes.push(
			`Annual return due in ${upcomingDeadlines[0].daysUntilDue} days`,
		);
	}

	return {
		requirementId: "DCRA_OVERALL",
		agency: "DCRA",
		level,
		score,
		dueDate: deadlines[0]?.dueDate || new Date(),
		lastFiledDate: filingHistory[0]?.filedDate,
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
 * Get DCRA forms and documents
 */
export function getDCRAForms(businessType: BusinessType) {
	const commonForms = [
		"Form 1: Annual Return",
		"Form 2: Change of Registered Office",
		"Form 3: Change of Directors/Partners",
		"Form 4: Name Reservation Application",
	];

	const specificForms = {
		CORPORATION: [
			"Form 5: Articles of Incorporation",
			"Form 6: Share Capital Changes",
			"Form 7: Director Appointments",
			"Form 8: Allotment of Shares",
		],
		PARTNERSHIP: [
			"Form 9: Partnership Registration",
			"Form 10: Partnership Agreement Filing",
			"Form 11: Partner Changes",
		],
		SOLE_PROPRIETORSHIP: [
			"Form 12: Business Name Registration",
			"Form 13: Proprietor Details",
		],
		BRANCH: [
			"Form 14: Branch Registration",
			"Form 15: Power of Attorney Filing",
			"Form 16: Parent Company Details",
		],
	};

	return [...commonForms, ...(specificForms[businessType] || [])];
}

/**
 * Calculate DCRA compliance costs
 */
export function calculateDCRAComplianceCosts(
	businessType: BusinessType,
	_yearsInOperation: number,
): {
	registrationFee: number;
	annualReturnFee: number;
	totalAnnualCost: number;
	projectedCosts: number[];
} {
	const registration = DCRA_REQUIREMENTS.REGISTRATION_FEES[businessType] || 0;
	const annualReturn = DCRA_REQUIREMENTS.ANNUAL_RETURNS[businessType]?.fee || 0;

	// Project costs for next 5 years
	const projectedCosts = Array.from({ length: 5 }, () => annualReturn);

	return {
		registrationFee: registration,
		annualReturnFee: annualReturn,
		totalAnnualCost: annualReturn,
		projectedCosts,
	};
}

/**
 * Get DCRA compliance checklist for new business
 */
export function getDCRAComplianceChecklist(
	businessType: BusinessType,
): string[] {
	const commonItems = [
		"Complete business name search and reservation",
		"Prepare registration documents",
		"Submit registration application with fees",
		"Obtain certificate of incorporation/registration",
		"Set up registered office in Guyana",
		"Maintain statutory records",
	];

	const specificItems = {
		CORPORATION: [
			"Draft Articles of Incorporation",
			"Appoint minimum 3 directors (2 must be Guyanese residents)",
			"Define share capital structure",
			"Conduct first board meeting",
			"Issue share certificates",
		],
		PARTNERSHIP: [
			"Draft partnership agreement",
			"Register all partners",
			"Define profit sharing arrangements",
			"Establish partnership bank account",
		],
		SOLE_PROPRIETORSHIP: [
			"Register business name",
			"Provide proprietor identification",
			"Establish business address",
		],
		BRANCH: [
			"File certified copy of parent company incorporation",
			"Provide power of attorney to local agent",
			"Submit parent company financial statements",
			"Appoint local representative",
		],
	};

	return [...commonItems, ...(specificItems[businessType] || [])];
}

/**
 * Validate business name compliance
 */
export function validateBusinessName(
	proposedName: string,
	businessType: BusinessType,
): {
	isValid: boolean;
	issues: string[];
	suggestions: string[];
} {
	const issues: string[] = [];
	const suggestions: string[] = [];

	// Basic validation rules
	if (proposedName.length < 3) {
		issues.push("Business name must be at least 3 characters long");
	}

	if (proposedName.length > 100) {
		issues.push("Business name must be less than 100 characters");
	}

	// Prohibited words
	const prohibitedWords = [
		"bank",
		"insurance",
		"trust",
		"royal",
		"government",
		"ministry",
	];
	const nameWords = proposedName.toLowerCase().split(" ");

	prohibitedWords.forEach((word) => {
		if (nameWords.includes(word)) {
			issues.push(
				`Name cannot contain the word "${word}" without special approval`,
			);
		}
	});

	// Business type suffix requirements
	const requiredSuffixes = {
		CORPORATION: ["Inc.", "Corp.", "Limited", "Ltd."],
		PARTNERSHIP: ["Partnership", "Partners", "& Co."],
	};

	if (requiredSuffixes[businessType]) {
		const hasRequiredSuffix = requiredSuffixes[businessType].some((suffix) =>
			proposedName.toLowerCase().includes(suffix.toLowerCase()),
		);

		if (!hasRequiredSuffix) {
			issues.push(
				`${businessType} must include one of: ${requiredSuffixes[businessType].join(", ")}`,
			);
			suggestions.push(
				`Consider: "${proposedName} Inc." or "${proposedName} Limited"`,
			);
		}
	}

	return {
		isValid: issues.length === 0,
		issues,
		suggestions,
	};
}
