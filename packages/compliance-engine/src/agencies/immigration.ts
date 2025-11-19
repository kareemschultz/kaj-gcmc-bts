/**
 * Immigration Department Compliance Module
 */

import type {
	ComplianceLevel,
	ComplianceResult,
	FilingDeadline,
	GuyanaBusinessProfile,
} from "../types";

export const IMMIGRATION_AGENCY = "IMMIGRATION";

export function assessImmigrationCompliance(
	business: GuyanaBusinessProfile,
): ComplianceResult {
	const score = 100;
	const level: ComplianceLevel = "COMPLIANT";
	const notes: string[] = [];

	// Foreign worker compliance
	if (["BRANCH", "SUBSIDIARY"].includes(business.businessType)) {
		notes.push(
			"Foreign companies must comply with work permit requirements for expatriate staff",
		);
	}

	return {
		requirementId: "IMMIGRATION_OVERALL",
		agency: "IMMIGRATION",
		level,
		score,
		dueDate: new Date(),
		notes,
	};
}

export function getImmigrationDeadlines(): FilingDeadline[] {
	return []; // Work permit renewals as needed
}
