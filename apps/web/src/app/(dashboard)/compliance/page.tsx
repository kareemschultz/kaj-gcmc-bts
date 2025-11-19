import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AgencyComplianceDashboard } from "@/components/compliance/agency-compliance-dashboard";
import { authClient } from "@/lib/auth-client";

/**
 * Main Agency Compliance Dashboard Page
 *
 * Comprehensive multi-agency compliance overview featuring:
 * - Real-time health indicators across all agencies
 * - Visual compliance scores with trend analysis
 * - Urgent alerts and deadline notifications
 * - Quick action buttons for common tasks
 * - Interactive agency cards with detailed status
 * - Cross-agency dependency tracking
 */

export const metadata = {
	title: "Agency Compliance Dashboard | GCMC-KAJ",
	description:
		"Comprehensive oversight of Guyana regulatory compliance across GRA, NIS, DCRA, and Immigration",
};

export default async function CompliancePage() {
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
			<AgencyComplianceDashboard />
		</div>
	);
}