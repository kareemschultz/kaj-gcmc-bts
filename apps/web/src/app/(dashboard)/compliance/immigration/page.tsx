import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ImmigrationComplianceInterface } from "@/components/compliance/immigration-compliance-interface";
import { authClient } from "@/lib/auth-client";

/**
 * Immigration Department Compliance Page
 *
 * Comprehensive immigration compliance management featuring:
 * - Work Permit Dashboard with application status tracking
 * - Visa Processing Timeline with stage-by-stage progress
 * - Residency Permit Manager with renewal notifications
 * - Compliance Checklist with document requirements
 * - Application Analytics with processing time predictions
 */

export const metadata = {
	title: "Immigration Compliance | GCMC-KAJ",
	description:
		"Immigration compliance management for work permits, visas, and residency permits in Guyana",
};

export default async function ImmigrationCompliancePage() {
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
			<ImmigrationComplianceInterface />
		</div>
	);
}