import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NISComplianceInterface } from "@/components/compliance/nis-compliance-interface";
import { authClient } from "@/lib/auth-client";

/**
 * NIS (National Insurance Scheme) Compliance Page
 *
 * Comprehensive NIS compliance management featuring:
 * - Employee Contribution Tracker with real-time calculations
 * - Employer Return Dashboard with submission status
 * - Compliance Certificate Manager with renewal tracking
 * - Contribution Schedule Generator with payroll integration
 * - Coverage Analysis with employee eligibility tracking
 */

export const metadata = {
	title: "NIS Compliance Management | GCMC-KAJ",
	description:
		"National Insurance Scheme compliance tracking for employee contributions, employer returns, and certificates",
};

export default async function NISCompliancePage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="container mx-auto py-8">
			<NISComplianceInterface />
		</div>
	);
}