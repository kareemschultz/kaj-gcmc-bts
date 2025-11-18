/**
 * EPA (Environmental Protection Agency) Compliance Module
 */

import type {
	ComplianceResult,
	FilingDeadline,
	GuyanaBusinessProfile,
} from "../types";

export const EPA_AGENCY = "EPA";

const HIGH_IMPACT_SECTORS = [
	"mining",
	"forestry",
	"manufacturing",
	"petroleum",
	"agriculture",
];

export function assessEPACompliance(
	business: GuyanaBusinessProfile,
): ComplianceResult {
	let score = 100;
	let level: any = "COMPLIANT";
	const notes: string[] = [];

	// Check if business requires environmental permit
	if (HIGH_IMPACT_SECTORS.includes(business.sector.toLowerCase())) {
		score = 50;
		level = "MAJOR_ISSUES";
		notes.push(
			"Business sector requires environmental impact assessment and permit",
		);
	}

	return {
		requirementId: "EPA_OVERALL",
		agency: "EPA",
		level,
		score,
		dueDate: new Date(),
		notes,
	};
}

export function getEPADeadlines(): FilingDeadline[] {
	return []; // Environmental reporting as needed
}
