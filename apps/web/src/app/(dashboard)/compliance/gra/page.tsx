import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GRAComplianceInterface } from "@/components/compliance/gra-compliance-interface";
import { authClient } from "@/lib/auth-client";

/**
 * GRA (Guyana Revenue Authority) Compliance Page
 *
 * Specialized dashboard for GRA tax compliance featuring:
 * - Tax Filing Calendar with monthly, quarterly, and annual deadlines
 * - VAT Return Tracker with automated calculation assistance
 * - Income Tax Dashboard with individual and corporate tracking
 * - Penalty Calculator with late fee projections
 * - Payment Schedule Manager with automated reminders
 */

export const metadata = {
	title: "GRA Tax Compliance | GCMC-KAJ",
	description:
		"Comprehensive GRA tax compliance management for VAT, income tax, corporation tax, and PAYE",
};

export default async function GRACompliancePage() {
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
			<GRAComplianceInterface />
		</div>
	);
}