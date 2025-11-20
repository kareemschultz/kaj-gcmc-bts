import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GuyanaComplianceDashboard } from "@/components/dashboard/guyana-compliance-dashboard";
import { authClient } from "@/lib/auth-client";

/**
 * Guyana Compliance Dashboard Page
 *
 * Specialized dashboard for Guyana business tax compliance
 * Features comprehensive tracking for:
 * - GRT (Goods & Services Tax)
 * - Corporation Tax
 * - PAYE (Pay As You Earn)
 * - Business registration status
 * - Compliance deadlines and penalties
 */

export const metadata = {
	title: "Guyana Tax Compliance | GCMC-KAJ",
	description:
		"Complete Guyana business tax compliance dashboard for GRA and GRT requirements",
};

export default async function GuyanaCompliancePage() {
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
			<GuyanaComplianceDashboard />
		</div>
	);
}
